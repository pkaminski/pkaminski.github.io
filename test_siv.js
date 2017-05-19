;(function (root, factory) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = exports = factory();
  }
  else if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  }
  else {
    // Global (browser)
    root.CryptoJS = factory();
  }
}(this, function () {

  /**
   * CryptoJS core components.
   */
  var CryptoJS = CryptoJS || (function (Math, undefined) {
      /**
       * CryptoJS namespace.
       */
      var C = {};

      /**
       * Library namespace.
       */
      var C_lib = C.lib = {};

      /**
       * Base object for prototypal inheritance.
       */
      var Base = C_lib.Base = (function () {
          function F() {}

          return {
              /**
               * Creates a new object that inherits from this object.
               *
               * @param {Object} overrides Properties to copy into the new object.
               *
               * @return {Object} The new object.
               *
               * @static
               *
               * @example
               *
               *     var MyType = CryptoJS.lib.Base.extend({
               *         field: 'value',
               *
               *         method: function () {
               *         }
               *     });
               */
              extend: function (overrides) {
                  // Spawn
                  F.prototype = this;
                  var subtype = new F();

                  // Augment
                  if (overrides) {
                      subtype.mixIn(overrides);
                  }

                  // Create default initializer
                  if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
                      subtype.init = function () {
                          subtype.$super.init.apply(this, arguments);
                      };
                  }

                  // Initializer's prototype is the subtype object
                  subtype.init.prototype = subtype;

                  // Reference supertype
                  subtype.$super = this;

                  return subtype;
              },

              /**
               * Extends this object and runs the init method.
               * Arguments to create() will be passed to init().
               *
               * @return {Object} The new object.
               *
               * @static
               *
               * @example
               *
               *     var instance = MyType.create();
               */
              create: function () {
                  var instance = this.extend();
                  instance.init.apply(instance, arguments);

                  return instance;
              },

              /**
               * Initializes a newly created object.
               * Override this method to add some logic when your objects are created.
               *
               * @example
               *
               *     var MyType = CryptoJS.lib.Base.extend({
               *         init: function () {
               *             // ...
               *         }
               *     });
               */
              init: function () {
              },

              /**
               * Copies properties into this object.
               *
               * @param {Object} properties The properties to mix in.
               *
               * @example
               *
               *     MyType.mixIn({
               *         field: 'value'
               *     });
               */
              mixIn: function (properties) {
                  for (var propertyName in properties) {
                      if (properties.hasOwnProperty(propertyName)) {
                          this[propertyName] = properties[propertyName];
                      }
                  }

                  // IE won't copy toString using the loop above
                  if (properties.hasOwnProperty('toString')) {
                      this.toString = properties.toString;
                  }
              },

              /**
               * Creates a copy of this object.
               *
               * @return {Object} The clone.
               *
               * @example
               *
               *     var clone = instance.clone();
               */
              clone: function () {
                  return this.init.prototype.extend(this);
              }
          };
      }());

      /**
       * An array of 32-bit words.
       *
       * @property {Array} words The array of 32-bit words.
       * @property {number} sigBytes The number of significant bytes in this word array.
       */
      var WordArray = C_lib.WordArray = Base.extend({
          /**
           * Initializes a newly created word array.
           *
           * @param {Array} words (Optional) An array of 32-bit words.
           * @param {number} sigBytes (Optional) The number of significant bytes in the words.
           *
           * @example
           *
           *     var wordArray = CryptoJS.lib.WordArray.create();
           *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
           *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
           */
          init: function (words, sigBytes) {
              words = this.words = words || [];

              if (sigBytes != undefined) {
                  this.sigBytes = sigBytes;
              } else {
                  this.sigBytes = words.length * 4;
              }
          },

          /**
           * Converts this word array to a string.
           *
           * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
           *
           * @return {string} The stringified word array.
           *
           * @example
           *
           *     var string = wordArray + '';
           *     var string = wordArray.toString();
           *     var string = wordArray.toString(CryptoJS.enc.Utf8);
           */
          toString: function (encoder) {
              return (encoder || Hex).stringify(this);
          },

          /**
           * Concatenates a word array to this word array.
           *
           * @param {WordArray} wordArray The word array to append.
           *
           * @return {WordArray} This word array.
           *
           * @example
           *
           *     wordArray1.concat(wordArray2);
           */
          concat: function (wordArray) {
              // Shortcuts
              var thisWords = this.words;
              var thatWords = wordArray.words;
              var thisSigBytes = this.sigBytes;
              var thatSigBytes = wordArray.sigBytes;

              // Clamp excess bits
              this.clamp();

              // Concat
              if (thisSigBytes % 4) {
                  // Copy one byte at a time
                  for (var i = 0; i < thatSigBytes; i++) {
                      var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                      thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                  }
              } else {
                  // Copy one word at a time
                  for (var i = 0; i < thatSigBytes; i += 4) {
                      thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                  }
              }
              this.sigBytes += thatSigBytes;

              // Chainable
              return this;
          },

          /**
           * Removes insignificant bits.
           *
           * @example
           *
           *     wordArray.clamp();
           */
          clamp: function () {
              // Shortcuts
              var words = this.words;
              var sigBytes = this.sigBytes;

              // Clamp
              words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
              words.length = Math.ceil(sigBytes / 4);
          },

          /**
           * Creates a copy of this word array.
           *
           * @return {WordArray} The clone.
           *
           * @example
           *
           *     var clone = wordArray.clone();
           */
          clone: function () {
              var clone = Base.clone.call(this);
              clone.words = this.words.slice(0);

              return clone;
          },

          /**
           * Creates a word array filled with random bytes.
           *
           * @param {number} nBytes The number of random bytes to generate.
           *
           * @return {WordArray} The random word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.lib.WordArray.random(16);
           */
          random: function (nBytes) {
              var words = [];

              var r = (function (m_w) {
                  var m_w = m_w;
                  var m_z = 0x3ade68b1;
                  var mask = 0xffffffff;

                  return function () {
                      m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
                      m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
                      var result = ((m_z << 0x10) + m_w) & mask;
                      result /= 0x100000000;
                      result += 0.5;
                      return result * (Math.random() > .5 ? 1 : -1);
                  }
              });

              for (var i = 0, rcache; i < nBytes; i += 4) {
                  var _r = r((rcache || Math.random()) * 0x100000000);

                  rcache = _r() * 0x3ade67b7;
                  words.push((_r() * 0x100000000) | 0);
              }

              return new WordArray.init(words, nBytes);
          }
      });

      /**
       * Encoder namespace.
       */
      var C_enc = C.enc = {};

      /**
       * Hex encoding strategy.
       */
      var Hex = C_enc.Hex = {
          /**
           * Converts a word array to a hex string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The hex string.
           *
           * @static
           *
           * @example
           *
           *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
           */
          stringify: function (wordArray) {
              // Shortcuts
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;

              // Convert
              var hexChars = [];
              for (var i = 0; i < sigBytes; i++) {
                  var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                  hexChars.push((bite >>> 4).toString(16));
                  hexChars.push((bite & 0x0f).toString(16));
              }

              return hexChars.join('');
          },

          /**
           * Converts a hex string to a word array.
           *
           * @param {string} hexStr The hex string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
           */
          parse: function (hexStr) {
              // Shortcut
              var hexStrLength = hexStr.length;

              // Convert
              var words = [];
              for (var i = 0; i < hexStrLength; i += 2) {
                  words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
              }

              return new WordArray.init(words, hexStrLength / 2);
          }
      };

      /**
       * Latin1 encoding strategy.
       */
      var Latin1 = C_enc.Latin1 = {
          /**
           * Converts a word array to a Latin1 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The Latin1 string.
           *
           * @static
           *
           * @example
           *
           *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
           */
          stringify: function (wordArray) {
              // Shortcuts
              var words = wordArray.words;
              var sigBytes = wordArray.sigBytes;

              // Convert
              var latin1Chars = [];
              for (var i = 0; i < sigBytes; i++) {
                  var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                  latin1Chars.push(String.fromCharCode(bite));
              }

              return latin1Chars.join('');
          },

          /**
           * Converts a Latin1 string to a word array.
           *
           * @param {string} latin1Str The Latin1 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
           */
          parse: function (latin1Str) {
              // Shortcut
              var latin1StrLength = latin1Str.length;

              // Convert
              var words = [];
              for (var i = 0; i < latin1StrLength; i++) {
                  words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
              }

              return new WordArray.init(words, latin1StrLength);
          }
      };

      /**
       * UTF-8 encoding strategy.
       */
      var Utf8 = C_enc.Utf8 = {
          /**
           * Converts a word array to a UTF-8 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The UTF-8 string.
           *
           * @static
           *
           * @example
           *
           *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
           */
          stringify: function (wordArray) {
              try {
                  return decodeURIComponent(escape(Latin1.stringify(wordArray)));
              } catch (e) {
                  throw new Error('Malformed UTF-8 data');
              }
          },

          /**
           * Converts a UTF-8 string to a word array.
           *
           * @param {string} utf8Str The UTF-8 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
           */
          parse: function (utf8Str) {
              return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
          }
      };

      /**
       * Abstract buffered block algorithm template.
       *
       * The property blockSize must be implemented in a concrete subtype.
       *
       * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
       */
      var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
          /**
           * Resets this block algorithm's data buffer to its initial state.
           *
           * @example
           *
           *     bufferedBlockAlgorithm.reset();
           */
          reset: function () {
              // Initial values
              this._data = new WordArray.init();
              this._nDataBytes = 0;
          },

          /**
           * Adds new data to this block algorithm's buffer.
           *
           * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
           *
           * @example
           *
           *     bufferedBlockAlgorithm._append('data');
           *     bufferedBlockAlgorithm._append(wordArray);
           */
          _append: function (data) {
              // Convert string to WordArray, else assume WordArray already
              if (typeof data == 'string') {
                  data = Utf8.parse(data);
              }

              // Append
              this._data.concat(data);
              this._nDataBytes += data.sigBytes;
          },

          /**
           * Processes available data blocks.
           *
           * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
           *
           * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
           *
           * @return {WordArray} The processed data.
           *
           * @example
           *
           *     var processedData = bufferedBlockAlgorithm._process();
           *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
           */
          _process: function (doFlush) {
              // Shortcuts
              var data = this._data;
              var dataWords = data.words;
              var dataSigBytes = data.sigBytes;
              var blockSize = this.blockSize;
              var blockSizeBytes = blockSize * 4;

              // Count blocks ready
              var nBlocksReady = dataSigBytes / blockSizeBytes;
              if (doFlush) {
                  // Round up to include partial blocks
                  nBlocksReady = Math.ceil(nBlocksReady);
              } else {
                  // Round down to include only full blocks,
                  // less the number of blocks that must remain in the buffer
                  nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
              }

              // Count words ready
              var nWordsReady = nBlocksReady * blockSize;

              // Count bytes ready
              var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

              // Process blocks
              if (nWordsReady) {
                  for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                      // Perform concrete-algorithm logic
                      this._doProcessBlock(dataWords, offset);
                  }

                  // Remove processed words
                  var processedWords = dataWords.splice(0, nWordsReady);
                  data.sigBytes -= nBytesReady;
              }

              // Return processed words
              return new WordArray.init(processedWords, nBytesReady);
          },

          /**
           * Creates a copy of this object.
           *
           * @return {Object} The clone.
           *
           * @example
           *
           *     var clone = bufferedBlockAlgorithm.clone();
           */
          clone: function () {
              var clone = Base.clone.call(this);
              clone._data = this._data.clone();

              return clone;
          },

          _minBufferSize: 0
      });

      /**
       * Abstract hasher template.
       *
       * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
       */
      var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
          /**
           * Configuration options.
           */
          cfg: Base.extend(),

          /**
           * Initializes a newly created hasher.
           *
           * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
           *
           * @example
           *
           *     var hasher = CryptoJS.algo.SHA256.create();
           */
          init: function (cfg) {
              // Apply config defaults
              this.cfg = this.cfg.extend(cfg);

              // Set initial values
              this.reset();
          },

          /**
           * Resets this hasher to its initial state.
           *
           * @example
           *
           *     hasher.reset();
           */
          reset: function () {
              // Reset data buffer
              BufferedBlockAlgorithm.reset.call(this);

              // Perform concrete-hasher logic
              this._doReset();
          },

          /**
           * Updates this hasher with a message.
           *
           * @param {WordArray|string} messageUpdate The message to append.
           *
           * @return {Hasher} This hasher.
           *
           * @example
           *
           *     hasher.update('message');
           *     hasher.update(wordArray);
           */
          update: function (messageUpdate) {
              // Append
              this._append(messageUpdate);

              // Update the hash
              this._process();

              // Chainable
              return this;
          },

          /**
           * Finalizes the hash computation.
           * Note that the finalize operation is effectively a destructive, read-once operation.
           *
           * @param {WordArray|string} messageUpdate (Optional) A final message update.
           *
           * @return {WordArray} The hash.
           *
           * @example
           *
           *     var hash = hasher.finalize();
           *     var hash = hasher.finalize('message');
           *     var hash = hasher.finalize(wordArray);
           */
          finalize: function (messageUpdate) {
              // Final message update
              if (messageUpdate) {
                  this._append(messageUpdate);
              }

              // Perform concrete-hasher logic
              var hash = this._doFinalize();

              return hash;
          },

          blockSize: 512/32,

          /**
           * Creates a shortcut function to a hasher's object interface.
           *
           * @param {Hasher} hasher The hasher to create a helper for.
           *
           * @return {Function} The shortcut function.
           *
           * @static
           *
           * @example
           *
           *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
           */
          _createHelper: function (hasher) {
              return function (message, cfg) {
                  return new hasher.init(cfg).finalize(message);
              };
          },

          /**
           * Creates a shortcut function to the HMAC's object interface.
           *
           * @param {Hasher} hasher The hasher to use in this HMAC helper.
           *
           * @return {Function} The shortcut function.
           *
           * @static
           *
           * @example
           *
           *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
           */
          _createHmacHelper: function (hasher) {
              return function (message, key) {
                  return new C_algo.HMAC.init(hasher, key).finalize(message);
              };
          }
      });

      /**
       * Algorithm namespace.
       */
      var C_algo = C.algo = {};

      return C;
  }(Math));


  return CryptoJS;

}));


