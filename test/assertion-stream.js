var stream = require('stream');


var AssertionStream = module.exports = function (options) {
  stream.Writable.call(this, options);
  this._write = options.write;
};

AssertionStream.prototype = Object.create(
    stream.Writable.prototype, { constructor: { value: AssertionStream }});
