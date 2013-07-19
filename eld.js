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

function register(eventtree, trigger, response) {
  var singleCondition = trigger.indexOf(STATEMENT_SEPARATOR) === -1;
  var resp = parseResponse(response, argc);
}

var STATEMENT_SEPARATOR = ",";

function parseResponse (response) {
  if (typeof response === "function") return response;

  var statements = [response];
  if (response.indexOf(STATEMENT_SEPARATOR) !== -1)
    statements = response.split(STATEMENT_SEPARATOR);

  var actions = statements.map(function (st) {
    return parseChildEventPair(st);
  });

  return function (data) {
    var et = this;
    actions.forEach(function (act) {
      et.emit(act.child, act.event, data.data, data.callback);
    });
  };
}

var CHILD_EVENT_SEPARATOR = ":";
function parseChildEventPair(str) {
  var arr = str.split(CHILD_EVENT_SEPARATOR);
  return {
    "child": arr[0],
    "event": arr[1]
  };
}