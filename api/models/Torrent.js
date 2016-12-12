/**
 * Torrent.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    hash: {
      type: 'string',
      required: true,
      unique: true
    },

    name: {
      type: 'string',
      required: true
    },

    size: {
      type: 'integer'
    },

    details: {
      type: 'json'
    },

    downloaded: {
      type: 'boolean',
      defaultsTo: false
    },

    dateDownloaded: {
      type: 'datetime'
    },

    locked: {
      type: 'boolean',
      defaultsTo: false
    },

    copied: {
      type: 'boolean',
      defaultsTo: false
    },

    copiedDate: {
      type: 'datetime'
    },

    files: {
      collection: 'file',
      via: 'torrent'
    }
  }
};

