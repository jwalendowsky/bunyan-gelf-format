"use strict";

// Version of the gelf format being used.
var GELF_VERSION = "1.1";

// Log levels
var LOG_LEVELS = {
  TRACE : 0,
  DEBUG : 0,
  INFO  : 1,
  WARN  : 2,
  ERROR : 3,
  FATAL : 4,
  UNKNOWN : 5
};

// Bunyan to log levels conversion table
var BUNYAN_TO_GELF_LEVELS = {
  60 : LOG_LEVELS.FATAL,
  50 : LOG_LEVELS.ERROR,
  40 : LOG_LEVELS.WARN,
  30 : LOG_LEVELS.INFO,
  20 : LOG_LEVELS.DEBUG,
  10 : LOG_LEVELS.TRACE
}

var util   = require('util'),
    stream = require('stream');

/*
 * Creates the format stream to be used based on its options.
 *
 * @param options being used. The only option we have now is "raw", that is used to inform if we
 * must write raw objects or a stringified json representation.
 */
// function createFormatStream (options) {
//   var formatStream = null,
//       raw = options != null && options.raw == true;
//
//   options = options || {};
//
//   options.transform = function (chunk, encoding, done) {
//     var gelfObject = bunyanToGelf(chunk);
//
//     done(null, raw ? gelfObject : JSON.stringify(gelfObject));
//   };
//
//   formatStream = new stream.Transform(options);
//
//   // Since we are dealing with raw objects passed from the bunyan logger, we need to mark the
//   // objectMode attribute of both writable and readable states to true.
//   formatStream._writableState.objectMode = true;
//   formatStream._readableState.objectMode = true;
//
//   return formatStream;
// }

function FormatStream (options) {
  stream.Transform.call(this, options);

  this._writableState.objectMode = true;
  this._readableState.objectMode = true;
  this.raw = options != null && options.raw == true;
}

FormatStream.prototype = Object.create(
    stream.Transform.prototype, { constructor: { value: FormatStream }});

FormatStream.prototype._transform = function (chunk, encoding, done) {
  var gelfObject = bunyanToGelf(chunk);

  done(null, this.raw ? gelfObject : JSON.stringify(gelfObject));
};


function bunyanToGelf (log) {

  var errFile, key,
      ignoreFields = ['hostname', 'time', 'msg', 'name', 'level', 'v'],
      flattenedLog = flatten(log),
      gelfMsg = {
        host:          log.hostname,
        timestamp:     +new Date(log.time) / 1000,
        short_message: log.msg,
        facility:      log.name,
        level:         mapGelfLevel(log.level),
        version: GELF_VERSION
      }

  if (log.err && log.err.stack &&
      (errFile = log.err.stack.match(/\n\s+at .+ \(([^:]+)\:([0-9]+)/)) != null) {
    if (errFile[1]) gelfMsg.file = errFile[1]
    if (errFile[2]) gelfMsg.line = errFile[2]
  }

  for (key in flattenedLog) {
    if (ignoreFields.indexOf(key) < 0 && gelfMsg[key] == null)
      gelfMsg[key] = flattenedLog[key]
  }

  return gelfMsg
}

function flatten(obj, into, prefix, sep) {
  if (into == null) into = {}
  if (prefix == null) prefix = ''
  if (sep == null) sep = '.'
  var key, prop
  for (key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue
    prop = obj[key]
    if (typeof prop === 'object' && !(prop instanceof Date) && !(prop instanceof RegExp))
      flatten(prop, into, prefix + key + sep, sep)
    else
      into[prefix + key] = prop
  }
  return into
}

// maps the bunyan level to the gelf level.
function mapGelfLevel (bunyanLevel) {
  var level = BUNYAN_TO_GELF_LEVELS[bunyanLevel];

  // in case of undefined log levels it defaults to warn.
  return level >= 0 ? level : LOG_LEVELS.WARN;
}


/*
 * Core capabilities of the formatter.
 */
 module.exports = {
   GELF_VERSION : GELF_VERSION,
   LOG_LEVELS   : LOG_LEVELS,

   /**
    * Creates a formatting stream.
    */
   createStream : function (options) {
    //  return createFormatStream(options);
    return new FormatStream(options);
   }
 };
