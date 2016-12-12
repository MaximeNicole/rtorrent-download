/**
 * TorrentController
 *
 * @description :: Server-side logic for managing torrents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  test: function (req, res) {
    DiskService.getDrives(function (err, drives) {
      sails.log.debug('drives', drives);
      for (var i = 0; i < drives.length; i++) {
        if (drives[i].mountpoint.indexOf(sails.config.torrent.disk.driveName) !== -1) {
          sails.log.debug(drives[i].mountpoint);

          // Remove files in folder "folderDelete"
          sails.log.debug('Remove files in folder "folderDelete"');
          var removePath = drives[i].mountpoint + sails.config.torrent.disk.folderDelete;
          DiskService.removeFiles(removePath, 'watched', function (err) {
            if (err) {
              sails.log.error(err);
            }
          });

          // Remove files in folder "folderRubbish"
          sails.log.debug('Remove files in folder "folderRubbish"');
          var rubbishPath = drives[i].mountpoint + sails.config.torrent.disk.folderRubbish;
          DiskService.removeFiles(rubbishPath, 'rubbish', function (err) {
            if (err) {
              sails.log.error(err);
            }
          });

          // Copy new files in folder "folderCopy"
          sails.log.debug('Copy new files in folder "folderCopy"');
          var localPath = sails.config.torrent.destination;
          sails.log.debug(localPath);
          var copyPath = drives[i].mountpoint + sails.config.torrent.disk.folderCopy + '/';
          sails.log.debug(copyPath);
          DiskService.copyFiles(localPath, copyPath, drives[i].available, function (err) {
            if (err) {
              sails.log.error(err);
            }
          });
        }
      }
    });
    res.json({});
  },

  test2: function (req, res) {
    TorrentService.addTorrentModel(1481522420);
    res.json({});
  },

  test3: function (req, res) {
    TorrentService.downloadTorrents(14815692200000);
    res.json({});
  }
};

