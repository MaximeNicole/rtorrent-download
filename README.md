# rtorrent-dowload

## Features
- connect to Rtorrent to save in database new torrents
- download the latest torrents

## Installation
- npm install
- Copy the file in node_modules_change/node-rtorrent to node_modules/node-rtorrent

## Configuration
- set the config file torrent in config/torrent.js
- change the CRON params and times in config/bootstrap.js (see comments)

## Launch app
- sails lift --verbose (verbose show more informations)
- Go to http://localhost:1337/torrent to see all registred torrents

a [Sails](http://sailsjs.org) application
