
var tc = require("constraints")();

tc.define("conditions", [".notEmpty()", [".size(2)", "string", "string"]]);
tc.define("fn?", tc.noneOr("function"));
tc.define("eventree", require("./eventtree").typedef);

function copyAndReplace0(arr, val) {
  var a = Array.prototype.slice.call(arr, 1);
  a.unshift(val);
  return a;
}

module.exports = function create(eventree, getChildren) {
  tc.args("eventree", "function", arguments);

  function isEmitAll(child) {
    return child === "children";
  }

  function isOnAny(child) {
    return child === "anychild";
  }

  function isOnAll(child) {
    return child === "children";
  }

  function fnInvokeAll(fnarr) {
    return function () {
      for (var i = 0; i < fnarr.length; i ++) {
        fnarr[i]();
      }
    };
  }

  function multicall(methodName, child, event, data, callback) {
    tc.assert("string", child);
    tc.assert("string", event);
    tc.assert("fn?", callback);

    var method = eventree[methodName];
    var children = isEmitAll(child)? getChildren(): [child];
    var endfns = children.map(function (currentChild) {
      return method.call(eventree, currentChild, event, data, callback);
    });
    return fnInvokeAll(endfns);
  }

  function fillForChildren(conditions, event) {
    children.forEach(function (c) {
      conditions.push([c, event]);
    });
  }

  function arrcopy(arr) {
    return arr.slice(0);
  }

  function handleOr(conditions, handlerFn) {
    for (var i = 0; i < conditions.length; i ++) {
      var cnd = conditions[i];
      if (isOnAny(cnd[0])) {
        var children = getChildren();
        var stops = [];
        for(var j = 0; j < children.length; j++) {
          child = children[j];
          var cnds = arrcopy(conditions);
          cnds[i] = [child, cnd[1]];
          var stop = handleOr(cnds, handlerFn);
          stops.push(stop);
        }
        return fnInvokeAll(stops);
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
      multicall("emit", child, event, data, callback);
    },
    state: function (child, event, data, callback) {
      return multicall("state", child, event, data, callback);
    }
  };
};