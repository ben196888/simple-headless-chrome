'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = require('debug')('HeadlessChrome:browser');

/**
 * Created by: Luciano A. Ganga
 * Inspired by:
 *    - Doffy (https://github.com/qieguo2016/doffy)
 *    - Horseman (https://github.com/johntitus/node-horseman)
 * More Info:
 * https://developers.google.com/web/updates/2017/04/headless-chrome
 * https://chromedevtools.github.io/devtools-protocol
 * https://github.com/cyrus-and/chrome-remote-interface
 */

const EventEmitter = require('events');

const merge = require('deepmerge');

const chrome = require('./chrome');
const Tab = require('./Tab');

const defaultOptions = {
  headless: true,
  launchChrome: true, // If false, only connects CDP to the Chrome instance in host:port
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false,
    launchAttempts: 3,
    userDataDir: null,
    disableGPU: true,
    handleSIGINT: true,
    flags: ['--enable-logging'],
    noSandbox: false
  },
  tabs: {
    maxTabs: Infinity,
    startingUrl: 'about:blank' // Default starting URL for all the tabs
  },
  deviceMetrics: {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
    fitWindow: false
  },
  browser: {
    loadPageTimeout: 60000,
    loadSelectorInterval: 500,
    loadSelectorTimeout: 60000,
    browserLog: false // {boolean|function}
  }
};

class Browser extends EventEmitter {
  constructor(options = {}) {
    super();
    // Deep merge in order to prevent total override of default params
    this.options = merge(defaultOptions, options);
    this.host = this.options.chrome.host;
    this._tabs = []; // TODO: This array must be initialized with the list of tabs of the attached Chrome instance (if the chrome instance is not new but a remote one with existing tabs, this should be autocompleted from that instance)
    this._closedTabs = []; // This keeps track of closed tab ids
  }

  /**
   * Initializates a Chrome instance and opens a new tab
   * If it exceeds the maxTabs defined by user, returns undefined
   * @param {boolean} private Indicates a private tab (supported only in Headless mode)
   * @return - A browser tab instance, with all the actions
   */
  init() {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (_this.options.launchChrome) {
        // Launch a new Chrome instance and update the instance port
        const initializationOptions = _this.options.chrome;
        _this.chromeInstance = yield chrome.launch(_this.options.headless, initializationOptions);
        _this.port = _this.chromeInstance.port;
      }

      try {
        // Attach the Chrome Debugging Protocol to the chrome instance
        _this.client = yield chrome.attachCdpToBrowser(_this.host, _this.port, _this.options.chrome.remote);

        return _this;
      } catch (err) {
        _this.chromeInstance && (yield _this.chromeInstance.kill());
        throw err;
      }
    })();
  }

  /**
   * Initializates a new Chrome tab and controls it.
   * If it exceeds the maxTabs defined by user, returns undefined
   * @param {boolean} privateTab Indicates a private tab (supported only in Headless mode)
   * @return - A browser tab instance, with all the actions
   */
  newTab({ privateTab = false } = {}) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      debug(`:: newTab => Opening a new tab in browser. Private tab: ${privateTab}`);

      /**
       * Don't open tab if maxTabs reached, and not open private tab if not headless
       */
      if (Object.keys(_this2._tabs).length >= _this2.options.tabs.maxTabs) {
        const error = new Error(`Can't open new tab. Max tabs limit reached`);
        error.maxTabs = _this2.options.tabs.maxTabs;
        error.openedTabs = Object.keys(_this2._tabs).length;
        throw error;
      }

      // Create and initialize the new tab
      const tab = new Tab(_this2.host, _this2.port, {
        privateTab,
        startingUrl: _this2.options.tabs.startingUrl
      }, _this2);

      yield tab.init();

      _this2._tabs[tab.getId()] = tab;

      return tab;
    })();
  }

  getTab(tabId) {
    debug(`:: getTab => Getting tab ${tabId}`);
    return this._tabs[tabId];
  }

  /**
   * Lists all the open tabs ids
   */
  listTabs() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      debug(`:: listTabs => Listing all tabs`);
      let array = [];
      for (let key in _this3._tabs) {
        array.push(_this3._tabs[key].id);
      }
      return array;
    })();
  }

  /**
   * Lists all the private targets/tabs ids
   * only in headless mode
   */
  listPrivateTabs() {
    debug(`:: listPrivateTabs => Listing all private tabs...`);
    if (!this.options.headless) {
      debug(`:: listPrivateTabs => Can't list private tabs without headless mode!`);
      return;
    }

    let array = [];
    for (let key in this._tabs) {
      if (this._tabs[key].privateTab) array.push(this._tabs[key].id);
    }
    debug(`:: listPrivateTabs => "${array.length}" private tabs found.`);
    return array;
  }

  /**
   * Exit the Chrome instance
   * @param {boolean} exit - Indicates if chromeInstance must be killed with SIGHUP
   * @return {boolean} - true if exited successfully
   */
  close(exit = true) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      debug(`:: close => Closing the browser.`);
      if (!_this4.client) {
        debug(`:: close => Can not close the browser. Browser instance doesn't exists.`);
        return;
      }

      try {
        yield _this4.client.close();
        _this4.client = null;
        _this4._tabs = [];
        _this4._closedTabs = [];
        exit && _this4.chromeInstance && (yield _this4.chromeInstance.kill('SIGHUP'));
        debug(`:: close => Browser closed correctly!`);
        return true;
      } catch (err) {
        throw err;
      }
    })();
  }

  /**
   * PRIVATE METHOD - Erases all the information of a closed target/tab.
   * @param {string} the target/tab ID that was closed
   */
  _closeTarget(tabId) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const target = _this5._tabs[tabId];

      // Save information about the closed tab
      _this5._closedTabs.push({
        id: tabId,
        closedAt: target.closedAt,
        instance: target
      });

      // Remove the tab from the active tabs list
      delete _this5._tabs[tabId];
    })();
  }

  /**
   * Tells if the browser is initialized
   */
  isInitialized() {
    return !!this.client;
  }
}

module.exports = Browser;