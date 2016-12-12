var njds = require('nodejs-disks');
var fs = require('fs');
var fse = require('fs-extra');
var player = require('play-sound')(opts = {});
var Q = require('q');

var DiskService = {
  getDrives: function (cb) {
    njds.drives(
      function (err, drives) {
        njds.drivesDetail(
          drives,
          function (err, data) {
            if (err) {
              sails.log.err(err);
              cb(err);
            } else {
              cb(false, data);
            }
          }
        );
      }
    )
  },

  isMounted: function (cb) {
    this.getDrives(function (err, drives) {
      if (err) {
        sails.log.error(err);
        cb(false);
      } else {
        for (var i = 0; i < drives.length; i++) {
          if (drives[i].mountpoint.indexOf(sails.config.torrent.disk.driveName) !== -1) {
            cb(true);
            i = 1000;
          }
        }
        if (i < 1000) {
          cb(false);
        }
      }
    });
  },

  removeFiles: function (from, status, cb) {
    fs.readdir(from, function (err, files) {
      if (err) {
        removeFilesFolder();
        cb(err);
      } else {
        if (files.length === 0) {
          sails.log.debug('No files in this folder.');
          cb(false);
        } else {

          var numbFiles = files.length;
          var iterFiles = 0;

          function updateFile(i) {
            if (i < numbFiles) {

              function updateFileModel() {
                var deferred = Q.defer();
                File.update({name: files[i].name}, {status: status}).exec(function (err, update) {
                  if (err) {
                    deferred.reject(err);
                  } else {
                    if (update.length == 0) {
                      deferred.resolve('File not found in database!');
                    } else {
                      deferred.resolve(false);
                    }
                  }
                });
                return deferred.promise;
              }

              var promise = Q.fcall(updateFileModel);
              promise.then(function (err) {
                if(err) {
                  sails.log.warn(err);
                }
                iterFiles++;
                updateFile(iterFiles);
              }, function (err) {
                if(err) {
                  sails.log.err(err);
                }
                iterFiles++;
                updateFile(iterFiles);
              })

            } else {
              sails.log.debug('All files updated', 1);
              removeFilesFolder();
            }
          }
          updateFile(0);

          function removeFilesFolder() {
            sails.log.debug('Remove files from', from);
            fse.emptyDir(from, function (err) {
              if (err) {
                cb(err);
              } else {
                cb(false);
              }
            }, function () {
              sails.log.error('Unknow');
            });
          }

        }
      }
    });
  },

  copyFiles: function (from, to, size, cb) {
    var freeDisk = 0;
    if (size.indexOf('KB')) {
      freeDisk = parseInt(size) * 1024;
    }
    if (size.indexOf('MB')) {
      freeDisk = parseInt(size) * 1024 * 1024;
    }
    if (size.indexOf('GB')) {
      freeDisk = parseInt(size) * 1024 * 1024 * 1024;
    }
    if (size.indexOf('TB')) {
      freeDisk = parseInt(size) * 1024 * 1024 * 1024 * 1024;
    }

    Torrent.find({downloaded: true, copied: false}).populate('files').exec(function (err, records) {
      if (err) {
        cb(err);
      } else {

        for (var i = 0; i < records.length; i++) {
          if (records[i].size < freeDisk) {
            for (var j = 0; j < records[i].files.length; j++) {
              sails.log.debug(records[i].files[j].name);
              sails.log.debug('from', from + records[i].files[j].name);
              sails.log.debug('to', to + records[i].files[j].name);
              if (fs.existsSync(from + records[i].files[j].name)) {
                fse.copySync(from + records[i].files[j].name, to + records[i].files[j].name);
              }
            }
          }
          freeDisk -= records[i].size;
          var date = new Date();
          Torrent.update({id: records[i].id}, {copied: true, copiedDate: date}).exec(function (err) {
            sails.log.error(err);
          });
        }

        player.play('assets/sounds/finish.wav', function (err) {
          if (err) {
            cb(err);
          } else {
            cb(false);
          }
        });

      }
    });
  }
};

module.exports = DiskService;
