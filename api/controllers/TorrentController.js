/**
 * TorrentController
 *
 * @description :: Server-side logic for managing torrents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  streamingListFile: function (req, res) {
    Torrent.find().populate('files').exec(function(err, torrents) {
      if(err) {
        return res.badRequest(err);
      } else {
        res.view('', {torrents: torrents});
      }
    });
  },

  streamingWatch: function (req, res) {
    File.findOne({id: req.params.fileID}).populate('torrent').exec(function (err, file) {
      if (err) {
        return res.badRequest(err);
      } else {
        if (file) {
          var parseTorrentName = require('parse-torrent-name');
          res.view('', {fileID: req.params.fileID, name: file.name, details: parseTorrentName(file.name), torrent: file.torrent});
        }
      }
    });
  },

  streamingWatchFlux: function (req, res) {
    var ffmpeg = require('fluent-ffmpeg');

    File.findOne({id: req.params.fileID}).exec(function (err, file) {
      if(err) {
        return res.badRequest(err);
      } else {
        if(file) {
          res.contentType('flv');
          var pathToMovie = sails.config.torrent.destination + file.name;
          var proc = ffmpeg(pathToMovie)
            // use the 'flashvideo' preset (located in /lib/presets/flashvideo.js)
            .preset('flashvideo')
            // setup event handlers
            .on('end', function() {
              console.log('file has been converted succesfully');
            })
            .on('error', function(err) {
              console.log('an error happened: ' + err.message);
            })
            // save to stream
            .pipe(res, {end:true});
        } else {
          return res.badRequest('File not found.');
        }
      }
    });
  }

};