;(function (root, factory) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = exports = factory(require("./core"));
  }
  else if (typeof define === "function" && define.amd) {
    // AMD
    define(["./core"], factory);
  }
  else {
    // Global (browser)
    factory(root.CryptoJS);
  }
}(this, function (CryptoJS) {

  /**
   * Cipher core components.
   */
  CryptoJS.lib.Cipher || (function (undefined) {
      // Shortcuts
      var C = CryptoJS;
      var C_lib = C.lib;
      var Base = C_lib.Base;
      var WordArray = C_lib.WordArray;
      var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
      var C_enc = C.enc;
      var Utf8 = C_enc.Utf8;
      var Base64 = C_enc.Base64;
      var C_algo = C.algo;
      var EvpKDF = C_algo.EvpKDF;

      /**
       * Abstract base cipher template.
       *
       * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
       * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
       * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
       * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
       */
      var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
          /**
           * Configuration options.
           *
           * @property {WordArray} iv The IV to use for this operation.
           */
          cfg: Base.extend(),

          /**
           * Creates this cipher in encryption mode.
           *
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {Cipher} A cipher instance.
           *
           * @static
           *
           * @example
           *
           *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
           */
          createEncryptor: function (key, cfg) {
              return this.create(this._ENC_XFORM_MODE, key, cfg);
          },

          /**
           * Creates this cipher in decryption mode.
           *
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {Cipher} A cipher instance.
           *
           * @static
           *
           * @example
           *
           *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
           */
          createDecryptor: function (key, cfg) {
              return this.create(this._DEC_XFORM_MODE, key, cfg);
          },

          /**
           * Initializes a newly created cipher.
           *
           * @param {number} xformMode Either the encryption or decryption transormation mode constant.
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @example
           *
           *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
           */
          init: function (xformMode, key, cfg) {
              // Apply config defaults
              this.cfg = this.cfg.extend(cfg);

              // Store transform mode and key
              this._xformMode = xformMode;
              this._key = key;

              // Set initial values
              this.reset();
          },

          /**
           * Resets this cipher to its initial state.
           *
           * @example
           *
           *     cipher.reset();
           */
          reset: function () {
              // Reset data buffer
              BufferedBlockAlgorithm.reset.call(this);

              // Perform concrete-cipher logic
              this._doReset();
          },

          /**
           * Adds data to be encrypted or decrypted.
           *
           * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
           *
           * @return {WordArray} The data after processing.
           *
           * @example
           *
           *     var encrypted = cipher.process('data');
           *     var encrypted = cipher.process(wordArray);
           */
          process: function (dataUpdate) {
              // Append
              this._append(dataUpdate);

              // Process available blocks
              return this._process();
          },

          /**
           * Finalizes the encryption or decryption process.
           * Note that the finalize operation is effectively a destructive, read-once operation.
           *
           * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
           *
           * @return {WordArray} The data after final processing.
           *
           * @example
           *
           *     var encrypted = cipher.finalize();
           *     var encrypted = cipher.finalize('data');
           *     var encrypted = cipher.finalize(wordArray);
           */
          finalize: function (dataUpdate) {
              // Final data update
              if (dataUpdate) {
                  this._append(dataUpdate);
              }

              // Perform concrete-cipher logic
              var finalProcessedData = this._doFinalize();

              return finalProcessedData;
          },

          keySize: 128/32,

          ivSize: 128/32,

          _ENC_XFORM_MODE: 1,

          _DEC_XFORM_MODE: 2,

          /**
           * Creates shortcut functions to a cipher's object interface.
           *
           * @param {Cipher} cipher The cipher to create a helper for.
           *
           * @return {Object} An object with encrypt and decrypt shortcut functions.
           *
           * @static
           *
           * @example
           *
           *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
           */
          _createHelper: (function () {
              function selectCipherStrategy(key) {
                  if (typeof key == 'string') {
                      return PasswordBasedCipher;
                  } else {
                      return SerializableCipher;
                  }
              }

              return function (cipher) {
                  return {
                      encrypt: function (message, key, cfg) {
                          return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                      },

                      decrypt: function (ciphertext, key, cfg) {
                          return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                      }
                  };
              };
          }())
      });

      /**
       * Abstract base stream cipher template.
       *
       * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
       */
      var StreamCipher = C_lib.StreamCipher = Cipher.extend({
          _doFinalize: function () {
              // Process partial blocks
              var finalProcessedBlocks = this._process(!!'flush');

              return finalProcessedBlocks;
          },

          blockSize: 1
      });

      /**
       * Mode namespace.
       */
      var C_mode = C.mode = {};

      /**
       * Abstract base block cipher mode template.
       */
      var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
          /**
           * Creates this mode for encryption.
           *
           * @param {Cipher} cipher A block cipher instance.
           * @param {Array} iv The IV words.
           *
           * @static
           *
           * @example
           *
           *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
           */
          createEncryptor: function (cipher, iv) {
              return this.Encryptor.create(cipher, iv);
          },

          /**
           * Creates this mode for decryption.
           *
           * @param {Cipher} cipher A block cipher instance.
           * @param {Array} iv The IV words.
           *
           * @static
           *
           * @example
           *
           *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
           */
          createDecryptor: function (cipher, iv) {
              return this.Decryptor.create(cipher, iv);
          },

          /**
           * Initializes a newly created mode.
           *
           * @param {Cipher} cipher A block cipher instance.
           * @param {Array} iv The IV words.
           *
           * @example
           *
           *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
           */
          init: function (cipher, iv) {
              this._cipher = cipher;
              this._iv = iv;
          }
      });

      /**
       * Cipher Block Chaining mode.
       */
      var CBC = C_mode.CBC = (function () {
          /**
           * Abstract base CBC mode.
           */
          var CBC = BlockCipherMode.extend();

          /**
           * CBC encryptor.
           */
          CBC.Encryptor = CBC.extend({
              /**
               * Processes the data block at offset.
               *
               * @param {Array} words The data words to operate on.
               * @param {number} offset The offset where the block starts.
               *
               * @example
               *
               *     mode.processBlock(data.words, offset);
               */
              processBlock: function (words, offset) {
                  // Shortcuts
                  var cipher = this._cipher;
                  var blockSize = cipher.blockSize;

                  // XOR and encrypt
                  xorBlock.call(this, words, offset, blockSize);
                  cipher.encryptBlock(words, offset);

                  // Remember this block to use with next block
                  this._prevBlock = words.slice(offset, offset + blockSize);
              }
          });

          /**
           * CBC decryptor.
           */
          CBC.Decryptor = CBC.extend({
              /**
               * Processes the data block at offset.
               *
               * @param {Array} words The data words to operate on.
               * @param {number} offset The offset where the block starts.
               *
               * @example
               *
               *     mode.processBlock(data.words, offset);
               */
              processBlock: function (words, offset) {
                  // Shortcuts
                  var cipher = this._cipher;
                  var blockSize = cipher.blockSize;

                  // Remember this block to use with next block
                  var thisBlock = words.slice(offset, offset + blockSize);

                  // Decrypt and XOR
                  cipher.decryptBlock(words, offset);
                  xorBlock.call(this, words, offset, blockSize);

                  // This block becomes the previous block
                  this._prevBlock = thisBlock;
              }
          });

          CBC.reinitOK = true;

          function xorBlock(words, offset, blockSize) {
              // Shortcut
              var iv = this._iv;

              // Choose mixing block
              if (iv) {
                  var block = iv;

                  // Remove IV for subsequent blocks
                  this._iv = undefined;
              } else {
                  var block = this._prevBlock;
              }

              // XOR blocks
              for (var i = 0; i < blockSize; i++) {
                  words[offset + i] ^= block[i];
              }
          }

          return CBC;
      }());

      /**
       * Padding namespace.
       */
      var C_pad = C.pad = {};

      /**
       * PKCS #5/7 padding strategy.
       */
      var Pkcs7 = C_pad.Pkcs7 = {
          /**
           * Pads data using the algorithm defined in PKCS #5/7.
           *
           * @param {WordArray} data The data to pad.
           * @param {number} blockSize The multiple that the data should be padded to.
           *
           * @static
           *
           * @example
           *
           *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
           */
          pad: function (data, blockSize) {
              // Shortcut
              var blockSizeBytes = blockSize * 4;

              // Count padding bytes
              var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

              // Create padding word
              var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

              // Create padding
              var paddingWords = [];
              for (var i = 0; i < nPaddingBytes; i += 4) {
                  paddingWords.push(paddingWord);
              }
              var padding = WordArray.create(paddingWords, nPaddingBytes);

              // Add padding
              data.concat(padding);
          },

          /**
           * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
           *
           * @param {WordArray} data The data to unpad.
           *
           * @static
           *
           * @example
           *
           *     CryptoJS.pad.Pkcs7.unpad(wordArray);
           */
          unpad: function (data) {
              // Get number of padding bytes from last byte
              var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

              // Remove padding
              data.sigBytes -= nPaddingBytes;
          }
      };

      /**
       * Abstract base block cipher template.
       *
       * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
       */
      var BlockCipher = C_lib.BlockCipher = Cipher.extend({
          /**
           * Configuration options.
           *
           * @property {Mode} mode The block mode to use. Default: CBC
           * @property {Padding} padding The padding strategy to use. Default: Pkcs7
           */
          cfg: Cipher.cfg.extend({
              mode: CBC,
              padding: Pkcs7
          }),

          reset: function () {
              // Reset cipher
              Cipher.reset.call(this);

              // Shortcuts
              var cfg = this.cfg;
              var iv = cfg.iv;
              var mode = cfg.mode;

              if (this._mode && mode.reinitOK) {
                  this._mode.init(this, iv && iv.words);
              } else {
                  // Reset block mode
                  if (this._xformMode == this._ENC_XFORM_MODE) {
                      var modeCreator = mode.createEncryptor;
                  } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                      var modeCreator = mode.createDecryptor;

                      // Keep at least one block in the buffer for unpadding
                      this._minBufferSize = 1;
                  }
                  this._mode = modeCreator.call(mode, this, iv && iv.words);
              }
          },

          _doProcessBlock: function (words, offset) {
              this._mode.processBlock(words, offset);
          },

          _doFinalize: function () {
              // Shortcut
              var padding = this.cfg.padding;

              // Finalize
              if (this._xformMode == this._ENC_XFORM_MODE) {
                  // Pad data
                  padding.pad(this._data, this.blockSize);

                  // Process final blocks
                  var finalProcessedBlocks = this._process(!!'flush');
              } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                  // Process final blocks
                  var finalProcessedBlocks = this._process(!!'flush');

                  // Unpad data
                  padding.unpad(finalProcessedBlocks);
              }

              return finalProcessedBlocks;
          },

          blockSize: 128/32
      });

      /**
       * A collection of cipher parameters.
       *
       * @property {WordArray} ciphertext The raw ciphertext.
       * @property {WordArray} key The key to this ciphertext.
       * @property {WordArray} iv The IV used in the ciphering operation.
       * @property {WordArray} salt The salt used with a key derivation function.
       * @property {Cipher} algorithm The cipher algorithm.
       * @property {Mode} mode The block mode used in the ciphering operation.
       * @property {Padding} padding The padding scheme used in the ciphering operation.
       * @property {number} blockSize The block size of the cipher.
       * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
       */
      var CipherParams = C_lib.CipherParams = Base.extend({
          /**
           * Initializes a newly created cipher params object.
           *
           * @param {Object} cipherParams An object with any of the possible cipher parameters.
           *
           * @example
           *
           *     var cipherParams = CryptoJS.lib.CipherParams.create({
           *         ciphertext: ciphertextWordArray,
           *         key: keyWordArray,
           *         iv: ivWordArray,
           *         salt: saltWordArray,
           *         algorithm: CryptoJS.algo.AES,
           *         mode: CryptoJS.mode.CBC,
           *         padding: CryptoJS.pad.PKCS7,
           *         blockSize: 4,
           *         formatter: CryptoJS.format.OpenSSL
           *     });
           */
          init: function (cipherParams) {
              this.mixIn(cipherParams);
          },

          /**
           * Converts this cipher params object to a string.
           *
           * @param {Format} formatter (Optional) The formatting strategy to use.
           *
           * @return {string} The stringified cipher params.
           *
           * @throws Error If neither the formatter nor the default formatter is set.
           *
           * @example
           *
           *     var string = cipherParams + '';
           *     var string = cipherParams.toString();
           *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
           */
          toString: function (formatter) {
              return (formatter || this.formatter).stringify(this);
          }
      });

      /**
       * Format namespace.
       */
      var C_format = C.format = {};

      /**
       * OpenSSL formatting strategy.
       */
      var OpenSSLFormatter = C_format.OpenSSL = {
          /**
           * Converts a cipher params object to an OpenSSL-compatible string.
           *
           * @param {CipherParams} cipherParams The cipher params object.
           *
           * @return {string} The OpenSSL-compatible string.
           *
           * @static
           *
           * @example
           *
           *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
           */
          stringify: function (cipherParams) {
              // Shortcuts
              var ciphertext = cipherParams.ciphertext;
              var salt = cipherParams.salt;

              // Format
              if (salt) {
                  var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
              } else {
                  var wordArray = ciphertext;
              }

              return wordArray.toString(Base64);
          },

          /**
           * Converts an OpenSSL-compatible string to a cipher params object.
           *
           * @param {string} openSSLStr The OpenSSL-compatible string.
           *
           * @return {CipherParams} The cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
           */
          parse: function (openSSLStr) {
              // Parse base64
              var ciphertext = Base64.parse(openSSLStr);

              // Shortcut
              var ciphertextWords = ciphertext.words;

              // Test for salt
              if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
                  // Extract salt
                  var salt = WordArray.create(ciphertextWords.slice(2, 4));

                  // Remove salt from ciphertext
                  ciphertextWords.splice(0, 4);
                  ciphertext.sigBytes -= 16;
              }

              return CipherParams.create({ ciphertext: ciphertext, salt: salt });
          }
      };

      /**
       * A cipher wrapper that returns ciphertext as a serializable cipher params object.
       */
      var SerializableCipher = C_lib.SerializableCipher = Base.extend({
          /**
           * Configuration options.
           *
           * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
           */
          cfg: Base.extend({
              format: OpenSSLFormatter
          }),

          /**
           * Encrypts a message.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {WordArray|string} message The message to encrypt.
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {CipherParams} A cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
           */
          encrypt: function (cipher, message, key, cfg) {
              // Apply config defaults
              cfg = this.cfg.extend(cfg);

              // Encrypt
              var encryptor = cipher.createEncryptor(key, cfg);
              var ciphertext = encryptor.finalize(message);

              // Shortcut
              var cipherCfg = encryptor.cfg;

              // Create and return serializable cipher params
              return CipherParams.create({
                  ciphertext: ciphertext,
                  key: key,
                  iv: cipherCfg.iv,
                  algorithm: cipher,
                  mode: cipherCfg.mode,
                  padding: cipherCfg.padding,
                  blockSize: cipher.blockSize,
                  formatter: cfg.format
              });
          },

          /**
           * Decrypts serialized ciphertext.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
           * @param {WordArray} key The key.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {WordArray} The plaintext.
           *
           * @static
           *
           * @example
           *
           *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
           *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
           */
          decrypt: function (cipher, ciphertext, key, cfg) {
              // Apply config defaults
              cfg = this.cfg.extend(cfg);

              // Convert string to CipherParams
              ciphertext = this._parse(ciphertext, cfg.format);

              // Decrypt
              var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

              return plaintext;
          },

          /**
           * Converts serialized ciphertext to CipherParams,
           * else assumed CipherParams already and returns ciphertext unchanged.
           *
           * @param {CipherParams|string} ciphertext The ciphertext.
           * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
           *
           * @return {CipherParams} The unserialized ciphertext.
           *
           * @static
           *
           * @example
           *
           *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
           */
          _parse: function (ciphertext, format) {
              if (typeof ciphertext == 'string') {
                  return format.parse(ciphertext, this);
              } else {
                  return ciphertext;
              }
          }
      });

      /**
       * Key derivation function namespace.
       */
      var C_kdf = C.kdf = {};

      /**
       * OpenSSL key derivation function.
       */
      var OpenSSLKdf = C_kdf.OpenSSL = {
          /**
           * Derives a key and IV from a password.
           *
           * @param {string} password The password to derive from.
           * @param {number} keySize The size in words of the key to generate.
           * @param {number} ivSize The size in words of the IV to generate.
           * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
           *
           * @return {CipherParams} A cipher params object with the key, IV, and salt.
           *
           * @static
           *
           * @example
           *
           *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
           *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
           */
          execute: function (password, keySize, ivSize, salt) {
              // Generate random salt
              if (!salt) {
                  salt = WordArray.random(64/8);
              }

              // Derive key and IV
              var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

              // Separate key and IV
              var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
              key.sigBytes = keySize * 4;

              // Return params
              return CipherParams.create({ key: key, iv: iv, salt: salt });
          }
      };

      /**
       * A serializable cipher wrapper that derives the key from a password,
       * and returns ciphertext as a serializable cipher params object.
       */
      var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
          /**
           * Configuration options.
           *
           * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
           */
          cfg: SerializableCipher.cfg.extend({
              kdf: OpenSSLKdf
          }),

          /**
           * Encrypts a message using a password.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {WordArray|string} message The message to encrypt.
           * @param {string} password The password.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {CipherParams} A cipher params object.
           *
           * @static
           *
           * @example
           *
           *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
           *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
           */
          encrypt: function (cipher, message, password, cfg) {
              // Apply config defaults
              cfg = this.cfg.extend(cfg);

              // Derive key and other params
              var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

              // Add IV to config
              cfg.iv = derivedParams.iv;

              // Encrypt
              var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

              // Mix in derived params
              ciphertext.mixIn(derivedParams);

              return ciphertext;
          },

          /**
           * Decrypts serialized ciphertext using a password.
           *
           * @param {Cipher} cipher The cipher algorithm to use.
           * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
           * @param {string} password The password.
           * @param {Object} cfg (Optional) The configuration options to use for this operation.
           *
           * @return {WordArray} The plaintext.
           *
           * @static
           *
           * @example
           *
           *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
           *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
           */
          decrypt: function (cipher, ciphertext, password, cfg) {
              // Apply config defaults
              cfg = this.cfg.extend(cfg);

              // Convert string to CipherParams
              ciphertext = this._parse(ciphertext, cfg.format);

              // Derive key and other params
              var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

              // Add IV to config
              cfg.iv = derivedParams.iv;

              // Decrypt
              var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

              return plaintext;
          }
      });
  }());


}));


