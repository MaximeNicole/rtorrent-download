var Rtorrent = require('node-rtorrent');
var parseTorrentName = require('parse-torrent-name');
var path = require('path');

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
    this.get(timestamp, function (data) {
      data.torrents.forEach(function (torrent) {
        if (torrent.complete) {
          var values = {
            hash: torrent.hash,
            name: torrent.name,
            size: torrent.size,
            files: torrent.files,
            details: torrent.details
          };
          Torrent.create(values).exec(function (err, records) {
            if (err) {
              sails.log.error(err);
            } else {
              sails.log.verbose("Add records to Torrent's model.", records);
            }
          });
        }
      });
    });
  },

  downloadTorrents: function () {
    var date = new Date();
    var startCron = date.getTime();
    sails.log.verbose('Start CRON', startCron);
    var stopCron = Math.floor(startCron + (6 * 60 * 60 * 1000));
    sails.log.verbose('Stop CRON', stopCron);
    // On regarde en base de données s'il y a des torrents non verrouillé et non téléchargé.
    Torrent.find({downloaded: false, locked: false}).exec(function (err, records) {
      if (err) {
        sails.log.error('downloadTorrents', err);
      } else {
        if (records.length > 0) {
          iterT = 0;
          function iterTorrent() {
            var date = new Date();
            var now = date.getTime();
            sails.log.verbose('Now', now);
            if(typeof(records[iterT]) !== 'undefined' && now < stopCron) {
              downloadTorrent(records[iterT], function () {
                iterT++;
                iterTorrent();
              })
            }
          }
          iterTorrent();

          function downloadTorrent(torrent, cbT) {
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