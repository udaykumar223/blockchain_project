/**
 * Cryptographic SHA-256 utilities using the browser's native Web Crypto API.
 * Ensures the output matches Solidity bytes32 format (0x + 64 hexadecimal characters).
 */

/**
 * Computes SHA-256 hash of an uploaded File or Blob.
 * @param {File|Blob} file 
 * @returns {Promise<string>} bytes32 hexadecimal string (e.g. 0xabcd...)
 */
export async function computeFileSHA256(file) {
  if (!file) {
    throw new Error("No file provided for hashing.");
  }

  if (file.size === 0) {
    throw new Error("File is empty (0 bytes). Please select a valid document.");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
    return bufferToHex(hashBuffer);
  } catch (err) {
    console.error("Hashing failed:", err);
    throw new Error(`Failed to calculate document SHA-256 hash: ${err.message}`);
  }
}

/**
 * Computes SHA-256 hash of raw string text (for quick deed text entry / testing).
 * @param {string} text 
 * @returns {Promise<string>} bytes32 hexadecimal string
 */
export async function computeTextSHA256(text) {
  if (!text || text.trim().length === 0) {
    throw new Error("Input text is empty.");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

/**
 * Converts ArrayBuffer to 0x-prefixed 64-character lowercase hex string.
 * @param {ArrayBuffer} buffer 
 * @returns {string}
 */
export function bufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((byte) =>
    byte.toString(16).padStart(2, "0")
  );
  return "0x" + hexCodes.join("").toLowerCase();
}

/**
 * Validates if a string is a standard 32-byte hexadecimal hash (Solidity bytes32).
 * @param {string} hash 
 * @returns {boolean}
 */
export function isValidBytes32(hash) {
  if (typeof hash !== "string") return false;
  return /^0x[0-9a-fA-F]{64}$/.test(hash.trim());
}
