var CronJobManager = require('cron-job-manager');

var CronService = {
  manager: new CronJobManager(),
  options: {
    start: true,
    timezone: "Europe/France"
  },

  addCron: function (key, time, fn) {
    this.manager.add(key, time, fn, this.options)
  },

  startCron: function (key) {
    if(this.manager.exists(key)) {
      this.manager.start(key);
    }
  },

  stopCron: function (key) {
    if(this.manager.exists(key)) {
      this.manager.stop(key);
    }
  },

  stopAllCron: function () {
    this.manager.stopAll();
  },

  updateCron: function (key, time, fn) {
    this.manager.update(key, time, fn, this.options)
  },

  deleteCron: function (key) {
    if(this.manager.exists(key)) {
      this.manager.deleteJob(key);
    }
  },

  listJobs: function () {
    this.manager.listCrons();
  }

};

module.exports = CronService;
