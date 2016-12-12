var Rtorrent = require('node-rtorrent');
var parseTorrentName = require('parse-torrent-name');
var path = require('path');
var Q = require('q');

var rtorrent = new Rtorrent(sails.config.torrent.rtorrent);

var TorrentService = {
  get: function (timestamp, cb) {
    getLiteDetails(function (data) {
      if (data.err) {
        cb(data);
      } else {
        var torrentsData = [];
        if (timestamp !== 0) {
          data.forEach(function (torrent) {
            if (torrent.addedAt > timestamp) { // Need add field "addedAt" in module node-rtorrent
              torrentsData.push(torrent);
            }
          });
        } else {
          torrentsData = data;
        }

        var details = {};
        details.err = false;
        details.count = torrentsData.length;
        details.torrents = torrentsData;

        cb(details);
      }
    });
  },

  addTorrentModel: function (timestamp) {
    sails.log.debug('addTorrentModel');
    this.get(timestamp, function (data) {

      if(data.count !== 0) {

        var countTorrent = data.count;
        var iterTorrent = 0;
        createTorrent(iterTorrent);
        function createTorrent(i) {
          if (i < countTorrent) {
            sails.log.debug('Create torrent', data.torrents[i].name);

            var countFile = data.torrents[i].files.length;
            var iterFile = 0;
            var filesId = [];
            createFile(iterFile);
            function createFile(j) {
              sails.log.debug('j', j);
              sails.log.debug('countFile', countFile);
              if (j < countFile) {
                sails.log.debug('Create file', data.torrents[i].files[j].name);


                function createFileModel() {
                  var deferred = Q.defer();
                  sails.log.debug('function', 'createFileModel');
                  File.create(data.torrents[i].files[j]).exec(function (err, file) {
                    if (err) {
                      sails.log.error(err);
                      deferred.reject(err);
                    } else {
                      sails.log.debug('File id', file.id);
                      deferred.resolve(file);
                    }
                  });
                  return deferred.promise;
                }

                var promise = Q.fcall(createFileModel);
                promise.then(function (value) {
                  sails.log.debug('File created', value.id);
                  filesId.push(value.id);
                  iterFile++;
                  createFile(iterFile);
                }, function (err) {
                  sails.log.debug('File not created', err);
                  iterFile++;
                  createFile(iterFile);
                });

              } else {
                sails.log.debug('All files created.');

                function createTorrentModel() {
                  var deferred = Q.defer();
                  sails.log.debug('function', 'createTorrentModel');
                  var values = {
                    hash: data.torrents[i].hash,
                    name: data.torrents[i].name,
                    size: data.torrents[i].size,
                    files: filesId,
                    details: data.torrents[i].details
                  };
                  Torrent.create(values).exec(function (err, records) {
                    if (err) {
                      sails.log.error(err);
                      deferred.reject(err);
                    } else {
                      sails.log.verbose("Add records to Torrent's model.", records.id);
                      deferred.resolve(records);
                    }
                  });
                  return deferred.promise;
                }

                var promise2 = Q.fcall(createTorrentModel);
                promise2.then(function (value) {
                  sails.log.debug('Torrent created', value.id);
                  iterTorrent++;
                  createTorrent(iterTorrent);
                }, function (err) {
                  sails.log.debug('Torrent not created', err);
                  iterTorrent++;
                  createTorrent(iterTorrent);
                });
              }
            }

          } else {
            sails.log.debug('All torrent created.');
          }
        }

      } else {
        sails.log.verbose('No new torrents.');
      }

    });
  },

  downloadTorrents: function (stopCron) {
    sails.log.debug('downloadTorrents');
    // On regarde en base de données s'il y a des torrents non verrouillé et non téléchargé.
    Torrent.find({downloaded: false, locked: false}).populate('files').exec(function (err, records) {
      if (err) {
        sails.log.error('downloadTorrents', err);
      } else {
        sails.log.debug(records.length);
        if (records.length > 0) {
          iterT = 0;
          function iterTorrent() {
            sails.log.debug('iterTorrent');
            var date = new Date();
            var now = date.getTime();
            sails.log.verbose('Now', now);
            if (typeof(records[iterT]) !== 'undefined' && now < stopCron) {
              sails.log.debug('iterTorrent record', records[iterT]);
              downloadTorrent(records[iterT], function () {
                iterT++;
                iterTorrent();
              })
            }
          }

          iterTorrent();

          function downloadTorrent(torrent, cbT) {
            sails.log.debug('downloadTorrent');
            // On vérouille le torrent pour ne pas que le script repasse dessus.
            Torrent.update({id: torrent.id}, {locked: true}).exec(function (err) {
              if (err) {
                sails.log.error('downloadTorrents', err);
              } else {
                var filesNumber = torrent.files.length;
                var filesDownloaded = [];

                if (filesNumber == 1) {
                  downloadFile(torrent.files[0], function () {
                    // Nothing
                  });
                } else {
                  var iter = 0;
                  iterFiles();
                }

                // Itération sur les fichiers pour les télécharger un par un.
                function iterFiles() {
                  if (typeof torrent.files[iter] !== 'undefined') {
                    downloadFile(torrent.files[iter], function () {
                      iter++;
                      iterFiles();
                    })
                  }
                }

                // Téléchargement d'un fichier.
                function downloadFile(item, cb) {
                  var dest = sails.config.torrent.destination + item.name;
                  DownloadTorrentService.get(torrent.hash, iter, dest, function () {
                    filesDownloaded.push({index: iter});
                    cb();
                  });
                }

                // On vérifie toutes les 5 minutes que tous les fichiers ont été téléchargé.
                verify();
                function verify() {
                  setTimeout(function () {
                    if (filesDownloaded.length == filesNumber) {
                      var date = new Date();
                      // Si tous les fichiers ont été téléchargé on dévérouille le torrent.
                      Torrent.update({id: torrent.id}, {
                        locked: false,
                        downloaded: true,
                        dateDownloaded: date
                      }).exec(function (err) {
                        if (err) {
                          sails.log.error('downloadTorrents', err);
                          cbT();
                        } else {
                          sails.log.verbose('downloadTorrents', 'File hash:', torrent.hash, 'successful downloaded.');
                          cbT();
                        }
                      });
                    } else {
                      verify();
                    }
                  }, 300000);
                }

              }
            });
          }
        } else {
          sails.log.verbose('downloadTorrents', "No Torrent's records found to download.")
        }
      }
    });
  }
};

function getLiteDetails(cb) {

  rtorrent.getAll(function (err, data) {
    if (err) {
      sails.log.error(err);
      cb({err: err});
    } else {
      var torrents = [];
      data.torrents.forEach(function (torrent) {

        var files = [];
        torrent.files.forEach(function (file) {
          files.push({
            name: file.path,
            size: file.size,
            ext: getExtension(file.path)
          })
        });

        torrents.push({
          name: torrent.name,
          hash: torrent.hash,
          size: torrent.size,
          addedAt: torrent.addedAt,
          complete: !!torrent.complete, // type: boolean
          files: files,
          details: parseTorrentName(torrent.name)
          //debug: torrent
        });

      });

      cb(torrents);
    }
  });

}

function getExtension(filename) {
  var ext = path.extname(filename || '').split('.');
  return ext[ext.length - 1];
}

module.exports = TorrentService;
