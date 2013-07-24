/* global describe: false */
/* global it: false */
/* global expect: false */
/* jshint maxstatements: 30 */

"use strict";

var organic = require("organic");
var multimatch = require("organic-plasma-multimatch");
var EventTree = require("../index");
var async = require("async");


var eventbus = (new organic.Plasma()).use(multimatch);

function create(name, eventsDescr) {
  var et = EventTree.organic(eventbus, name);
  
  var eventtree = EventTree.children(et, function () {
    return eventtree.children;
  });

  eventtree.children = [];
  eventtree.createChild = function (_name, _eventsDescr, ready) {
    var childName = name + "." + _name;
    create(childName, _eventsDescr);
    eventtree.children.push(_name);
    eventtree.emit(_name, "created", null, ready);
  };

  eventtree.createMulti = function (table, noargCallback) {
    var self = this;
    var createCalls = [];
    for (var key in table) {
      if (table.hasOwnProperty(key)) {
        createCalls.push({ "key": key, "settings": table[key] });
      }
    }
    async.map(createCalls, function (value, callback) {
      self.createChild(value.key, value.settings, function () { callback(null, null); });
    },function (err, data) { noargCallback(); });
  };

  EventTree.eld(eventtree, eventsDescr);
  return eventtree;
}



describe("EventTree", function () {
  it("can allow children and parents to exchange messages", function (done) {

    var root = create("UI.root", {
      ":created": function (event) {
        var children= {
          "header": {
            ":created": function (event) {
              event.callback();
            },
            ":prepared": function (event) {
              event.data.header = 1;
              event.callback();
            }
          },
          "body": {
            ":created": function (event) {
              event.callback();
            },
            ":prepared": function (event) {
              event.data.body = 2;
              event.callback();
            }
          }
        };
        this.createMulti(children, event.callback);
      },
      ":prepared": function (event) {
        event.data.root = {
          info: 4
        };
        this.emit("children", "prepared", event.data.root, event.callback);
      }
    });

    root.state("", "created", null, function () {
      var obj = {};
      root.state("", "prepared", obj, function () {
        expect(obj.root).toEqual({ info:4, header:1, body:2 });
        done();
      });
    });
    
  });
});