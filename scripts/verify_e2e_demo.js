/**
 * End-to-End Verification Script
 * Validates the full 7-step evaluation scenario specified in project requirements:
 * 1. Register property P101 with Ravi as the owner.
 * 2. Verify the original PDF successfully.
 * 3. Modify the PDF and show a hash mismatch.
 * 4. Transfer ownership from Ravi to Arun.
 * 5. Verify the updated document.
 * 6. Display both ownership history entries.
 * 7. Attempt an unauthorized transfer and show that it is rejected.
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

async function main() {
  console.log("================================================================");
  console.log("   SECURE LAND RECORD VERIFICATION SYSTEM: E2E DEMO VERIFICATION");
  console.log("================================================================\n");

  const [registrar, unauthorizedUser] = await hre.ethers.getSigners();
  console.log(`[Account] Registrar (Authorized): ${registrar.address}`);
  console.log(`[Account] Unauthorized User:       ${unauthorizedUser.address}\n`);

  // Deploy fresh contract for test
  const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
  const contract = await LandRecordVerification.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`[Contract] Deployed at: ${contractAddress}\n`);

  const sampleDir = path.join(__dirname, "..", "sample_docs");
  const originalPdf = path.join(sampleDir, "deed_P101_ravi_original.pdf");
  const tamperedPdf = path.join(sampleDir, "deed_P101_tampered.pdf");
  const transferPdf = path.join(sampleDir, "deed_P101_arun_transfer.pdf");

  const originalHash = sha256File(originalPdf);
  const tamperedHash = sha256File(tamperedPdf);
  const transferHash = sha256File(transferPdf);

  console.log("--- DOCUMENT FINGERPRINTS (SHA-256) ---");
  console.log(`Original Deed Hash: ${originalHash}`);
  console.log(`Tampered Deed Hash: ${tamperedHash}`);
  console.log(`Transfer Deed Hash: ${transferHash}\n`);

  // STEP 1: Register property P101 with Ravi as owner
  console.log(">>> STEP 1: Register property P101 with Ravi as owner");
  const regTx = await contract.connect(registrar).registerProperty("P101", "Ravi", originalHash);
  const regReceipt = await regTx.wait();
  console.log(`✓ Registration confirmed in block #${regReceipt.blockNumber} (tx: ${regReceipt.hash})`);
  const prop1 = await contract.getProperty("P101");
  console.log(`  State on-chain: ID=${prop1.propertyId}, Owner=${prop1.currentOwner}, Hash=${prop1.documentHash}\n`);

  // STEP 2: Verify original PDF successfully
  console.log(">>> STEP 2: Verify the original PDF document");
  const [match1, stored1] = await contract.verifyDocument("P101", originalHash);
  if (match1 && stored1 === originalHash) {
    console.log(`✓ SUCCESS: VERIFIED! Hashes match on-chain record.`);
    console.log(`  Calculated: ${originalHash}`);
    console.log(`  Stored:     ${stored1}\n`);
  } else {
    throw new Error("Step 2 verification failed");
  }

  // STEP 3: Modify PDF and show hash mismatch
  console.log(">>> STEP 3: Verify modified/tampered PDF and detect hash mismatch");
  const [match2, stored2] = await contract.verifyDocument("P101", tamperedHash);
  if (!match2) {
    console.log(`✓ SUCCESS: HASH MISMATCH detected! Document tampering was caught.`);
    console.log(`  Calculated (tampered): ${tamperedHash}`);
    console.log(`  Stored on blockchain:  ${stored2}\n`);
  } else {
    throw new Error("Step 3 tampering detection failed");
  }

  // STEP 4: Transfer ownership from Ravi to Arun
  console.log(">>> STEP 4: Transfer ownership from Ravi to Arun with new document");
  const transferTx = await contract.connect(registrar).transferOwnership("P101", "Ravi", "Arun", transferHash);
  const transferReceipt = await transferTx.wait();
  console.log(`✓ Transfer confirmed in block #${transferReceipt.blockNumber} (tx: ${transferReceipt.hash})`);
  const prop2 = await contract.getProperty("P101");
  console.log(`  Updated on-chain: Owner=${prop2.currentOwner}, Hash=${prop2.documentHash}\n`);

  // STEP 5: Verify the updated document
  console.log(">>> STEP 5: Verify the updated document for Arun");
  const [match3, stored3] = await contract.verifyDocument("P101", transferHash);
  if (match3 && stored3 === transferHash) {
    console.log(`✓ SUCCESS: VERIFIED! New deed matches updated on-chain record.`);
    console.log(`  Calculated: ${transferHash}`);
    console.log(`  Stored:     ${stored3}\n`);
  } else {
    throw new Error("Step 5 verification failed");
  }

  // STEP 6: Display both ownership history entries
  console.log(">>> STEP 6: Display ownership transfer history from blockchain");
  const history = await contract.getTransferHistory("P101");
  console.log(`✓ History records retrieved: ${history.length} transfer(s) found`);
  history.forEach((rec, idx) => {
    console.log(`  [Record #${idx + 1}]`);
    console.log(`    Previous Owner: ${rec.previousOwner}`);
    console.log(`    New Owner:      ${rec.newOwner}`);
    console.log(`    Document Hash:  ${rec.newDocumentHash}`);
    console.log(`    Timestamp:      ${new Date(Number(rec.timestamp) * 1000).toLocaleString()}`);
    console.log(`    Initiated By:   ${rec.initiatedBy}`);
  });
  console.log();

  // STEP 7: Attempt an unauthorized transfer and show that it is rejected
  console.log(">>> STEP 7: Attempt unauthorized transfer and verify rejection");
  try {
    await contract.connect(unauthorizedUser).transferOwnership("P101", "Arun", "Attacker", originalHash);
    throw new Error("Unauthorized transfer unexpectedly succeeded!");
  } catch (err) {
    if (err.message.includes("Only the authorized registrar can perform this action")) {
      console.log(`✓ SUCCESS: Unauthorized transfer rejected by smart contract!`);
      console.log(`  Revert message: "${err.message.split('reverted with reason string ')[1] || err.message}"\n`);
    } else {
      throw err;
    }
  }

  console.log("================================================================");
  console.log("   🎉 ALL 7 DEMONSTRATION SCENARIOS VERIFIED SUCCESSFULLY!");
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
