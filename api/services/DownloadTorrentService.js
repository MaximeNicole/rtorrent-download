var http = https = require('https');
var fs = require('fs');


var auth = 'Basic ' + new Buffer(sails.config.torrent.authorization).toString('base64');

var DownloadTorrentService = {
  get: function (hash, no, dest, cb) {
    var file = fs.createWriteStream(dest);
    var options = {
      host: sails.config.torrent.host,
      port: sails.config.torrent.port,
      path: sails.config.torrent.path + '?hash=' + hash + '&no=' + no,
      method: 'GET',
      headers: {
        'Authorization': auth
      },
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    };
    http.get(options, function (response) {
      response.pipe(file);
      file.on('finish', function () {
        file.close(function () {
          cb({finish: true});
        });
      });
    });
  }

};





module.exports = DownloadTorrentService;
