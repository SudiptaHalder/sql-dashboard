import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

let KEY = process.env.ENCRYPTION_KEY;

// 🔥 VERY IMPORTANT: Avoid crashing if KEY is missing
if (!KEY || KEY.length !== 32) {
  console.warn(
    "⚠️ WARNING: ENCRYPTION_KEY missing or invalid. Using temporary fallback key."
  );
  KEY = "00000000000000000000000000000000"; // 32 chars fallback
}

const ALGO = "aes-256-gcm";

// Encrypt JSON
export function encryptJSON(obj) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(JSON.stringify(obj), "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return { iv: iv.toString("hex"), content: encrypted, tag };
}

// Decrypt JSON
export function decryptJSON(enc) {
  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(enc.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(enc.tag, "hex"));

  let decrypted = decipher.update(enc.content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
