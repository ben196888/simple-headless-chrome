'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = require('debug')('HeadlessChrome:events:Network');

/**
 * Register all the Network events of the Chrome DevTools Protocol
 * URL: https://chromedevtools.github.io/devtools-protocol/tot/Network/
 */
module.exports = _asyncToGenerator(function* () {
  var _this = this;

  const Network = this.client.Network;

  const events = ['resourceChangedPriority', 'requestWillBeSent', 'requestServedFromCache', 'responseReceived', 'dataReceived', 'loadingFinished', 'loadingFailed', 'webSocketWillSendHandshakeRequest', 'webSocketHandshakeResponseReceived', 'webSocketCreated', 'webSocketClosed', 'webSocketFrameReceived', 'webSocketFrameError', 'webSocketFrameSent', 'eventSourceMessageReceived', 'requestIntercepted'];

  for (let eventName of events) {
    Network[eventName](function (...params) {
      debug(`-- Network.${eventName}: `, ...params);
      _this.emit(`Network.${eventName}`, ...params);
    });
  }
});