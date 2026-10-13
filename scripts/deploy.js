const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying LandRecordVerification contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer (Registrar):", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Deploy
  const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
  const contract = await LandRecordVerification.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("LandRecordVerification deployed to:", contractAddress);
  console.log("Registrar set to:", await contract.registrar());

  // ──────────────────────────────────────────────
  //  Write deployment info so the backend can pick it up
  // ──────────────────────────────────────────────
  const deploymentInfo = {
    contractAddress,
    registrar: deployer.address,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
  };

  const deployDir = path.join(__dirname, "..", "deployment");
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });

  // Save deployment info
  fs.writeFileSync(
    path.join(deployDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Copy ABI
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "LandRecordVerification.sol",
    "LandRecordVerification.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  fs.writeFileSync(
    path.join(deployDir, "LandRecordVerification.json"),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );

  console.log("\nDeployment info saved to deployment/deployment.json");
  console.log("Contract ABI saved to deployment/LandRecordVerification.json");
  console.log("\n✅ Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
