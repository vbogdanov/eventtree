/* Event Listener Definition */
/**
 Examples:
 eld(eventtree, {
   "head.children:select, :selected, :rendered": function (selectEvent, selected *and ignore the last one*) {
     var currentSelection = selected.data;
     var choosen = selectEvent.data;
     if (currentSelection !== choosen) {
      this.emit("selectionChanged", choosen);
     }
   },
   ":selectionChanged": "head.showSelected, body.showSelected"
 });
 */

module.exports = function eld(eventtree, definition) {
  for (var k in definition) {
    register(eventtree, k, definition[k]);
  }
};

var STATEMENT_SEPARATOR = ",";
var CHILD_EVENT_SEPARATOR = ":";

function trim(str) {
  return str.trim();
}

function register(eventtree, trigger, response) {

  var conditions = trigger.split(STATEMENT_SEPARATOR)
    .map(function (cndText) {
      return cndText.split(CHILD_EVENT_SEPARATOR).map(trim);
    });
  var handleFn = getResponseFn(eventtree, response, conditions);
  eventtree.on(conditions, handleFn);
}

function getResponseFn (eventtree, response, conditions) {
  if (typeof response === "function") return response.bind(eventtree);

  var actions = response.split(STATEMENT_SEPARATOR)
    .map(function (statement) {
      var arr = statement.split(CHILD_EVENT_SEPARATOR);
      return {
        "child": arr[0],
        "event": arr[1]
      };
    });

  return function (/* data[] */) {
    var data = buildData(conditions, arguments);
    var callback = callAll(arguments);

    actions.forEach(function (action) {
      eventtree.emit(action.child, action.event,data ,callback);
    });
  };
}

function buildData(conditions, args) {
  //use reduce instead of forEach since the task is to generate 1 object.
  return conditions.reduce(function (data, eventpair, index) {
    var key = eventpair.join(CHILD_EVENT_SEPARATOR);
    data[key] = args[index];
    return data;
  }, Object.create(null));
}

function callAll(args) {
  return function () {
    var cbargs = arguments;
    Array.prototype.forEach.call(args, function (data) {
      var fn = data && data.callback;
      if (tc.check("function", cb))
        fn.apply(null, cbargs);
    });
  };
}
