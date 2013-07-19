module.exports = {
  typedef: {
    on: "function.args(2)",  // on([[child, event], [child,event], [child, event]], handlerFn: fn({ data:..., callback:... })): offFunction
    emit: "function.args(4)",   // emit(child, event, [data[, callback]]);
    state: "function.args(4)"  // state(child, event, [data[, callback]]);              :unstateFunction()
  },
  typeConditions: [".notEmpty()", [".size(2)", "string", "string"]],
  example: {
    on: function (conditions, handlerFn) {},
    emit: function (child, event, data, callback) {},
    state: function (child, event, data, callback) {}
  }
};