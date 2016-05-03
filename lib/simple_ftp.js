// We use Node sockets to connect to the FTP server
import Net from 'net';
import Rx from 'rx';
// Convert Observables from and to streams, which are
// the interface that Node.js sockets implement
import { fromStream, writeToStream } from 'rx-node';

const RE_RES = /^(\d\d\d)\s.*/;
const RE_MULTI = /^(\d\d\d)-/;

function parseFtpResponses(prev, cur) {
  let response = '';
  let accumulated = prev.accumulated;

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

  return { response, accumulated };
}

class Ftp {
  constructor(host = 'localhost', port = 21) {
    this.host = host;
    this.port = port;
    this._ftpSocket = Net.createConnection(port, host);
    this._ftpSocket.setEncoding('utf8');

    this.responses = fromStream(this._ftpSocket)
      .flatMap(res => {
        // Splits both \n and \r\n cases
        let lines = res.split('\n').map(line => line.trim());
        return Rx.Observable.from(lines);
      })
      .scan(parseFtpResponses, { response: '', accumulated: '' })
      .filter(value => value.response.length > 0)
      .map(value => value.response);

    this.requests = new Rx.Subject();
    writeToStream(this.requests, this._ftpSocket, 'utf8');

    this.tuples = Rx.Observable.zip(this.requests, this.responses.skip(1));
  }

  command(cmd) {
    cmd = cmd.trim() + '\r\n';
    this.requests.onNext(cmd);
  }
}

export default Ftp;
