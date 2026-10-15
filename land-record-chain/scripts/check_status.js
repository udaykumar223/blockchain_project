const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Signer address:", deployer.address);
  const network = await hre.ethers.provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const code = await hre.ethers.provider.getCode(contractAddress);
  console.log("Code exists:", code !== "0x", "length:", code.length);

  if (code !== "0x") {
    const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
    const contract = LandRecordVerification.attach(contractAddress);
    const registrar = await contract.registrar();
    console.log("Current Registrar:", registrar);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
