'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // We use Node sockets to connect to the FTP server

// Convert Observables from and to streams, which are
// the interface that Node.js sockets implement


var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _rxNode = require('rx-node');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RE_RES = /^(\d\d\d)\s.*/;
var RE_MULTI = /^(\d\d\d)-/;

function parseFtpResponses(prev, cur) {
  var response = '';
  var accumulated = prev.accumulated;

  if (RE_MULTI.test(accumulated)) {
    if (RE_RES.test(cur)) {
      response = accumulated + '\n' + cur;
      accumulated = '';
    } else {
      accumulated = accumulated + '\n' + cur;
    }
  } else if (RE_MULTI.test(cur)) {
    accumulated = cur;
  } else {
    response = cur;
  }

  return { response: response, accumulated: accumulated };
}

var Ftp = function () {
  function Ftp() {
    var host = arguments.length <= 0 || arguments[0] === undefined ? 'localhost' : arguments[0];
    var port = arguments.length <= 1 || arguments[1] === undefined ? 21 : arguments[1];

    _classCallCheck(this, Ftp);

    this.host = host;
    this.port = port;
    this._ftpSocket = _net2.default.createConnection(port, host);
    this._ftpSocket.setEncoding('utf8');

    this.responses = (0, _rxNode.fromStream)(this._ftpSocket).flatMap(function (res) {
      // Splits both \n and \r\n cases
      var lines = res.split('\n').map(function (line) {
        return line.trim();
      });
      return _rx2.default.Observable.from(lines);
    }).scan(parseFtpResponses, { response: '', accumulated: '' }).filter(function (value) {
      return value.response.length > 0;
    }).map(function (value) {
      return value.response;
    });

    this.requests = new _rx2.default.Subject();
    (0, _rxNode.writeToStream)(this.requests, this._ftpSocket, 'utf8');

    this.tuples = _rx2.default.Observable.zip(this.requests, this.responses.skip(1));
  }

  _createClass(Ftp, [{
    key: 'command',
    value: function command(cmd) {
      cmd = cmd.trim() + '\r\n';
      this.requests.onNext(cmd);
    }
  }]);

  return Ftp;
}();

exports.default = Ftp;