;(function (root, factory, undef) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core"));
  }
  else if (typeof define === "function" && define.amd) {
    // AMD
    define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
  }
  else {
    // Global (browser)
    factory(root.CryptoJS);
  }
}(this, function (CryptoJS) {

  (function () {
      // Shortcuts
      var C = CryptoJS;
      var C_lib = C.lib;
      var BlockCipher = C_lib.BlockCipher;
      var C_algo = C.algo;

      // Lookup tables
      var SBOX = [];
      var INV_SBOX = [];
      var SUB_MIX_0 = [];
      var SUB_MIX_1 = [];
      var SUB_MIX_2 = [];
      var SUB_MIX_3 = [];
      var INV_SUB_MIX_0 = [];
      var INV_SUB_MIX_1 = [];
      var INV_SUB_MIX_2 = [];
      var INV_SUB_MIX_3 = [];

      // Compute lookup tables
      (function () {
          // Compute double table
          var d = [];
          for (var i = 0; i < 256; i++) {
              if (i < 128) {
                  d[i] = i << 1;
              } else {
                  d[i] = (i << 1) ^ 0x11b;
              }
          }

          // Walk GF(2^8)
          var x = 0;
          var xi = 0;
          for (var i = 0; i < 256; i++) {
              // Compute sbox
              var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
              sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
              SBOX[x] = sx;
              INV_SBOX[sx] = x;

              // Compute multiplication
              var x2 = d[x];
              var x4 = d[x2];
              var x8 = d[x4];

              // Compute sub bytes, mix columns tables
              var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
              SUB_MIX_0[x] = (t << 24) | (t >>> 8);
              SUB_MIX_1[x] = (t << 16) | (t >>> 16);
              SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
              SUB_MIX_3[x] = t;

              // Compute inv sub bytes, inv mix columns tables
              var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
              INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
              INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
              INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
              INV_SUB_MIX_3[sx] = t;

              // Compute next counter
              if (!x) {
                  x = xi = 1;
              } else {
                  x = x2 ^ d[d[d[x8 ^ x2]]];
                  xi ^= d[d[xi]];
              }
          }
      }());

      // Precomputed Rcon lookup
      var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

      /**
       * AES block cipher algorithm.
       */
      var AES = C_algo.AES = BlockCipher.extend({
          _doReset: function () {
              // Shortcuts
              var key = this._key;
              var keyWords = key.words;
              var keySize = key.sigBytes / 4;

              // Compute number of rounds
              var nRounds = this._nRounds = keySize + 6

              // Compute number of key schedule rows
              var ksRows = (nRounds + 1) * 4;

              // Compute key schedule
              var keySchedule = this._keySchedule = [];
              for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                  if (ksRow < keySize) {
                      keySchedule[ksRow] = keyWords[ksRow];
                  } else {
                      var t = keySchedule[ksRow - 1];

                      if (!(ksRow % keySize)) {
                          // Rot word
                          t = (t << 8) | (t >>> 24);

                          // Sub word
                          t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

                          // Mix Rcon
                          t ^= RCON[(ksRow / keySize) | 0] << 24;
                      } else if (keySize > 6 && ksRow % keySize == 4) {
                          // Sub word
                          t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                      }

                      keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                  }
              }

              // Compute inv key schedule
              var invKeySchedule = this._invKeySchedule = [];
              for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                  var ksRow = ksRows - invKsRow;

                  if (invKsRow % 4) {
                      var t = keySchedule[ksRow];
                  } else {
                      var t = keySchedule[ksRow - 4];
                  }

                  if (invKsRow < 4 || ksRow <= 4) {
                      invKeySchedule[invKsRow] = t;
                  } else {
                      invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                                 INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                  }
              }
          },

          encryptBlock: function (M, offset) {
              this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
          },

          decryptBlock: function (M, offset) {
              // Swap 2nd and 4th rows
              var t = M[offset + 1];
              M[offset + 1] = M[offset + 3];
              M[offset + 3] = t;

              this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

              // Inv swap 2nd and 4th rows
              var t = M[offset + 1];
              M[offset + 1] = M[offset + 3];
              M[offset + 3] = t;
          },

          _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
              // Shortcut
              var nRounds = this._nRounds;

              // Get input, add round key
              var s0 = M[offset]     ^ keySchedule[0];
              var s1 = M[offset + 1] ^ keySchedule[1];
              var s2 = M[offset + 2] ^ keySchedule[2];
              var s3 = M[offset + 3] ^ keySchedule[3];

              // Key schedule row counter
              var ksRow = 4;

              // Rounds
              for (var round = 1; round < nRounds; round++) {
                  // Shift rows, sub bytes, mix columns, add round key
                  var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                  var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                  var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                  var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

                  // Update state
                  s0 = t0;
                  s1 = t1;
                  s2 = t2;
                  s3 = t3;
              }

              // Shift rows, sub bytes, add round key
              var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
              var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
              var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
              var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

              // Set output
              M[offset]     = t0;
              M[offset + 1] = t1;
              M[offset + 2] = t2;
              M[offset + 3] = t3;
          },

          keySize: 256/32
      });

      /**
       * Shortcut functions to the cipher's object interface.
       *
       * @example
       *
       *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
       *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
       */
      C.AES = BlockCipher._createHelper(AES);
  }());


  return CryptoJS.AES;

}));

