/* jshint globalstrict: true */
/* global require: false */
/* global describe: false */
/* global it: false */
/* global expect: false */
/* global process: false */
/* global console: false */
/* jshint maxstatements: 30 */

"use strict";

var Plasma = require("organic").Plasma;
var multimatch = require("organic-plasma-multimatch");
var createEventtree = require("../eventtree-organic");
var tc = require("constraints")();

tc.define("event", {
  "data": null,
  "type": "string",
  "callback": tc.noneOr("function")
}, {});

function createEB() {
  return (new Plasma()).use(multimatch);
}

function create(name, eventbus) {
  eventbus = eventbus || createEB();
  return createEventtree(eventbus, name);
}



describe("eventtree-organic", function () {
  it("registers with 'on' listeners for emit", function (next) {
    var eb = create("unique");

    eb.on([["", "testEvent"]], function (event) {
      tc.assert("event", event);
      expect(event.data).toEqual("good");
      event.callback();
    });

    eb.emit("","testEvent","good", next);
  });

  it("registers with 'on' listeners for state", function (next) {
    var eb = create("unique");

    eb.on([["", "testEvent"]], function (event) {
      tc.assert("event", event);
      expect(event.data).toEqual("good");
    });

    eb.state("","testEvent","good", next);
    //state stays in the environment

    eb.on([["", "testEvent"]], function (event) {
      tc.assert("event", event);
      expect(event.data).toEqual("good");
      event.callback();
    });
  });

  it("can unstate states added by #state(...)", function (next) {
    var eb = create("unique");

    eb.on([["", "testEvent"]], function (event) {
      tc.assert("event", event);
      expect(event.data).toEqual("good");
    });

    var rm = eb.state("","testEvent","good", next);
    //state stays in the environment
    rm();

    eb.on([["", "testEvent"]], function (event) {
      tc.assert("event", event);
      //fail
      expect(true).toBe(false);
    });

    eb.on([["", "done"]], function (event) {
      event.callback();
    });

    eb.emit("", "done", null, next);
  });

  it("works for kids", function (next) {
    var eventbus = createEB();
    var parent = create("unique", eventbus);
    var child = create("unique.kid", eventbus);

    child.on([["", "event2"]], function (event) {
      event.callback();
    });

    parent.on([["kid", "event1"]], function (event) {
      parent.emit("kid", "event2", null, event.callback);
    });

    child.emit("", "event1", null, next);
  });

  it("works with multiple events/states", function (next) {
    var eb = create("unique");
    eb.on([["","event1"],["","event2"]], function (event1, event2) {
      tc.args("event", "event", arguments);
      event1.callback();
    });

    eb.state("","event2", null, null);
    eb.emit("", "event1", null, next);
  });

  it("removes listeners using the methods returned from on", function (next) {
    var eb = create("unique");
    //multiple
    var rm = eb.on([["","event1"],["","event2"]], function (event1, event2) {
      tc.args("event", "event", arguments);
      expect(true).toBe(false);
    });
    //single
    var r = eb.on([["", "event1"]], function (event1) {
      expect(true).toBe(false);
    });

    eb.on([["", "event1"]], function (event1) {
      event1.callback();
    });

    rm();
    r();
    eb.state("","event2", null, null);
    eb.emit("", "event1", null, next);
  });
});