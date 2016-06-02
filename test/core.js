"use strict";

/*
 * Tests the lib core functionality.
 */

let chai     = require('chai'),
    sinon    = require('sinon'),
    bunyan   = require('bunyan'),
    Writable = require('stream').Writable,
    bunyanGelfFormat = require ('../index.js'),
    expect = null;

// Basic test configuration setup.
expect = chai.expect;
process.env.A127_ENV = 'test';

describe("core", () => {

  it ("should log a info message with default args and it should be converted to gelf.", done => {
    let stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]});

    stream.pipe(new Writable({
      objectMode: true,
      write : function (message, encoding, callback) {
        callback(null, message);

        expect(message.version).to.equal("1.1");
        expect(message.level).to.equal(bunyanGelfFormat.LOG_LEVELS.INFO);
        expect(message.short_message).to.equal('testing core log debug capabilities.');
        expect(message.facility).to.equal('core-logger');

        done();
      }
    }));

    logger.info('testing core log debug capabilities.');
  });

  it ("should log a info message with default args and format and it should be converted to gelf.", done => {
    let stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]});

    stream.pipe(new Writable({
      objectMode: true,
      write : function (message, encoding, callback) {
        callback(null, message);

        expect(message.level).to.equal(bunyanGelfFormat.LOG_LEVELS.INFO);
        expect(message.short_message).to.equal('testing core log debug capabilities for this test.');
        expect(message.facility).to.equal('core-logger');

        done();
      }
    }));

    logger.info('testing core log debug capabilities for %s.', 'this test');
  });


  it ("should log a debug message with one additional arg and it should be converted to gelf.", done => {
    let stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}], level: 10});

    stream.pipe(new Writable({
      objectMode: true,
      write : function (message, encoding, callback) {
        callback(null, message);

        expect(message.level).to.equal(bunyanGelfFormat.LOG_LEVELS.DEBUG);
        expect(message.short_message).to.equal('testing core log debug capabilities.');
        expect(message.facility).to.equal('core-logger');
        expect(message).to.have.property('_additional');
        expect(message._additional).to.equal('additional field');

        done();
      }
    }));

    logger.debug({additional : 'additional field'}, 'testing core log debug capabilities.');
  });
});
