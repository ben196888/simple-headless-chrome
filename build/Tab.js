'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = require('debug')('HeadlessChrome:tab');

const EventEmitter = require('events');

const chrome = require('./chrome');
const setupHandlers = require('./setupHandlers');
const setupViewport = require('./setupViewport');
const setupActions = require('./setupActions');

class Tab extends EventEmitter {
  constructor(host, port, tabOptions, browserInstance) {
    super();
    EventEmitter.call(this);
    this._host = host;
    this._port = port;
    this._tabOptions = tabOptions;
    this._browser = browserInstance;

    // Get the browser actions options
    this.options = {
      browser: browserInstance.options.browser,
      deviceMetrics: browserInstance.options.deviceMetrics
    };
  }

  init() {
    var _this = this;

    return _asyncToGenerator(function* () {
      debug(`:: init => Initializating new tab...`);
      const { Target } = _this._browser.client;

      /**
       * Creates new tab and assign it with CDP
       */
      try {
        const params = {
          url: _this._tabOptions.startingUrl

          /**
           * Creates private BrowserContext (if needed)
           * NOTE: private tabs can only be created in headless mode
           */
        };if (_this._tabOptions.privateTab) {
          if (!_this._browser.options.headless) {
            throw new Error(`Can't open a private target/tab if browser is not in headless mode`);
          }
          _this._privateTab = params.browserContextId = yield Target.createBrowserContext();
        }

        // Create the new target (tab)
        _this._target = yield Target.createTarget(params);

        // Get the target/tab ID
        _this._targetId = _this._target.targetId;

        // Attach the tab to the CDP
        debug(`:: init => Attaching tab "${_this._targetId}" to the CDP...`);
        _this.client = yield chrome.attachCdpToTarget(_this._host, _this._port, _this._targetId);

        // Setup Actions, Handlers and Viewport
        debug(`:: init => Preparing Actions, Handlers and Viewport for tab "${_this._targetId}"...`);
        yield setupHandlers.call(_this);
        yield setupViewport.call(_this);
        setupActions.call(_this);

        debug(`:: init => Tab "${_this._targetId}" initialized successfully!`);

        return _this;
      } catch (err) {
        debug(`:: init => Could not initialize new target/tab. Error code: ${err.code}`, err);
        if (_this._targetId) {
          Target.closeTarget(_this._targetId);
        }
        if (_this._privateTab) {
          Target.disposeBrowserContext(_this._privateTab);
        }
        throw err;
      }
    })();
  }

  /**
   * Tells if the target/tab is initializated
   */
  isInitialized() {
    return !!this.client;
  }

  /**
   * Tells if the target/tab is a private tab
   */
  isPrivate() {
    return typeof this._privateTab !== 'undefined';
  }

  /**
   * Tells the targe/tab ID
   */
  getId() {
    return this._targetId;
  }

  /**
   * Tells the private tab BrowserContext id
   */
  getBrowserContextId() {
    if (this._privateTab) {
      return this._privateTab.browserContextId;
    }
  }

  /**
   * Support attaching actions
   * @param {String} name - Method name
   * @param {Function} fn - Method implementation
   */
  addAction(name, fn) {
    if (typeof fn === 'function') {
      this[name] = fn;
    }
    return this;
  }

  close() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      debug(`:: close => Closing target/tab "${_this2._targetId}"...`);
      if (!_this2.isInitialized()) {
        throw new Error(`Cannot close a tab that it's not initialized`);
      }
      const { Target } = _this2._browser.client;
      const tabId = _this2.getId();
      try {
        yield Target.closeTarget({ targetId: tabId });

        // If it was a private tab, we need to dispose the browser context too
        if (_this2.isPrivate()) {
          const tabContextId = _this2.getBrowserContextId();
          yield Target.disposeBrowserContext({ browserContextId: tabContextId });
        }

        _this2._closedAt = new Date().toISOString();
        _this2.client = false;

        // Tell the browser instance that a target/tab was closed
        _this2._browser._closeTarget(tabId);

        debug(`:: close => Target/tab "${_this2._targetId}" closed successfully!`);
        return true;
      } catch (error) {
        error.message = `There was a problem closing target/tab. ${error.message}`;
        error.tabId = tabId;
        throw error;
      }
    })();
  }

  /**
   * Logs a text in the console
   * @param {string} text - The text to log
   */
  log(text) {
    console.log(`[Tab ID: ${this._targetId}] ${text}`);
    return this;
  }

  /**
   * Logs a text in the console, only in debug mode
   * @param {string} text - The text to log
   */
  debugLog(text) {
    debug(`[Tab ID: ${this._targetId}] ${text}`);
    return this;
  }
}

module.exports = Tab;