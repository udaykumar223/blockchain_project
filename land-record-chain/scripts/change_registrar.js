const hre = require("hardhat");

/**
 * Safe local-development script to transfer the Registrar role to a user's MetaMask address.
 *
 * Usage:
 *   npx hardhat run scripts/change_registrar.js --network localhost <NEW_REGISTRAR_ADDRESS>
 * Or set environment variable:
 *   NEW_REGISTRAR=0xYourAddress npx hardhat run scripts/change_registrar.js --network localhost
 */
async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [currentRegistrarSigner] = await hre.ethers.getSigners();

  // Find candidate address from CLI arguments or environment variable
  const rawArg = process.env.NEW_REGISTRAR || process.argv[2];
  
  if (!rawArg) {
    console.error("\n[ERROR] Missing target registrar address!");
    console.log("Usage: npx hardhat run scripts/change_registrar.js --network localhost <0xNewRegistrarAddress>");
    console.log("Or:    $env:NEW_REGISTRAR=\"<0xNewRegistrarAddress>\"; npx hardhat run scripts/change_registrar.js --network localhost");
    process.exit(1);
  }

  // Handle potential flag or index variation
  let newRegistrar = rawArg;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("0x") && arg.length === 42) {
      newRegistrar = arg;
      break;
    }
  }

  if (!hre.ethers.isAddress(newRegistrar)) {
    console.error(`\n[ERROR] Invalid Ethereum address: ${newRegistrar}`);
    process.exit(1);
  }

  console.log("==================================================");
  console.log("LandRecordVerification - Registrar Transfer Script");
  console.log("==================================================");
  console.log("Contract Address        :", contractAddress);
  console.log("Signer (Account #0)     :", currentRegistrarSigner.address);
  console.log("Requested New Registrar :", newRegistrar);

  const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
  const contract = LandRecordVerification.attach(contractAddress);

  const existingRegistrar = await contract.registrar();
  console.log("Current On-Chain Registrar:", existingRegistrar);

  if (existingRegistrar.toLowerCase() === newRegistrar.toLowerCase()) {
    console.log("[INFO] The address is already the active registrar. No change needed.");
    return;
  }

  if (existingRegistrar.toLowerCase() !== currentRegistrarSigner.address.toLowerCase()) {
    console.error("[ERROR] Current signer is not the authorized registrar on-chain!");
    console.error(`Authorized: ${existingRegistrar}, Signer: ${currentRegistrarSigner.address}`);
    process.exit(1);
  }

  console.log("\nSubmitting changeRegistrar transaction from authorized registrar...");
  const tx = await contract.connect(currentRegistrarSigner).changeRegistrar(newRegistrar);
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for block confirmation...");
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt.blockNumber);

  const updatedRegistrar = await contract.registrar();
  console.log("--------------------------------------------------");
  console.log("SUCCESS: On-chain Registrar is now:", updatedRegistrar);
  console.log("--------------------------------------------------");
}

main().catch((err) => {
  console.error("Execution failed:", err.message);
  process.exitCode = 1;
});
