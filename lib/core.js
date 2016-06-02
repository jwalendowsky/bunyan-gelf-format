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

var ignoredFields = {
  'hostname' : 'hostname',
  'time' : 'time',
  'msg' : 'msg',
  'name' : 'name',
  'level' : 'level',
  'v' : 'v',
  'err' : 'err'
};

var util   = require('util'),
    stream = require('stream');

// This is the FormatStream class, which is returned and used to transform bunyan messages to gelf
// ones.
function FormatStream (options) {
  stream.Transform.call(this, options);

  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.raw = options != null && options.raw == true;
}

// The FormatStream inherits from stream.Transform.
FormatStream.prototype = Object.create(
    stream.Transform.prototype, { constructor: { value: FormatStream }});

// This is the overriden method responsible for transforming the bunyan message to the gelf.
FormatStream.prototype._transform = function (chunk, encoding, done) {
  var gelfObject = bunyanToGelf(chunk);

  done(null, this.raw ? gelfObject : JSON.stringify(gelfObject));
};


function bunyanToGelf (bunyanMessage) {
  var gelfMessage = {
        host:          bunyanMessage.hostname,
        timestamp:     +new Date(bunyanMessage.time) / 1000,
        short_message: bunyanMessage.msg,
        level:         toGelfLevel(bunyanMessage.level),
        version:       GELF_VERSION,
        _facility:      bunyanMessage.name
      };

  // Error message handling.
  if (bunyanMessage.err && bunyanMessage.err.stack) {
    gelfMessage.full_message = bunyanMessage.err.stack;

    var errorFile = bunyanMessage.err.stack.match(/\n\s+at .+ \(([^:]+)\:([0-9]+)/);

    if (errorFile[1]) gelfMessage._file = errorFile[1];
    if (errorFile[2]) gelfMessage._line = errorFile[2];
  }

  // Now let's pass the additional fields to the message.
  copyAdditionalFields(bunyanMessage, gelfMessage);

  return gelfMessage;
}

function copyAdditionalFields(obj, into, prefix, sep, depth) {
  depth = depth || 0;
  if (into == null) into = {}
  if (prefix == null) prefix = '_'
  if (sep == null) sep = '.'
  var key, prop
  for (key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key) || (depth == 0 && ignoredFields[key])) continue
    prop = obj[key]
    if (typeof prop === 'object' && !(prop instanceof Date) && !(prop instanceof RegExp))
      copyAdditionalFields(prop, into, prefix + key + sep, sep, depth)
    else
      into[prefix + key] = prop
  }
  return into
}


// maps the bunyan level to the gelf level.
function toGelfLevel (bunyanLevel) {
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
