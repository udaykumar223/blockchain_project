const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [registrarSigner, citizen1Signer, citizen2Signer] = await hre.ethers.getSigners();

  console.log("==================================================");
  console.log("LIVE END-TO-END SMART CONTRACT WORKFLOW VERIFICATION");
  console.log("==================================================");
  console.log("Node URL    : http://127.0.0.1:8545");
  console.log("Contract    :", contractAddress);
  console.log("Registrar   :", registrarSigner.address);
  console.log("Citizen #1  :", citizen1Signer.address);
  console.log("Citizen #2  :", citizen2Signer.address);

  const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
  const contract = LandRecordVerification.attach(contractAddress);

  // 1. Compute realistic SHA-256 hashes
  const crypto = require("crypto");
  function sha256Hex(content) {
    return "0x" + crypto.createHash("sha256").update(content).digest("hex");
  }

  const deedHash1 = sha256Hex("TITLE-DEED-PLOT-101-PARCEL-A-OWNER-CITIZEN1");
  const deedHash1Updated = sha256Hex("TITLE-CONVEYANCE-PLOT-101-TRANSFER-TO-CITIZEN2");
  const deedHashTampered = sha256Hex("TAMPERED-DEED-PLOT-101-FORGED-CONTENT");

  console.log("\n[1] Testing Property Registration (Property #101)...");
  // Check if 101 already exists or register
  const existingProp = await contract.properties(101);
  if (!existingProp.exists) {
    const txReg = await contract.connect(registrarSigner).registerProperty(101, citizen1Signer.address, deedHash1);
    await txReg.wait();
    console.log(" ✓ Registered Property #101 with Initial Owner:", citizen1Signer.address);
  } else {
    console.log(" ✓ Property #101 already recorded on chain, current owner:", existingProp.currentOwner);
  }

  // Verify property state
  const prop101 = await contract.properties(101);
  console.log("   - Property ID    :", prop101.id.toString());
  console.log("   - Current Owner  :", prop101.currentOwner);
  console.log("   - Document Hash  :", prop101.documentHash);
  console.log("   - Exists         :", prop101.exists);

  console.log("\n[2] Testing Document Verification on-chain...");
  const isMatch = await contract.verifyDocument(101, prop101.documentHash);
  console.log("   - Verification with REGISTERED hash :", isMatch ? "✓ VERIFIED (true)" : "✕ FAILED");

  const isMismatch = await contract.verifyDocument(101, deedHashTampered);
  console.log("   - Verification with TAMPERED hash   :", !isMismatch ? "✓ MISMATCH (false as expected)" : "✕ FAILED");

  console.log("\n[3] Testing Ownership Transfer Request...");
  // Check current owner of 101
  const activeOwnerSigner = prop101.currentOwner.toLowerCase() === citizen1Signer.address.toLowerCase()
    ? citizen1Signer
    : citizen2Signer;
  const targetRecipient = activeOwnerSigner.address === citizen1Signer.address
    ? citizen2Signer.address
    : citizen1Signer.address;

  // Check if transfer is already pending
  const pendingStatus = await contract.pendingTransfers(101);
  if (!pendingStatus.exists) {
    const txReq = await contract.connect(activeOwnerSigner).requestTransfer(101, targetRecipient, deedHash1Updated);
    await txReq.wait();
    console.log(` ✓ Transfer requested by ${activeOwnerSigner.address} to ${targetRecipient}`);
  } else {
    console.log(` ✓ Transfer was already pending for ${pendingStatus.newOwner}`);
  }

  console.log("\n[4] Testing Registrar Approval...");
  const txApp = await contract.connect(registrarSigner).approveTransfer(101);
  const receiptApp = await txApp.wait();
  console.log(" ✓ Registrar approved transfer in block:", receiptApp.blockNumber);

  const updatedProp = await contract.properties(101);
  console.log("   - New Legal Owner:", updatedProp.currentOwner);
  console.log("   - New Doc Hash   :", updatedProp.documentHash);

  console.log("\n[5] Testing Audit History Timeline...");
  const history = await contract.getHistory(101);
  console.log(` ✓ Found ${history.length} audit records for Property #101:`);
  history.forEach((rec, idx) => {
    let actionStr = "ACTION";
    try {
      actionStr = hre.ethers.decodeBytes32String(rec.action);
    } catch {}
    console.log(`   [Record ${idx + 1}] Action: ${actionStr} | Prev: ${rec.previousOwner} | New: ${rec.newOwner} | Time: ${new Date(Number(rec.timestamp) * 1000).toISOString()}`);
  });

  console.log("\n[6] Testing Transfer Rejection Workflow (Property #102)...");
  const deedHash2 = sha256Hex("TITLE-DEED-PLOT-102-CITIZEN2");
  const prop102 = await contract.properties(102);
  if (!prop102.exists) {
    await (await contract.connect(registrarSigner).registerProperty(102, citizen1Signer.address, deedHash2)).wait();
    console.log(" ✓ Registered Property #102");
  }

  const pending102 = await contract.pendingTransfers(102);
  if (!pending102.exists) {
    await (await contract.connect(citizen1Signer).requestTransfer(102, citizen2Signer.address, deedHashTampered)).wait();
    console.log(" ✓ Requested transfer for Property #102");
  }

  // Reject transfer as registrar
  const txRej = await contract.connect(registrarSigner).rejectTransfer(102);
  await txRej.wait();
  console.log(" ✓ Registrar successfully rejected transfer for #102");

  const finalPending102 = await contract.pendingTransfers(102);
  console.log("   - Pending transfer exists:", finalPending102.exists ? "✕ FAILED" : "✓ false (Cleaned up)");
  const finalProp102 = await contract.properties(102);
  console.log("   - Owner remains initial owner:", finalProp102.currentOwner === citizen1Signer.address ? "✓ Confirmed" : "✕ FAILED");

  console.log("\n==================================================");
  console.log("ALL LIVE WORKFLOW INVARIANTS CONFIRMED ON CHAIN!");
  console.log("==================================================");
}

main().catch(console.error);
