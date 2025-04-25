"use strict";

const blindSignatures = require('blind-signatures');
const utils = require('./utils.js');

const RIS_COUNT = 20;
const ID_PREFIX = "IDENT";
const BANK_LABEL = "ELECTRONIC_PIGGYBANK";

class Coin {
  constructor(buyer, value, modulus, exponent) {
    this.value = value;
    this.n = modulus;
    this.e = exponent;

    this.id = utils.makeGUID();
    this.leftSide = [];
    this.rightSide = [];

    const leftHashes = [];
    const rightHashes = [];

    for (let index = 0; index < RIS_COUNT; index++) {
      const { key, ciphertext } = utils.makeOTP({ string: `${ID_PREFIX}:${buyer}` });

      this.leftSide.push(key);
      leftHashes.push(utils.hash(key));

      this.rightSide.push(ciphertext);
      rightHashes.push(utils.hash(ciphertext));
    }

    this.data = `${BANK_LABEL}-${this.value}-${this.id}-${leftHashes.join(',')}-${rightHashes.join(',')}`;

    this._blindData();
  }

  _blindData() {
    const { blinded, r } = blindSignatures.blind({
      message: this.toString(),
      N: this.n,
      E: this.e
    });

    this.blinded = blinded;
    this.blindFactor = r;
  }

  unblindSignature() {
    this.signature = blindSignatures.unblind({
      signed: this.signature,
      N: this.n,
      r: this.blindFactor
    });
  }

  toString() {
    return this.data;
  }

  revealRis(useLeft, position) {
    return useLeft ? this.leftSide[position] : this.rightSide[position];
  }
}

exports.Coin = Coin;
exports.COIN_RIS_LENGTH = RIS_COUNT;
exports.IDENT_STR = ID_PREFIX;
exports.BANK_STR = BANK_LABEL;