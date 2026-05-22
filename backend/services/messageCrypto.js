const crypto = require("crypto");

const ENCRYPTION_PREFIX = "enc:v1";
const ALGORITHM = "aes-256-gcm";

function getMessageEncryptionKey() {
  const rawKey = process.env.MESSAGE_ENCRYPTION_KEY;
  if (!rawKey) return null;

  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error("MESSAGE_ENCRYPTION_KEY 32 byte base64 olmali.");
  }

  return key;
}

function isEncryptedMessage(value) {
  return typeof value === "string" && value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

function encryptMessage(plainText) {
  if (plainText == null || isEncryptedMessage(plainText)) return plainText;

  const key = getMessageEncryptionKey();
  if (!key) return String(plainText);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

function decryptMessage(encryptedText) {
  if (!isEncryptedMessage(encryptedText)) return encryptedText;

  const key = getMessageEncryptionKey();
  if (!key) return encryptedText;

  const [, , ivBase64, authTagBase64, encryptedBase64] =
    encryptedText.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function decryptMessageRecord(message) {
  const plain = message.toJSON ? message.toJSON() : { ...message };
  plain.text = decryptMessage(plain.text);
  return plain;
}

module.exports = {
  decryptMessage,
  decryptMessageRecord,
  encryptMessage,
  isEncryptedMessage,
};
