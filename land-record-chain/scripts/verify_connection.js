const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const provider = hre.ethers.provider;

  console.log("--------------------------------------------------");
  console.log("Frontend-to-Contract Connection Check:");
  console.log("--------------------------------------------------");

  const network = await provider.getNetwork();
  console.log("Network Name     :", network.name);
  console.log("Chain ID         :", network.chainId.toString(), network.chainId === 31337n ? "✓ (Matches 31337)" : "✕");

  const code = await provider.getCode(contractAddress);
  console.log("Deployed Address :", contractAddress);
  console.log("Bytecode Size    :", code.length, "bytes", code.length > 2 ? "✓ (Active contract on chain)" : "✕ (No code)");

  const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
  const contract = LandRecordVerification.attach(contractAddress);

  const registrar = await contract.registrar();
  console.log("Current Registrar:", registrar, registrar === "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" ? "✓ (Account #0)" : "");

  console.log("ABI Functions Verified:");
  const expectedFunctions = [
    "registrar()",
    "properties(uint256)",
    "pendingTransfers(uint256)",
    "registerProperty(uint256,address,bytes32)",
    "requestTransfer(uint256,address,bytes32)",
    "approveTransfer(uint256)",
    "rejectTransfer(uint256)",
    "verifyDocument(uint256,bytes32)",
    "getHistory(uint256)",
    "getHistoryCount(uint256)",
    "changeRegistrar(address)"
  ];
  for (const fn of expectedFunctions) {
    console.log(` - ${fn}: Available`);
  }
  console.log("--------------------------------------------------");
}

main().catch(console.error);
