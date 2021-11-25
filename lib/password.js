const crypto = require('crypto');

const salt = module.exports.salt = (length = 32) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

const sha512 = module.exports.sha512 = (input, salt) => {
  return crypto
    .createHmac('sha512', salt)
    .update(input)
    .digest('hex');
}

module.exports.generate_password = (input) => {
  const s = salt();
  console.log(s)
  const hash = sha512(input, s);
  return hash + s;
}

module.exports.verify_password = (input, ref) => {
  const s = ref.slice(ref.length - 32, ref.length)
  const h1 = ref.slice(0, ref.length - 32)
  const h2 = sha512(input, s)
  return h1 === h2;
}