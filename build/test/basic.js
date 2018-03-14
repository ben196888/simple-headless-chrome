'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const HeadlessChrome = require('../../');
const test = require('tap').test;

test('Headless Chrome - Basic navigation', (() => {
  var _ref = _asyncToGenerator(function* (group) {
    group.comment(`Initializating HeadlessChrome...`);
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

    group.test('example.net', (() => {
      var _ref2 = _asyncToGenerator(function* (t) {
        const exampleDomain = 'http://example.net';
        yield mainTab.goTo(exampleDomain);

        const mainTabEvaluate = yield mainTab.evaluate(function () {
          return document.title;
        });

        t.equal(mainTabEvaluate.result.value, 'Example Domain', `Page title is "${mainTabEvaluate.result.value}"`);

        t.end();
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
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