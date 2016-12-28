/**
 * Serie.js
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

    year: {
      type: 'integer'
    },

    season: {
      type: 'integer',
      required: true
    },

    episode: {
      type: 'integer',
      required: true
    },

    types: {
      collection: 'type',
      via: 'series',
      dominant: true
    },

    file: {
      model: 'file'
    }

  }
};

