/**
 * File.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name: {
      type: 'string',
      required: true
    },

    size: {
      type: 'integer',
      required: true
    },

    ext: {
      type: 'string'
    },

    status: {
      type: 'string',
      enum: ['not watched', 'watched', 'rubbish'],
      defaultsTo: 'not watched'
    },

    torrent: {
      model: 'torrent'
    }

  }
};

