import { ethers } from "ethers";

/**
 * Truncate Ethereum address for UI display: 0x1234...5678
 */
export function formatAddress(address) {
  if (!address || !ethers.isAddress(address)) return address || "0x0";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Truncate bytes32 hash for UI display: 0xabcd...ef01
 */
export function formatHash(hash) {
  if (!hash || typeof hash !== "string") return hash || "";
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Convert on-chain epoch timestamp (seconds) to human readable string
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  const num = typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp);
  if (isNaN(num) || num === 0) return "Genesis / Initial";
  const date = new Date(num * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Decodes bytes32 action string into readable ASCII text ("REGISTERED", "TRANSFERRED")
 */
export function decodeAction(actionBytes32) {
  if (!actionBytes32) return "UNKNOWN";
  try {
    const decoded = ethers.decodeBytes32String(actionBytes32);
    return decoded || "ACTION";
  } catch {
    // If not standard ASCII bytes32, clean hex
    return String(actionBytes32);
  }
}

/**
 * Copy text to clipboard with browser fallback
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn("Clipboard copy failed, fallback:", err);
    return false;
  }
}