;(function (root, factory, undef) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = exports = factory(require("./core"), require("./cipher-core"));
  }
  else if (typeof define === "function" && define.amd) {
    // AMD
    define(["./core", "./cipher-core"], factory);
  }
  else {
    // Global (browser)
    factory(root.CryptoJS);
  }
}(this, function (CryptoJS) {

  /**
   * Counter block mode.
   */
  CryptoJS.mode.CTR = (function () {
      var CTR = CryptoJS.lib.BlockCipherMode.extend();

      var Encryptor = CTR.Encryptor = CTR.extend({
          processBlock: function (words, offset) {
              // Shortcuts
              var cipher = this._cipher
              var blockSize = cipher.blockSize;
              var iv = this._iv;
              var counter = this._counter;

              // Generate keystream
              if (iv) {
                  counter = this._counter = iv.slice(0);

                  // Remove IV for subsequent blocks
                  this._iv = undefined;
              }
              var keystream = counter.slice(0);
              cipher.encryptBlock(keystream, 0);

              // Increment counter
              counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0

              // Encrypt
              for (var i = 0; i < blockSize; i++) {
                  words[offset + i] ^= keystream[i];
              }
          }
      });

      CTR.Decryptor = Encryptor;

      CTR.reinitOK = true;

      return CTR;
  }());


  return CryptoJS.mode.CTR;

}));

