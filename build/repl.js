'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _simple_ftp = require('./simple_ftp');

var _simple_ftp2 = _interopRequireDefault(_simple_ftp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var repl = require('repl');
var Rx = require('rx');
// Our library!
var client = new _simple_ftp2.default();

var responses = client.tuples.map(function (t) {
  return t[1];
});
var callbacks = new Rx.Subject();

repl.start({
  prompt: 'ftp#' + client.host + ':' + client.port + '> ',
  input: process.stdin,
  output: process.stdout,
  eval: function _eval(cmd, context, filename, callback) {
    client.command(cmd);
    callbacks.onNext(callback);
  }
});

responses.zip(callbacks).subscribe(function (result) {
  console.log(result);
  console.log(callback);

  var _result = _slicedToArray(result, 2);

  var cmdResult = _result[0];
  var callback = _result[1];

  callback(cmdResult);
});