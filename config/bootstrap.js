/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function (done) {

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  // Dévérouille tous les torrents
  Torrent.find({locked: true}).exec(function (err, records) {
    if (err) {
      sails.log.error(err);
    } else {
      records.forEach(function (record) {
        Torrent.update({id: record.id}, {locked: false}).exec(function (err, updated) {
          if (err) {
            sails.log.error(err);
          } else {
            sails.log.verbose('Unlock torrent', updated.hash);
          }
        });
      });
    }
  });


  // Todo: Mettre en place les CRON d'initialisation

  // CRON: getLastTorrents
  CronService.addCron('getLastTorrents', '00 00 * * * *', function () {
    //CronService.addCron('getLastTorrents', '00 * * * * *', function () { // Test
    var date = new Date();
    var timestamp = Math.floor((date.getTime() / 1000) - (60 * 60)); // MODIFY HERE IF CHANGE CRON PARAM
    sails.log.verbose('Start CRON', 'getLastTorrents', timestamp);
    TorrentService.addTorrentModel(timestamp);
  });

  // CRON: downloadTorrents
  CronService.addCron('downloadTorrents', '00 00 11 * * 1-5', function () {
    sails.log.verbose('Start CRON', 'downloadTorrents');
    var date = new Date();
    var startCron = date.getTime();
    sails.log.verbose('Start CRON', startCron);
    var stopCron = Math.floor(startCron + (6 * 60 * 60 * 1000)); // MODIFY HERE IF CHANGE CRON PARAM
    sails.log.verbose('Stop CRON', stopCron);
    TorrentService.downloadTorrents(stopCron);
  });

  var lock = false;
  CronService.addCron('copyTorrents', '00,15,30,45 * * * * *', function () {
    sails.log.verbose('Start CRON', 'copyTorrents');
    /*DiskService.isMounted(function (isMounted) {
      if(isMounted && !lock) {
        sails.log.silly(sails.config.torrent.disk.driveName, 'is mounted.', 'Launching operation!');
        lock = true;
      } else {
        if(isMounted && lock) {
          sails.log.silly(sails.config.torrent.disk.driveName, 'is mounted.', 'Operation in progress!');
        } else {
          sails.log.silly(sails.config.torrent.disk.driveName, 'is not mounted.');
          lock = false;
        }
      }
    });*/
  });

  done();
};
