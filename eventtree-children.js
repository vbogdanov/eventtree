"use strict";

var tc = require("constraints")();

tc.define("conditions", [".notEmpty()", [".size(2)", "string", "string"]]);
tc.define("fn?", tc.noneOr("function"));
tc.define("eventree", require("./eventtree").typedef);

function copyAndReplace0(arr, val) {
  var a = Array.prototype.slice.call(arr, 1);
  a.unshift(val);
  return a;
}

function arrcopy(arr) {
  return arr.slice(0);
}

function isEmitAll(child) {
  return child === "children";
}

function isOnAny(child) {
  return child === "anychild";
}

function isOnAll(child) {
  return child === "children";
}

module.exports = function create(eventree, getChildren) {
  tc.args("eventree", "function", arguments);

  function fnInvokeAll(fnarr) {
    return function () {
      for (var i = 0; i < fnarr.length; i ++) {
        fnarr[i]();
      }
    };
  }

/*jshint maxparams:5 */
  function multicall(methodName, child, args) {
    tc.assert("string", "string", null, "fn?", args);

    var method = eventree[methodName];
    var children = isEmitAll(child)? getChildren(): [child];
    var endfns = children.map(function (currentChild) {
      return method.call(eventree, currentChild, args[1], args[2], args[3]);
    });
    return fnInvokeAll(endfns);
  }

  function registerForEveryChild(cnd, index, conditions, handlerFn) {
    var stops = getChildren().map(function (child) {
      var cnds = arrcopy(conditions);
      cnds[index] = [child, cnd[1]];
      return handleOr(cnds, handlerFn);
    });
    return fnInvokeAll(stops);
  }

  function handleOr(conditions, handlerFn) {
    for (var i = 0; i < conditions.length; i ++) {
      var cnd = conditions[i];
      if (isOnAny(cnd[0])) {
        return registerForEveryChild(cnd, i, conditions, handlerFn);
      }
    }
    //invoke with the arguments in the proper groups
    return eventree.on(conditions, handlerFn);
  }

  function collapseAndIndex(andStrechIndexes, handlerFn) {
    var cs = getChildren();
    return function () {
      var args = Array.prototype.slice.call(arguments, 0);
      andStrechIndexes.forEach(function (index) {
        var childrenObj = Object.create(null);
        var values = args.splice(index, cs.length, childrenObj);
        for (var i = 0; i < cs.length; i++) {
          childrenObj[cs[i]] = values[i];
        }
      });
      handlerFn.apply(null, args);
    };
  }

  return {
    on: function (conditions, handlerFn) {
      tc.args("conditions", "function", arguments);

      var andStrechIndexes = [];
      //check for all
      var newcond = [];
      //handle AND
      conditions.forEach(function (cnd, index) {
        if (! isOnAll(cnd[0])) {
          newcond.push(cnd);
          return;
        }
        andStrechIndexes.push(index);
        getChildren().forEach(function (child) {
          newcond.push([child, cnd[1]]);
        });
      });

      return handleOr(newcond, collapseAndIndex(andStrechIndexes, handlerFn));
    },
    emit: function (child, event, data, callback) {
      multicall("emit", child, arguments);
    },
    state: function (child, event, data, callback) {
      return multicall("state", child, arguments);
    }
  };
};