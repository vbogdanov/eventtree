/* jshint globalstrict: true */
/* global require: false */
/* global describe: false */
/* global it: false */
/* global expect: false */
/* global process: false */
/* global console: false */
/* jshint maxstatements: 30 */

"use strict";

var createChildrenEventtree = require("../eventtree-children");
var tc = require("constraints")();


function children(arr) {
  return function () {
    return arr;
  };
}

function createFakeET(config) {
  return {
    on: function (conditions, handlerFn) {
      expect(conditions).toEqual(config.on.conditions);
      handlerFn({data:null, callback: null});
      return function () {};
    },
    emit: function (child, event, data, callback) {
      expect(child).toEqual(config.emit.child);
      expect(event).toEqual(config.emit.event);
      return function () {};
    },
    state: function (child, event, data, callback) {
      expect(child).toEqual(config.emit.child);
      expect(event).toEqual(config.emit.event);
      return function () {};
    }
  };
}

function create(config) {
  return createChildrenEventtree(createFakeET(config), children(["ala", "bala"]));
}

function countingFn(handler) {
  var fn = function () {
    fn.count ++;
    handler.apply(this, arguments);
  };
  fn.count = 0;
  return fn;
}

describe("eventtree-children", function () {
  it("transmits usual on without change", function (next) {
    var cfg = {
      on:{
        conditions:[["","test"]]
      },
      emit:{
        child:"ala",
        event:"test"
      },
      state:{
        child:"ala",
        event:"test"
      }
    };
    var et = create(cfg);

    et.emit(cfg.emit.child, cfg.emit.event, null, null);
    et.state(cfg.state.child, cfg.state.event, null, null);
    et.on([["","test"]], function () { next(); });
  });

  it("transmits to all children when 'children' used in child attribute in emit", function () {
    var index = 0;
    var cs = children(["ala", "bala"]);

    var underlying = {
      on: function (conditions, handlerFn) {
      },
      emit: function (child, event, data, callback) {
        expect(child).toEqual(["ala", "bala"][index ++]);
        expect(event).toEqual("X");
      },
      state: function (child, event, data, callback) {
      }
    };
    var et = createChildrenEventtree(underlying, cs);

    et.emit("children", "X", null, null);
    expect(index).toBe(2);
  });

  it("transmits to all children when 'children' used in child attribute in state", function () {
    var EXPECTED_FN = countingFn(function () { });
    var index = 0;
    var cs = children(["ala", "bala"]);

    var underlying = {
      on: function (conditions, handlerFn) {
      },
      emit: function (child, event, data, callback) {
      },
      state: function (child, event, data, callback) {
        expect(child).toEqual(["ala", "bala"][index ++]);
        expect(event).toEqual("X");
        return EXPECTED_FN;
      }
    };
    var et = createChildrenEventtree(underlying, cs);

    var res = et.state("children", "X", null, null);
    res();
    expect(index).toBe(2);
    expect(EXPECTED_FN.count).toBe(2);
  });

  it("transmits registers on ALL children when 'children' is used", function (next) {
    var cs = children(["ala", "bala"]);
    var underlying = {
      on: function (conditions, handlerFn) {
        expect(conditions).toEqual([["ala","X"], ["bala","X"]]);
        handlerFn({data:5},{data:2});
      },
      emit: function (child, event, data, callback) {
      },
      state: function (child, event, data, callback) {
      }
    };

    var eventtree = createChildrenEventtree(underlying, cs);
    var stop = eventtree.on([["children", "X"]], function (event){
      expect(event.ala.data).toBe(5);
      expect(event.bala.data).toBe(2);
      next();
    });
  });

  it("registers alternative listeners when 'anychild' is used", function (next) {
    var index = 0;
    var CND = [[["ala","X"]], [["bala","X"]]];
    var cs = children(["ala", "bala"]);
    var underlying = {
      on: function (conditions, handlerFn) {
        expect(conditions).toEqual(CND[index ++]);
        handlerFn({data:2});
      },
      emit: function (child, event, data, callback) {
      },
      state: function (child, event, data, callback) {
      }
    };

    var eventtree = createChildrenEventtree(underlying, cs);
    var handler = countingFn(function (event){
      expect(event.data).toBe(2);
      if (handler.count === 2) {
        next();
      }
    });

    var stop = eventtree.on([["anychild", "X"]], handler);
  });
});