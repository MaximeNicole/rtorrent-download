# rtorrent-dowload

## Features
- connect to Rtorrent to save in database new torrents
- download the latest torrents
- copy files on external disk and warn by sound
- remove from external disk the movies that you saw and update database

## Installation
- npm install
- Copy the file in node_modules_change/node-rtorrent to node_modules/node-rtorrent

## Configuration
- set the config file torrent in config/torrent.js
- change the CRON params and times in config/bootstrap.js (see comments)

## Launch app
- sails lift --verbose (verbose show more informations)
- Go to http://localhost:1337/torrent to see all registred torrents

## Release

### 1.0
- Implement Rtorrent connection
- Download Torrent on local disk

### 1.1
- Copy new files on external disk
- Warn sound
- Delete files on external disk

a [Sails](http://sailsjs.org) application
