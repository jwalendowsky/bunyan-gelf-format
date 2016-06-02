"use strict";

/*
 * Tests the lib core functionality.
 */

let chai   = require('chai'),
    sinon  = require('sinon'),
    bunyan = require('bunyan'),
    // chaiAsPromised = require('chai-as-promised'),
    should = null;

// Basic test configuration setup.
// chai.use(chaiAsPromised);
should = chai.should();
process.env.A127_ENV = 'test';

describe("core", () => {
  it ("should log a debug message with default args and it should be converted to gelf.", done => {
    done();
  });
});