;(function (root, factory, undef) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define(["crypto-js/core", "crypto-js/aes", "crypto-js/mode-ctr"], factory);
  }
  else {
    // Global (browser)
    factory(root.CryptoJS);
  }
}(this, function (C) {

  /*
   * The MIT License (MIT)
   *
   * Copyright (c) 2015 artjomb
   */
  // put on ext property in CryptoJS
  var ext;
  if (!C.hasOwnProperty("ext")) {
      ext = C.ext = {};
  } else {
      ext = C.ext;
  }

  /**
   * Shifts the array by n bits to the left. Zero bits are added as the
   * least significant bits. This operation modifies the current array.
   *
   * @param {WordArray} wordArray WordArray to work on
   * @param {int} n Bits to shift by
   *
   * @returns the WordArray that was passed in
   */
  ext.bitshift = function(wordArray, n){
      var carry = 0,
          words = wordArray.words,
          wres,
          skipped = 0,
          carryMask;
      if (n > 0) {
          while(n > 31) {
              // delete first element:
              words.splice(0, 1);

              // add `0` word to the back
              words.push(0);

              n -= 32;
              skipped++;
          }
          if (n == 0) {
              // 1. nothing to shift if the shift amount is on a word boundary
              // 2. This has to be done, because the following algorithm computes
              // wrong values only for n==0
              return carry;
          }
          for(var i = words.length - skipped - 1; i >= 0; i--) {
              wres = words[i];
              words[i] <<= n;
              words[i] |= carry;
              carry = wres >>> (32 - n);
          }
      } else if (n < 0) {
          while(n < -31) {
              // insert `0` word to the front:
              words.splice(0, 0, 0);

              // remove last element:
              words.length--;

              n += 32;
              skipped++;
          }
          if (n == 0) {
              // nothing to shift if the shift amount is on a word boundary
              return carry;
          }
          n = -n;
          carryMask = (1 << n) - 1;
          for(var i = skipped; i < words.length; i++) {
              wres = words[i] & carryMask;
              words[i] >>>= n;
              words[i] |= carry;
              carry = wres << (32 - n);
          }
      }
      return carry;
  };

  /**
   * Negates all bits in the WordArray. This manipulates the given array.
   *
   * @param {WordArray} wordArray WordArray to work on
   *
   * @returns the WordArray that was passed in
   */
  ext.neg = function(wordArray){
      var words = wordArray.words;
      for(var i = 0; i < words.length; i++) {
          words[i] = ~words[i];
      }
      return wordArray;
  };

  /**
   * Applies XOR on both given word arrays and returns a third resulting
   * WordArray. The initial word arrays must have the same length
   * (significant bytes).
   *
   * @param {WordArray} wordArray1 WordArray
   * @param {WordArray} wordArray2 WordArray
   *
   * @returns first passed WordArray (modified)
   */
  ext.xor = function(wordArray1, wordArray2){
      for(var i = 0; i < wordArray1.words.length; i++) {
          wordArray1.words[i] ^= wordArray2.words[i];
      }
      return wordArray1;
  };

  /**
   * Logical AND between the two passed arrays. Both arrays must have the
   * same length.
   *
   * @param {WordArray} arr1 Array 1
   * @param {WordArray} arr2 Array 2
   *
   * @returns new WordArray
   */
  ext.bitand = function(arr1, arr2){
      var newArr = arr1.clone(),
          tw = newArr.words,
          ow = arr2.words;
      for(var i = 0; i < tw.length; i++) {
          tw[i] &= ow[i];
      }
      return newArr;
  };


  /*
   * The MIT License (MIT)
   *
   * Copyright (c) 2015 artjomb
   */
  // put on ext property in CryptoJS
  var ext;
  if (!C.hasOwnProperty("ext")) {
      ext = C.ext = {};
  } else {
      ext = C.ext;
  }

  // Shortcuts
  var Base = C.lib.Base;
  var WordArray = C.lib.WordArray;

  // Constants
  ext.const_Zero = new WordArray.init([0x00000000, 0x00000000, 0x00000000, 0x00000000]);
  ext.const_One = new WordArray.init([0x00000000, 0x00000000, 0x00000000, 0x00000001]);
  ext.const_Rb = new WordArray.init([0x00000000, 0x00000000, 0x00000000, 0x00000087]); // 00..0010000111
  ext.const_Rb_Shifted = new WordArray.init([0x80000000, 0x00000000, 0x00000000, 0x00000043]); // 100..001000011
  ext.const_nonMSB = new WordArray.init([0xFFFFFFFF, 0xFFFFFFFF, 0x7FFFFFFF, 0x7FFFFFFF]); // 1^64 || 0^1 || 1^31 || 0^1 || 1^31

  /**
   * Looks into the object to see if it is a WordArray.
   *
   * @param obj Some object
   *
   * @returns {boolean}

   */
  ext.isWordArray = function(obj) {
      return obj && typeof obj.clamp === "function" && typeof obj.concat === "function" && typeof obj.words === "array";
  }

  /**
   * This padding is a 1 bit followed by as many 0 bits as needed to fill
   * up the block. This implementation doesn't work on bits directly,
   * but on bytes. Therefore the granularity is much bigger.
   */
  C.pad.OneZeroPadding = {
      pad: function (data, blocksize) {
          // Shortcut
          var blockSizeBytes = blocksize * 4;

          // Count padding bytes
          var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

          // Create padding
          var paddingWords = [];
          for (var i = 0; i < nPaddingBytes; i += 4) {
              var paddingWord = 0x00000000;
              if (i === 0) {
                  paddingWord = 0x80000000;
              }
              paddingWords.push(paddingWord);
          }
          var padding = new WordArray.init(paddingWords, nPaddingBytes);

          // Add padding
          data.concat(padding);
      },
      unpad: function () {
          // TODO: implement
      }
  };

  /**
   * No padding is applied. This is necessary for streaming cipher modes
   * like CTR.
   */
  C.pad.NoPadding = {
      pad: function () {},
      unpad: function () {}
  };

  /**
   * Returns the n leftmost bytes of the WordArray.
   *
   * @param {WordArray} wordArray WordArray to work on
   * @param {int} n Bytes to retrieve
   *
   * @returns new WordArray
   */
  ext.leftmostBytes = function(wordArray, n){
      var lmArray = wordArray.clone();
      lmArray.sigBytes = n;
      lmArray.clamp();
      return lmArray;
  };

  /**
   * Returns the n rightmost bytes of the WordArray.
   *
   * @param {WordArray} wordArray WordArray to work on
   * @param {int} n Bytes to retrieve (must be positive)
   *
   * @returns new WordArray
   */
  ext.rightmostBytes = function(wordArray, n){
      wordArray.clamp();
      var wordSize = 32;
      var rmArray = wordArray.clone();
      var bitsToShift = (rmArray.sigBytes - n) * 8;
      if (bitsToShift >= wordSize) {
          var popCount = Math.floor(bitsToShift/wordSize);
          bitsToShift -= popCount * wordSize;
          rmArray.words.splice(0, popCount);
          rmArray.sigBytes -= popCount * wordSize / 8;
      }
      if (bitsToShift > 0) {
          ext.bitshift(rmArray, bitsToShift);
          rmArray.sigBytes -= bitsToShift / 8;
      }
      return rmArray;
  };

  /**
   * Returns the n rightmost words of the WordArray. It assumes
   * that the current WordArray has at least n words.
   *
   * @param {WordArray} wordArray WordArray to work on
   * @param {int} n Words to retrieve (must be positive)
   *
   * @returns popped words as new WordArray
   */
  ext.popWords = function(wordArray, n){
      var left = wordArray.words.splice(0, n);
      wordArray.sigBytes -= n * 4;
      return new WordArray.init(left);
  };

  /**
   * Shifts the array to the left and returns the shifted dropped elements
   * as WordArray. The initial WordArray must contain at least n bytes and
   * they have to be significant.
   *
   * @param {WordArray} wordArray WordArray to work on (is modified)
   * @param {int} n Bytes to shift (must be positive, default 16)
   *
   * @returns new WordArray
   */
  ext.shiftBytes = function(wordArray, n){
      n = n || 16;
      var r = n % 4;
      n -= r;

      var shiftedArray = new WordArray.init();
      for(var i = 0; i < n; i += 4) {
          shiftedArray.words.push(wordArray.words.shift());
          wordArray.sigBytes -= 4;
          shiftedArray.sigBytes += 4;
      }
      if (r > 0) {
          shiftedArray.words.push(wordArray.words[0]);
          shiftedArray.sigBytes += r;

          ext.bitshift(wordArray, r * 8);
          wordArray.sigBytes -= r;
      }
      return shiftedArray;
  };

  /**
   * XORs arr2 to the end of arr1 array. This doesn't modify the current
   * array aside from clamping.
   *
   * @param {WordArray} arr1 Bigger array
   * @param {WordArray} arr2 Smaller array to be XORed to the end
   *
   * @returns new WordArray
   */
  ext.xorendBytes = function(arr1, arr2){
      // TODO: more efficient
      return ext.leftmostBytes(arr1, arr1.sigBytes-arr2.sigBytes)
              .concat(ext.xor(ext.rightmostBytes(arr1, arr2.sigBytes), arr2));
  };

  /**
   * Doubling operation on a 128-bit value. This operation modifies the
   * passed array.
   *
   * @param {WordArray} wordArray WordArray to work on
   *
   * @returns passed WordArray
   */
  ext.dbl = function(wordArray){
      var carry = ext.msb(wordArray);
      ext.bitshift(wordArray, 1);
      ext.xor(wordArray, carry === 1 ? ext.const_Rb : ext.const_Zero);
      return wordArray;
  };

  /**
   * Inverse operation on a 128-bit value. This operation modifies the
   * passed array.
   *
   * @param {WordArray} wordArray WordArray to work on
   *
   * @returns passed WordArray
   */
  ext.inv = function(wordArray){
      var carry = wordArray.words[4] & 1;
      ext.bitshift(wordArray, -1);
      ext.xor(wordArray, carry === 1 ? ext.const_Rb_Shifted : ext.const_Zero);
      return wordArray;
  };

  /**
   * Check whether the word arrays are equal.
   *
   * @param {WordArray} arr1 Array 1
   * @param {WordArray} arr2 Array 2
   *
   * @returns boolean
   */
  ext.equals = function(arr1, arr2){
      if (!arr2 || !arr2.words || arr1.sigBytes !== arr2.sigBytes) {
          return false;
      }
      arr1.clamp();
      arr2.clamp();
      var equal = 0;
      for(var i = 0; i < arr1.words.length; i++) {
          equal |= arr1.words[i] ^ arr2.words[i];
      }
      return equal === 0;
  };

  /**
   * Retrieves the most significant bit of the WordArray as an Integer.
   *
   * @param {WordArray} arr
   *
   * @returns Integer
   */
  ext.msb = function(arr) {
      return arr.words[0] >>> 31;
  }


  /*
   * The MIT License (MIT)
   *
   * Copyright (c) 2015 artjomb
   */
  // Shortcuts
  var Base = C.lib.Base;
  var WordArray = C.lib.WordArray;
  var AES = C.algo.AES;
  var ext = C.ext;
  var OneZeroPadding = C.pad.OneZeroPadding;


  var CMAC = C.algo.CMAC = Base.extend({
      /**
       * Initializes a newly created CMAC
       *
       * @param {WordArray} key The secret key
       *
       * @example
       *
       *     var cmacer = CryptoJS.algo.CMAC.create(key);
       */
      init: function(key){
          // generate sub keys...
          this._aes = AES.createEncryptor(key, { iv: new WordArray.init(), padding: C.pad.NoPadding });

          // Step 1
          var L = this._aes.finalize(ext.const_Zero);

          // Step 2
          var K1 = L.clone();
          ext.dbl(K1);

          // Step 3
          if (!this._isTwo) {
              var K2 = K1.clone();
              ext.dbl(K2);
          } else {
              var K2 = L.clone();
              ext.inv(K2);
          }

          this._K1 = K1;
          this._K2 = K2;

          this._const_Bsize = 16;

          this.reset();
      },

      reset: function () {
          this._x = ext.const_Zero.clone();
          this._counter = 0;
          this._buffer = new WordArray.init();
      },

      update: function (messageUpdate) {
          if (!messageUpdate) {
              return this;
          }

          // Shortcuts
          var buffer = this._buffer;
          var bsize = this._const_Bsize;

          if (typeof messageUpdate === "string") {
              messageUpdate = C.enc.Utf8.parse(messageUpdate);
          }

          buffer.concat(messageUpdate);

          while(buffer.sigBytes > bsize){
              var M_i = ext.shiftBytes(buffer, bsize);
              ext.xor(this._x, M_i);
              this._x.clamp();
              this._aes.reset();
              this._x = this._aes.finalize(this._x);
              this._counter++;
          }

          // Chainable
          return this;
      },

      finalize: function (messageUpdate) {
          this.update(messageUpdate);

          // Shortcuts
          var buffer = this._buffer;
          var bsize = this._const_Bsize;

          var M_last = buffer.clone();
          if (buffer.sigBytes === bsize) {
              ext.xor(M_last, this._K1);
          } else {
              OneZeroPadding.pad(M_last, bsize/4);
              ext.xor(M_last, this._K2);
          }

          ext.xor(M_last, this._x);

          this.reset(); // Can be used immediately afterwards

          this._aes.reset();
          return this._aes.finalize(M_last);
      },

      _isTwo: false
  });

  /**
   * Directly invokes the CMAC and returns the calculated MAC.
   *
   * @param {WordArray} key The key to be used for CMAC
   * @param {WordArray|string} message The data to be MAC'ed (either WordArray or UTF-8 encoded string)
   *
   * @returns {WordArray} MAC
   */
  C.CMAC = function(key, message){
      return CMAC.create(key).finalize(message);
  };

  C.algo.OMAC1 = CMAC;
  C.algo.OMAC2 = CMAC.extend({
      _isTwo: true
  });


  /*
   * The MIT License (MIT)
   *
   * Copyright (c) 2015 artjomb
   */
  // Shortcuts
  var Base = C.lib.Base;
  var WordArray = C.lib.WordArray;
  var AES = C.algo.AES;
  var ext = C.ext;
  var OneZeroPadding = C.pad.OneZeroPadding;
  var CMAC = C.algo.CMAC;

  /**
   * updateAAD must be used before update, because the additional data is
   * expected to be authenticated before the plaintext stream starts.
   */
  var S2V = C.algo.S2V = Base.extend({
      init: function(key){
          this._blockSize = 16;
          this._cmacAD = CMAC.create(key);
          this._cmacPT = CMAC.create(key);
          this.reset();
      },
      reset: function(){
          this._buffer = new WordArray.init();
          this._cmacAD.reset();
          this._cmacPT.reset();
          this._d = this._cmacAD.finalize(ext.const_Zero);
          this._empty = true;
          this._ptStarted = false;
      },
      updateAAD: function(msgUpdate){
          if (this._ptStarted) {
              // It's not possible to authenticate any more additional data when the plaintext stream starts
              return this;
          }

          if (!msgUpdate) {
              return this;
          }

          if (typeof msgUpdate === "string") {
              msgUpdate = C.enc.Utf8.parse(msgUpdate);
          }

          this._d = ext.xor(ext.dbl(this._d), this._cmacAD.finalize(msgUpdate));
          this._empty = false;

          // Chainable
          return this;
      },
      update: function(msgUpdate){
          if (!msgUpdate) {
              return this;
          }

          this._ptStarted = true;
          var buffer = this._buffer;
          var bsize = this._blockSize;
          var wsize = bsize / 4;
          var cmac = this._cmacPT;
          if (typeof msgUpdate === "string") {
              msgUpdate = C.enc.Utf8.parse(msgUpdate);
          }

          buffer.concat(msgUpdate);

          while(buffer.sigBytes >= 2 * bsize){
              this._empty = false;
              var s_i = ext.popWords(buffer, wsize);
              cmac.update(s_i);
          }

          // Chainable
          return this;
      },
      finalize: function(msgUpdate){
          this.update(msgUpdate);

          var bsize = this._blockSize;
          var s_n = this._buffer;

          if (this._empty && s_n.sigBytes === 0) {
              return this._cmacAD.finalize(ext.const_One);
          }

          var t;
          if (s_n.sigBytes >= bsize) {
              t = ext.xorendBytes(s_n, this._d);
          } else {
              OneZeroPadding.pad(s_n, bsize);
              t = ext.xor(ext.dbl(this._d), s_n);
          }

          return this._cmacPT.finalize(t);
      }
  });

  var SIV = C.SIV = Base.extend({
      init: function(key){
          var len = key.sigBytes / 2;
          this._s2vKey = ext.shiftBytes(key, len);
          this._ctrKey = key;
      },
      encrypt: function(adArray, plaintext){
          if (!plaintext && adArray) {
              plaintext = adArray;
              adArray = [];
          }

          var s2v = S2V.create(this._s2vKey);
          Array.prototype.forEach.call(adArray, function(ad){
              s2v.updateAAD(ad);
          });
          var tag = s2v.finalize(plaintext);
          var filteredTag = ext.bitand(tag, ext.const_nonMSB);

          var ciphertext = C.AES.encrypt(plaintext, this._ctrKey, {
              iv: filteredTag,
              mode: C.mode.CTR,
              padding: C.pad.NoPadding
          });

          return tag.concat(ciphertext.ciphertext);
      },
      decrypt: function(adArray, ciphertext){
          if (!ciphertext && adArray) {
              ciphertext = adArray;
              adArray = [];
          }

          var tag = ext.shiftBytes(ciphertext, 16);
          var filteredTag = ext.bitand(tag, ext.const_nonMSB);

          var plaintext = C.AES.decrypt({ciphertext:ciphertext}, this._ctrKey, {
              iv: filteredTag,
              mode: C.mode.CTR,
              padding: C.pad.NoPadding
          });

          var s2v = S2V.create(this._s2vKey);
          Array.prototype.forEach.call(adArray, function(ad){
              s2v.updateAAD(ad);
          });
          var recoveredTag = s2v.finalize(plaintext);

          if (ext.equals(tag, recoveredTag)) {
              return plaintext;
          } else {
              return false;
          }
      }
  });


}));


