"use strict";

// Example for creating "eventbus"
// var Plasma = require("organic").Plasma;
// var multimatch = require("organic-plasma-multimatch");
// var eventbus = (new Plasma()).use(multimatch);

var et = require("./eventtree");
var tc = require("constraints")();

tc.define("conditions", et.typeConditions);

//TODO: include from organic?
tc.define("eventbus", {
  dissolve: "function",
  precipitate: "function",
  precipitateAll: "function",
  onDissolved: "function",
  onPrecipitate: "function",
  onAll: "function",
  off: "function"
});
tc.define("fn?", tc.noneOr("function"));

module.exports = function create(eventbus, name) {
  tc.args("eventbus", "string", arguments);

  function key(child, event) {
    var addition = child ? "." + child: "";
    var fullname = name + addition;
    return fullname + ":" + event;
  }

  var cache = {};

  function cached(child, event, data, callback) {
    var k = key(child, event);
    if (! cached[k]) {
      cached[k] = { "type": k, "data": data, "callback": callback };
    }
    return cached[k];
  }

  return {
    on: function (conditions, handlerFn) {
      tc.args("conditions", "function", arguments);

      var events = conditions.map(function (pair) {
        return key(pair[0], pair[1]);
      });
      if (events.length === 1) {
        eventbus.onDissolved(events[0], handlerFn);
        return function () {
          eventbus.off(events[0], handlerFn);
        };
      } else {
        var pmo = eventbus.onAll(events, handlerFn);
        return function () {
          return pmo.stop();
        };
      }
    },

    emit: function (child, event, data, callback) {
      tc.args("string","string",null,"fn?", arguments);

      var chemical = { "type": key(child, event), "data": data, "callback":callback };
      eventbus.emit(chemical, callback);
    },

    state: function (child, event, data, callback) {
      tc.args("string","string",null,"fn?", arguments);
      var chemical = cached(child, event, data, callback);
      eventbus.dissolve(chemical);
      return function () {
        eventbus.precipitate(chemical);
      };
    }
  };
};
