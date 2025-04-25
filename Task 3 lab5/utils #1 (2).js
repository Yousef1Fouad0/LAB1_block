"use strict";

const crypto = require('crypto');

const HASH_ALGORITHM = 'sha256';
const BYTE_MAX = 256;

function generateOTP({ text, inputBuffer }) {
  if ((!text && !inputBuffer) || (text && inputBuffer)) {
    throw new Error("Please specify either text or inputBuffer, not both.");
  }

  if (text) {
    inputBuffer = Buffer.from(text);
  }

  const keyBuffer = crypto.randomBytes(inputBuffer.length);
  const encrypted = Buffer.alloc(inputBuffer.length);

  for (let idx = 0; idx < inputBuffer.length; idx++) {
    encrypted[idx] = inputBuffer[idx] ^ keyBuffer[idx];
  }

  return { key: keyBuffer, ciphertext: encrypted };
}

function decodeOTP({ key, ciphertext, output = 'buffer' }) {
  if (key.length !== ciphertext.length) {
    throw new Error("The length of the key must equal the length of ciphertext.");
  }

  const result = Buffer.alloc(key.length);

  for (let i = 0; i < key.length; i++) {
    result[i] = key[i] ^ ciphertext[i];
  }

  if (output === 'string') {
    return result.toString();
  } else if (output === 'buffer') {
    return result;
  } else {
    throw new Error(`Output type "${output}" is unknown.`);
  }
}

function createUniqueID() {
  return crypto.randomBytes(48).toString('hex');
}

function hashValue(value) {
  return crypto.createHash(HASH_ALGORITHM).update(value.toString()).digest('hex');
}

function getByte() {
  return crypto.randomBytes(1).readUInt8();
}

function getRandomInt(limit) {
  if (limit > BYTE_MAX) {
    throw new Error(`The maximum allowed range is ${BYTE_MAX}.`);
  }

  const multiplier = Math.floor(BYTE_MAX / limit);
  const upperBound = multiplier * limit;
  let val;

  do {
    val = getByte();
  } while (val >= upperBound);

  return val % limit;
}

module.exports = {
  generateOTP,
  decodeOTP,
  createUniqueID,
  hashValue,
  getRandomInt
};
