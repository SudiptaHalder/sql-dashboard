import "dotenv/config";
import crypto from "crypto";

const KEY = process.env.ENCRYPTION_KEY;

if (!KEY || KEY.length !== 32) {
  console.error("❌ ENCRYPTION_KEY must be 32 chars.");
  throw new Error("ENCRYPTION_KEY must be exactly 32 characters!");
}

export function encryptJSON(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(KEY), iv);

  const jsonStr = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(jsonStr, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decryptJSON(enc) {
  const iv = Buffer.from(enc.iv, "hex");
  const encrypted = Buffer.from(enc.content, "hex");
  const tag = Buffer.from(enc.tag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(KEY), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
