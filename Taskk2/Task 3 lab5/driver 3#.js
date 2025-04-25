"use strict";

const blindSignatures = require("blind-signatures");
const chalk = require("chalk");

const { Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR } = require("./coin.js");
const utils = require("./utils.js");

const bankKey = blindSignatures.keyGeneration({ b: 2048 });
const MODULUS = bankKey.keyPair.n.toString();
const EXPONENT = bankKey.keyPair.e.toString();

function signBlindedCoin(blindedHash) {
  return blindSignatures.sign({ blinded: blindedHash, key: bankKey });
}

function extractCoinData(coinStr) {
  const [prefix, amount, guid, left, right] = coinStr.split("-");
  if (prefix !== BANK_STR)
    throw new Error(chalk.red(`Expected ${BANK_STR}, got ${prefix}`));

  return [left.split(","), right.split(",")];
}

function processCoin(coin) {
  const valid = blindSignatures.verify({
    unblinded: coin.signature,
    N: MODULUS,
    E: EXPONENT,
    message: coin.toString()
  });

  if (!valid) throw new Error(chalk.red("❌ Invalid coin signature"));

  const pickLeft = Math.random() < 0.5;
  return Array.from({ length: COIN_RIS_LENGTH }, (_, idx) =>
    coin.getRis(pickLeft, idx)
  );
}

function detectDoubleSpend(guid, risA, risB) {
  console.log(chalk.yellow.bold("\n=== Double-Spending Check ==="));
  console.log(chalk.cyan(`Coin GUID: ${guid}`));
  console.log(chalk.gray("----------------------------------------"));

  if (JSON.stringify(risA) === JSON.stringify(risB)) {
    console.log(chalk.red("🚫 Merchant Cheating Detected (RIS Match)"));
    return;
  }

  for (let i = 0; i < COIN_RIS_LENGTH; i++) {
    const decoded = utils.decryptOTP({
      key: risA[i],
      ciphertext: risB[i],
      returnType: "string"
    });

    if (decoded.startsWith(IDENT_STR)) {
      const [, identity] = decoded.split(":");
      console.log(chalk.red("🚨 Double Spending Identified"));
      console.log(chalk.bgRed.white(`User: ${identity}`));
      return;
    }
  }

  console.log(chalk.yellow("⚠️ Could not identify double spender"));
}

console.log(chalk.green.bold("\n=== Digital Cash Simulation ==="));
console.log("Issuing new coin...");

const userCoin = new Coin("Yousef Fouad", 20, MODULUS, EXPONENT);

console.log(chalk.blue(`✔ Owner: Yousef Fouad`));
console.log(chalk.blue(`💵 Value: 20`));
console.log(chalk.blue(`🆔 Coin GUID: ${userCoin.guid}`));
console.log(chalk.gray("----------------------------------------"));

console.log(chalk.green.bold("\n=== Bank Section ==="));
userCoin.signature = signBlindedCoin(userCoin.blinded);
userCoin.unblind();
console.log(chalk.green("✓ Signature applied and unblinded"));
console.log(chalk.gray("----------------------------------------"));

console.log(chalk.magenta.bold("\n=== Merchant Use ==="));
console.log("First merchant accepting coin...");
const firstRIS = processCoin(userCoin);
console.log(chalk.green("✓ Transaction 1 done"));

console.log("\nSecond merchant accepting same coin...");
const secondRIS = processCoin(userCoin);
console.log(chalk.green("✓ Transaction 2 done"));
console.log(chalk.gray("----------------------------------------"));

detectDoubleSpend(userCoin.guid, firstRIS, secondRIS);
console.log(chalk.cyan.bold("\n=== Simulating Merchant Fraud ==="));
detectDoubleSpend(userCoin.guid, firstRIS, firstRIS);

console.log(chalk.green.bold("\n=== End of Simulation ==="));