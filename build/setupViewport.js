'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = require('debug')('HeadlessChrome:viewPort');

module.exports = _asyncToGenerator(function* () {
  const deviceMetrics = this.options.deviceMetrics;
  debug(`Setting viewport with this parameters: `, deviceMetrics);

  // Check https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride for more details
  yield this.client.Emulation.setDeviceMetricsOverride(deviceMetrics);
  yield this.client.Emulation.setVisibleSize({
    width: deviceMetrics.width,
    height: deviceMetrics.height
  });
});