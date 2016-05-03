const repl = require('repl');
const Rx = require('rx');
import Ftp from './simple_ftp' // Our library!
const client = new Ftp();

let responses = client.tuples.map(t => t[1]);
let callbacks = new Rx.Subject();

repl.start({
  prompt: 'ftp#' + client.host + ':' + client.port + '> ',
  input: process.stdin,
  output: process.stdout,
  eval: (cmd, context, filename, callback) => {
    client.command(cmd);
    callbacks.onNext(callback);
  }
});

responses.zip(callbacks).subscribe(result => {
  let [cmdResult, callback] = result;
  callback(cmdResult);
});