function log(msg) {
  document.write((msg || '') + '\n');
}

document.write('<pre>');
var stats = { passed: 0, failed: 0 };

function assert(got, expected, msg){
    var passed = got === expected;
    if (msg) {
        msg = " (" + msg + ")";
    } else {
        msg = "";
    }
    if (passed) {
        log("PASS got=" + got + msg);
        stats.passed++;
    } else {
        log("FAIL got=" + got + " expected=" + expected + msg);
        stats.failed++;
    }
}


// Deterministic Authenticated Encryption Example
log("\nDeterministic Authenticated Encryption Example");
var sivKey1 = "fffefdfcfbfaf9f8f7f6f5f4f3f2f1f0";
var sivKey2 = "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff";
var ad = "101112131415161718191a1b1c1d1e1f2021222324252627";
var plaintext = "112233445566778899aabbccddee";

var keyBytes1 = CryptoJS.enc.Hex.parse(sivKey1);
var keyBytes2 = CryptoJS.enc.Hex.parse(sivKey2);
var adBytes = CryptoJS.enc.Hex.parse(ad);
var ptBytes = CryptoJS.enc.Hex.parse(plaintext);

var s2v = CryptoJS.algo.S2V.create(keyBytes1);
assert(s2v._d.toString(), "0e04dfafc1efbf040140582859bf073a", "zero");

