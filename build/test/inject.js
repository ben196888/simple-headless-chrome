'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const HeadlessChrome = require('../../');
const test = require('tap').test;

test('Headless Chrome - inject methods', (() => {
  var _ref = _asyncToGenerator(function* (group) {
    group.comment(`Initializing HeadlessChrome...`);
    const browser = new HeadlessChrome({
      headless: true,
      chrome: {
        host: 'localhost',
        port: 9222, // Chrome Docker default port
        remote: true,
        userDataDir: null,
        loadPageTimeout: 7000
      }
    });

    yield browser.init();
    const mainTab = yield browser.newTab();

    group.test('#inject(module)', (() => {
      var _ref2 = _asyncToGenerator(function* (t) {
        yield mainTab.goTo('https://httpbin.org/html');
        yield mainTab.inject('jquery.slim');
        const result = yield mainTab.evaluate(function () {
          return !!window.jQuery;
        });

        t.equal(result.result.value, true, `module injection`);
        t.end();
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    })());

    group.test('#inject(remoteScript)', (() => {
      var _ref3 = _asyncToGenerator(function* (t) {
        yield mainTab.goTo('https://httpbin.org/html');
        yield mainTab.inject('https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.slim.min.js');
        const result = yield mainTab.evaluate(function () {
          return !!window.jQuery;
        });

        t.equal(result.result.value, true, `remote script injection`);
        t.end();
      });

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    })());

    group.test('#inject(localFile)', (() => {
      var _ref4 = _asyncToGenerator(function* (t) {
        yield mainTab.goTo('https://httpbin.org/html');
        yield mainTab.inject('jquery/dist/jquery.slim.min.js');
        const result = yield mainTab.evaluate(function () {
          return !!window.jQuery;
        });

        t.equal(result.result.value, true, `local file injection`);
        t.end();
      });

      return function (_x4) {
        return _ref4.apply(this, arguments);
      };
    })());

    group.test('#injectScript(script)', (() => {
      var _ref5 = _asyncToGenerator(function* (t) {
        yield mainTab.goTo('https://httpbin.org/html');
        yield mainTab.injectScript('window.jQuery = true');
        const result = yield mainTab.evaluate(function () {
          return !!window.jQuery;
        });

        t.equal(result.result.value, true, `script injection`);
        t.end();
      });

      return function (_x5) {
        return _ref5.apply(this, arguments);
      };
    })());

    group.tearDown(_asyncToGenerator(function* () {
      // true = kill with SIGHUP
      // https://git.io/vQKpP
      yield browser.close(true);
    }));
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})());