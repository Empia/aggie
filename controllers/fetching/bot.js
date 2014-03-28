var CircularQueue = require('./circular-queue');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Bot = function(contentService) {
  this.contentService = this.contentService || contentService;
  this.type = this.contentService.botType;
  this.queue = new CircularQueue();
  this.enabled = false;
  this.empty = true;
  EventEmitter.call(this);
};

util.inherits(Bot, EventEmitter);

Bot.prototype.start = function() {
  if (this.enabled) return;
  var self = this;
  self.enabled = true;
  self.contentService.on('reports', function(reports_data) {
    if (self.enabled) {
      reports_data.forEach(function(report_data) {
        self.queue.add(report_data);
        if (self.empty) {
          self.empty = false;
          self.emit('notEmpty', self);
        }
      });
      self.emit('reports', reports_data);
    }
  });
};

Bot.prototype.stop = function() {
  var self = this;
  this.enabled = false;
  this.contentService.removeListener('reports', function() {
    self.emit('stop');
  });
};

Bot.prototype.fetchNext = function() {
  var report_data = this.queue.fetch();
  if (report_data && this.empty) {
    this.empty = false;
    this.emit('notEmpty', this);
  } else if (!report_data && !this.empty) {
    this.empty = true;
    this.emit('empty', this);
  }
  return report_data;
};

Bot.prototype.isEmpty = function() {
  return this.queue.isEmpty();
};

module.exports = Bot;