s2v.updateAAD(adBytes);
assert(s2v._d.toString(), "edf09de876c642ee4d78bce4ceedfc4f", "xor");

s2v.update(ptBytes);
assert(s2v.finalize().toString(), "85632d07c6e8f37f950acd320a2ecc93", "s2v final");

var siv = CryptoJS.SIV.create(keyBytes1.clone().concat(keyBytes2));
var ct = siv.encrypt([ adBytes ], ptBytes);
assert(ct.toString(), "85632d07c6e8f37f950acd320a2ecc9340c02b9690c4dc04daef7f6afe5c", "ciphertext final");

var recoveredPT = siv.decrypt([ adBytes ], ct);
assert(recoveredPT.toString(), plaintext, "recovered plaintext");


// Nonce-Based Authenticated Encryption Example
log("\nNonce-Based Authenticated Encryption Example");
var sivKey = "7f7e7d7c7b7a79787776757473727170404142434445464748494a4b4c4d4e4f";
var ad1 = "00112233445566778899aabbccddeeffdeaddadadeaddadaffeeddccbbaa99887766554433221100";
var ad2 = "102030405060708090a0";
var nonce = "09f911029d74e35bd84156c5635688c0";
var plaintext = "7468697320697320736f6d6520706c61696e7465787420746f20656e6372797074207573696e67205349562d414553";

