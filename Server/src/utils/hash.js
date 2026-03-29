const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPin = async (pin) => bcrypt.hash(pin, SALT_ROUNDS);
const comparePin = async (pin, hash) => bcrypt.compare(pin, hash);

module.exports = { hashPin, comparePin };