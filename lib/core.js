"use strict";

const GELF_VERSION = "1.1";

const LOG_LEVELS = {
  TRACE : 0,
  DEBUG : 0,
  INFO  : 1,
  WARN  : 2,
  ERROR : 3,
  FATAL : 4,
  UNKNOWN : 5
};

let util   = require('util'),
    stream = require('stream');

// Let's use extend the Transform class to create a transformation stream based on the
class FormatStream extends stream.Transform {
  constructor (options) {
    super(options);

    // if the option raw is passed, we should return the raw object.
    this.raw = options != null && options.raw == true;

    // Since we are dealing with raw objects passed from the bunyan logger, we need to mark the
    // objectMode attribute of both writable and readable states to true.
    this._writableState.objectMode = true;
    this._readableState.objectMode = this.raw;
  }

  // this is the overriden method of the format stream that is responsible to transforming the
  // object into a valid gelf stringified object.
  _transform(chunk, encoding, done) {
    let gelfObject = this.bunyanToGelf(chunk);

    done(null, this.raw ? gelfObject : JSON.stringify(gelfObject));
  }

  bunyanToGelf (log) {

    var errFile, key,
        ignoreFields = ['hostname', 'time', 'msg', 'name', 'level', 'v'],
        flattenedLog = this.flatten(log),
        gelfMsg = {
          host:          log.hostname,
          timestamp:     +new Date(log.time) / 1000,
          short_message: log.msg,
          facility:      log.name,
          level:         this.mapGelfLevel(log.level),
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

  flatten(obj, into, prefix, sep) {
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
  mapGelfLevel (bunyanLevel) {
    return (bunyanLevel - 20)/10;
  }
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
     return new FormatStream(options);
   }
 };