var keyBytes = CryptoJS.enc.Hex.parse(sivKey);
var adBytes1 = CryptoJS.enc.Hex.parse(ad1);
var adBytes2 = CryptoJS.enc.Hex.parse(ad2);
var nonceBytes = CryptoJS.enc.Hex.parse(nonce);
var ptBytes = CryptoJS.enc.Hex.parse(plaintext);

var s2v = CryptoJS.algo.S2V.create(CryptoJS.enc.Hex.parse(sivKey.slice(0,32)));
assert(s2v._d.toString(), "c8b43b5974960e7ce6a5dd85231e591a", "zero");

s2v.updateAAD(adBytes1);
assert(s2v._d.toString(), "adf31e285d3d1e1d4ddefc1e5bec63e9", "xor 1");

s2v.updateAAD(adBytes2);
assert(s2v._d.toString(), "826aa75b5e568eed3125bfb266c61d4e", "xor 2");

s2v.updateAAD(nonceBytes);
assert(s2v._d.toString(), "16592c17729a5a725567636168b48376", "xor nonce");

s2v.update(ptBytes);
assert(s2v.finalize().toString(), "7bdb6e3b432667eb06f4d14bff2fbd0f", "s2v final");

log();

var siv = CryptoJS.SIV.create(keyBytes);
var ct = siv.encrypt([ adBytes1, adBytes2, nonceBytes ], ptBytes);
assert(ct.toString(), "7bdb6e3b432667eb06f4d14bff2fbd0fcb900f2fddbe404326601965c889bf17dba77ceb094fa663b7a3f748ba8af829ea64ad544a272e9c485b62a3fd5c0d", "ciphertext final");

log("SIV test - passed: " + stats.passed + ", failed: " + stats.failed + ", total: " + (stats.passed+stats.failed) + "\n");

