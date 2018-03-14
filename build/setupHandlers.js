'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = require('debug')('HeadlessChrome:handlers');

const networkEvents = require('./events/network');
module.exports = (() => {
  var _ref = _asyncToGenerator(function* () {
    var _this = this;

    debug(`Setting up handlers...`);
    const Page = this.client.Page;
    const Log = this.client.Log;

    /**
     * Prepare the browser console events, if needed
     */
    if (typeof this.options.browser.browserLog === 'function') {
      debug(`-- Browser Log status: ON! Log Entries will be received in the passed custom fn: ${this.options.browser.browserLog}`);
      yield Log.enable();
      Log.entryAdded(this.options.browser.browserLog);
    } else if (this.options.browser.browserLog === true) {
      debug(`-- Browser Log status: ON`);
      yield Log.enable();
      Log.entryAdded(_browserLog);
    } else {
      debug(`-- Browser Log status: OFF`);
    }

    /**
     * Setup Network Events
     */
    yield networkEvents.call(this);

    /**
    * If api method type is log then emit onConsoleMessage event;
    */
    this.client.Runtime.consoleAPICalled(function (...params) {
      debug(`-- Added something in console `, ...params);
      if (params[0].type === 'log') {
        _this.emit('onConsoleMessage', params[0].args);
      }
    });
    this.client.Runtime.enable();

    Page.loadEventFired(function (...params) {
      debug('-- Page.loadEventFired \r\n', ...params);
      // Page.addScriptToEvaluateOnLoad
      _this.emit('pageLoaded', ...params);
    });

    Page.domContentEventFired(function (...params) {
      debug('-- Page.domContentEventFired \r\n', ...params);
      _this.emit('domContentEventFired', ...params);
    });

    Page.frameAttached(function (...params) {
      debug('-- Page.frameAttached: ', ...params);
      _this.emit('frameAttached', ...params);
    });

    Page.frameNavigated(function (...params) {
      debug('-- Page.frameNavigated: ', ...params);
      _this.emit('frameNavigated', ...params);
    });

    Page.frameStartedLoading(function (...params) {
      debug('-- Page.frameStartedLoading', ...params);
      _this.emit('frameStartedLoading', ...params);
    });

    /**
     * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to open.
     * @param {string} message - Message that will be displayed by the dialog.
     * @param {string} type - Dialog type (Allowed values: alert, confirm, prompt, beforeunload)
     */
    Page.javascriptDialogOpening(function (...params) {
      debug('-- Page.javascriptDialogOpening', ...params);
      _this.emit('dialogOpening', ...params);
    });

    /**
     * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been closed.
     * @return {boolean} result - Whether dialog was confirmed.
     */
    Page.javascriptDialogClosed(function (...params) {
      debug('-- Page.javascriptDialogClosed', ...params);
      _this.emit('dialogClosed', ...params);
    });

    this.client.DOM.documentUpdated(function (...params) {
      debug('-- DOM.documentUpdated', ...params);
      _this.emit('documentUpdated', ...params);
    });
  });

  function setupHandlers() {
    return _ref.apply(this, arguments);
  }

  return setupHandlers;
})();

// exports.on = function (eventType, callback) {
//   var self = this
// return this.ready.then(function () {
//   switch (eventType) {
//  /**
//   * Horseman events
//   */
//   case 'timeout':
//     self.page.onTimeout = callback
//     break
//   case 'tabCreated':
//     self.onTabCreated = callback
//     break
//   case 'tabClosed':
//     self.onTabClosed = callback
//     break

//    /**
//     * PhantomJS events
//     */
//    // Callback horseman needs to mess with
//   case 'resourceTimeout':
//     self.page.onResouceTimeout = function (request) {
//   callback.apply(this, arguments)
//    // A resourceTimeout is a timeout
//   setTimeout(function () {
//   self.page.onTimeout('resourceTimneout', request)
// }, 0)
// }
//     break
//   case 'urlChanged':
//     self.page.onUrlChanged = function (targetUrl) {
//   self.targetUrl = targetUrl
//   return callback.apply(this, arguments)
// }
//     break
//   case 'resourceReceived':
//     self.page.onResourceReceived = function (response) {
//   self.responses[response.url] = response.status
//   return callback.apply(this, arguments)
// }
//     break
//   case 'pageCreated':
//     self.page.onPageCreated2 = callback
//     break
//   case 'loadFinished':
//     self.page.onLoadFinished2 = callback
//     break
//    // Others
//   default:
//     var pageEvent = 'on' +
//    eventType.charAt(0).toUpperCase() + eventType.slice(1)
//     self.page[pageEvent] = callback
// }

//   debug('.on() ' + eventType + ' set.')
// })
// }

function _browserLog(d) {
  switch (d.entry.level) {
    case 'verbose':
      console.log(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    case 'info':
      console.info(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    case 'warning':
      console.warn(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    case 'error':
      console.error(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    default:
      console.log(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
  }
}