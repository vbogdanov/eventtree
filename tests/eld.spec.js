/* jshint globalstrict: true */
/* global require: false */
/* global describe: false */
/* global it: false */
/* global expect: false */
/* global process: false */
/* global console: false */
/* global beforeEach: false */
/* global afterEach: false */
/* global spyOn: false */
/* jshint maxstatements: 30 */

"use strict";
var tc = require("constraints")();
var eld = require("../eld");

var NOP_FN = function () {};
var EVENT_FN = function (event) {};
var FN_MATCH = jasmine.any(Function);

function createFakeET() {
  return {
    on: function (conditions, handlerFn) {},
    emit: function (child, event, data, callback) {},
    state: function (child, event, data, callback) {}
  };
}

describe("eld (Event Listener Definition)", function () {
  var eventtree;
  beforeEach(function () {
    eventtree = createFakeET();
    spyOn(eventtree, "on");
    spyOn(eventtree, "emit");
    spyOn(eventtree, "state");
  });
  afterEach(function () {});

  it("expects trigger describtion in the form child:event", function () {
    eld(eventtree, {
      "hello:world":EVENT_FN
    });
    expect(eventtree.on).toHaveBeenCalledWith([["hello", "world"]], FN_MATCH);
  });

  it("allows events on self using :event", function () {
    eld(eventtree, {
      ":world":EVENT_FN
    });
    expect(eventtree.on).toHaveBeenCalledWith([["", "world"]], FN_MATCH);
  });

  it("describes multimatch trigger using comas between conditions", function () {
    eld(eventtree, {
      "hello:world, :moon":EVENT_FN
    });
    expect(eventtree.on).toHaveBeenCalledWith([["hello", "world"], ["", "moon"]], FN_MATCH);
  });

  it("describes multiple listeners", function () {
    eld(eventtree, {
      "hello:world, :moon":EVENT_FN,
      ":tralala":EVENT_FN
    });
    expect(eventtree.on.calls.length).toBe(2);
    expect(eventtree.on).toHaveBeenCalledWith([["hello", "world"], ["", "moon"]], FN_MATCH);
    expect(eventtree.on).toHaveBeenCalledWith([["", "tralala"]], FN_MATCH);
  });

  it("passes the eventtree as context to the handling functions", function () {
    eld(eventtree, {
      "hello:world, :moon": function (helloWorld, moon) {
        expect(this).toBe(eventtree);
      }
    });
    expect(eventtree.on).toHaveBeenCalled();
    //get the handleFn argument of eventtree.on
    var etHandlerFn = eventtree.on.mostRecentCall.args[1];
    //the function passed to eventtree is invoked with context null
    etHandlerFn.call(null, { data:null }, { data:null });
  });

  it("describes multimatch trigger using comas between conditions", function () {
    eld(eventtree, {
      ":moon":":test"
    });
    expect(eventtree.on).toHaveBeenCalledWith([["", "moon"]], FN_MATCH);
    //get the handleFn argument of eventtree.on
    var etHandlerFn = eventtree.on.mostRecentCall.args[1];
    etHandlerFn({ data: "moon moon" });
    expect(eventtree.emit).toHaveBeenCalledWith("", "test", { ":moon":{ data: "moon moon" } }, FN_MATCH);
  });
});