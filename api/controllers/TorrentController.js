/**
 * TorrentController
 *
 * @description :: Server-side logic for managing torrents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  test: function (req, res) {
    DiskService.getDrives(function (err, drives) {
      for (var i = 0; i < drives.length; i++) {
        if (drives[i].mountpoint.indexOf(sails.config.torrent.disk.driveName) !== -1) {
          sails.log.debug(drives[i].mountpoint);

          // Remove files in folder "folderDelete"
          var removePath = drives[i].mountpoint + sails.config.torrent.disk.folderDelete;
          DiskService.removeFiles(removePath, function (err) {
            if (err) {
              sails.log.error(err);
            }
          });

          // Copy new files in folder "folderCopy"
          var localPath = sails.config.torrent.destination;
          var copyPath = drives[i].mountpoint + sails.config.torrent.disk.folderCopy;
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
    TorrentService.addTorrentModel(1481195446);
    res.json({});
  },

  test3: function (req, res) {
    TorrentService.downloadTorrents(0, 0);
    res.json({});
  }
};

