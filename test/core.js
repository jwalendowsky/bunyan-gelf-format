"use strict";

/*
 * Tests the lib core functionality.
 */

var chai     = require('chai'),
    sinon    = require('sinon'),
    bunyan   = require('bunyan'),
    bunyanGelfFormat = require ('../index'),
    expect = null,
    AssertionStream = require('./assertion-stream');

// Basic test configuration setup.
expect = chai.expect;
process.env.A127_ENV = 'test';


describe("core", function () {

  it ("should log a info message with default args and it should be converted to gelf.", function (done) {
    var stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]});

    stream.pipe(new AssertionStream({
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

  it ("should log a info message with default args and format and it should be converted to gelf.", function (done) {
    var stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]});

    stream.pipe(new AssertionStream({
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


  it ("should log a debug message with one additional arg and it should be converted to gelf.", function (done) {
    var stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}], level: 10});

    stream.pipe(new AssertionStream({
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



  it ('should log an error and the stack must be treated.', function (done) {
    var stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]}),
        errorThatHappened = null;

    stream.pipe(new AssertionStream({
      objectMode: true,
      write : function (message, encoding, callback) {
        callback(null, message);

        expect(message.level).to.equal(bunyanGelfFormat.LOG_LEVELS.ERROR);
        expect(message.short_message).to.equal('Failed to get the resources.');
        expect(message.facility).to.equal('core-logger');
        expect(message.full_message).to.equal(errorThatHappened.stack);
        expect(message._line).to.equal(118);

        done();
      }
    }));

    try {
      functionThatThrowsAnError();
    } catch (error) {
      errorThatHappened = error;
      logger.error(error, 'Failed to get the resources.');
    }

    function functionThatThrowsAnError() {
      throw new Error('This error happenned within the functionThatThrowsAnError.');
    }
  });


  it ('should log an error with no log message and the stack must be treated.', function (done) {
    var stream = bunyanGelfFormat.createStream({raw : true}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]}),
        errorThatHappened = null;

    stream.pipe(new AssertionStream({
      objectMode: true,
      write : function (message, encoding, callback) {
        callback(null, message);

        expect(message.level).to.equal(bunyanGelfFormat.LOG_LEVELS.ERROR);
        expect(message.short_message).to.equal('This error happenned within the functionThatThrowsAnotherError.');
        expect(message.facility).to.equal('core-logger');
        expect(message.full_message).to.equal(errorThatHappened.stack);
        expect(message._line).to.equal(152);

        done();
      }
    }));

    try {
      functionThatThrowsAnotherError();
    } catch (error) {
      errorThatHappened = error;
      logger.error(error);
    }

    function functionThatThrowsAnotherError() {
      throw new Error('This error happenned within the functionThatThrowsAnotherError.');
    }
  });

  it ('should log a message and it must be a string, since raw is false.', function (done) {
    var stream = bunyanGelfFormat.createStream({raw : false}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]}),
        errorThatHappened = null;

    stream.pipe(new AssertionStream({
      objectMode: true,
      write : function (message, encoding, callback) {
        expect(typeof message).to.equal('string');
        expect(message.indexOf('This is a message.')).to.be.above(-1);
        done();
      }
    }));

    logger.info('This is a message.');
  });

  it ('should log more than one message.', function (done) {
    var stream = bunyanGelfFormat.createStream({raw : false}),
        logger = bunyan.createLogger(
            {name : 'core-logger', streams : [{type: 'raw', stream : stream}]}),
        errorThatHappened = null,
        messagesCount = 0;

    stream.pipe(new AssertionStream({
      objectMode: true,
      write : function (message, encoding, callback) {
        messagesCount++;

        if (messagesCount == 5) {
          done();
        }

        callback(null, message);
      }
    }));

    logger.info('This is a message.');
    logger.info('This is another message.');
    logger.info('This is one more message.');
    logger.info('This is an additional message.');
    logger.info('This is the final message.');
  });
});
