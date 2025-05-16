const {
  privateDecrypt,
  publicEncrypt,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} = require('crypto');
const { readFileSync } = require('fs');
const { errorWithCode } = require('../utils/errorHandler');
const { checkRequiredParameters } = require('../utils/commonUtils');

const decrypt = (code) => {
  try {
    const privateKey = readFileSync('keys/ets/ets_key.pem', 'utf8');
    const decrypted = privateDecrypt(privateKey, Buffer.from(code, 'base64'));
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(error);
  }
};

const encrypt = (data) => {
  try {
    const publicKey = readFileSync('keys/ets/ets_key.pub', 'utf8');
    const encrypted = publicEncrypt(
      publicKey,
      Buffer.from(JSON.stringify(data), 'utf8')
    );
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(error);
  }
};

const hybridEncrypt = (data) => {
  try {
    // Generate AES Encryption key which must be of size 32 bits
    const aesEncryptionKey = randomBytes(32);
    // Encrypt the AES key with public key
    const rsaEncryptedKey = encrypt(aesEncryptionKey.toString('base64'));
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(aesEncryptionKey),
      iv
    );
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return [
      rsaEncryptedKey,
      encrypted.toString('base64'),
      iv.toString('base64'),
      cipher.getAuthTag().toString('hex'),
    ].join('|');
  } catch (error) {
    throw new Error(error);
  }
};

const hybridDecrypt = (token) => {
  try {
    const [key, encryptedToken, ivString, authTag] = token.split('|');
    const checkFields = { key, encryptedToken, ivString, authTag };
    const { isValid, fields } = checkRequiredParameters(
      checkFields,
      Object.keys(checkFields)
    );
    if (!isValid)
      throw errorWithCode(
        `Required parameters (${fields.join(',')}) are not provided in token.`,
        400
      );
    const decryptedAesKey = Buffer.from(decrypt(key), 'base64');
    const iv = Buffer.from(ivString, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', decryptedAesKey, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedToken, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    throw errorWithCode('Invalid token!', 401);
  }
};

module.exports = {
  decrypt,
  encrypt,
  hybridEncrypt,
  hybridDecrypt,
};
