'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const HeadlessChrome = require('../../');
const test = require('tap').test;

test('Headless Chrome - Tabs', (() => {
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

    const tabA = yield browser.newTab({ privateTab: false });
    const tabB = yield browser.newTab({ privateTab: true });
    let targets = 0;

    group.test('Open 2 tabs', (() => {
      var _ref2 = _asyncToGenerator(function* (t) {
        // Navigate main tab to exampleDomain
        const exampleDomain = 'http://example.net';
        yield tabA.goTo(exampleDomain);

        // Navigate second tab to Google
        const google = 'http://google.com';
        yield tabB.goTo(google);

        // Get main tab title
        const tabAEvaluate = yield tabA.evaluate(function () {
          return document.title;
        });
        t.equal(tabAEvaluate.result.value, 'Example Domain', `tabA got to example.net`);

        // Get second tab title
        const tabBEvaluate = yield tabB.evaluate(function () {
          return document.title;
        });
        t.equal(tabBEvaluate.result.value, 'Google', 'tabB got to google.com');

        // information on number of tabs, for next tests
        const { targetInfos } = yield browser.client.Target.getTargets();
        targets = targetInfos.length;
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    })());

    group.test('Close tab A', (() => {
      var _ref3 = _asyncToGenerator(function* (t) {
        const id = tabA.getId();
        yield tabA.close();
        const { targetInfos } = yield browser.client.Target.getTargets();
        t.equal(targetInfos.length, --targets, 'tab A is closed');
        t.equal(browser.getTab(id), undefined, 'and is not in tabs list');
      });

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    })());

    group.test('Close tab B', (() => {
      var _ref4 = _asyncToGenerator(function* (t) {
        const id = tabB.getId();
        yield tabB.close();
        const { targetInfos } = yield browser.client.Target.getTargets();
        t.equal(targetInfos.length, --targets, 'tab B is closed');
        t.equal(browser.getTab(id), undefined, 'and is not in tabs list');
      });

      return function (_x4) {
        return _ref4.apply(this, arguments);
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