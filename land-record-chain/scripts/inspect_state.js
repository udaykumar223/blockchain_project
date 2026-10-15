const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LandRecordVerification = await hre.ethers.getContractFactory("LandRecordVerification");
  const contract = LandRecordVerification.attach(contractAddress);

  const registrar = await contract.registrar();
  console.log("Registrar:", registrar);

  // Check event filter from block 0
  const regFilter = contract.filters.PropertyRegistered();
  const regEvents = await contract.queryFilter(regFilter, 0, "latest");
  console.log("Registered properties count from events:", regEvents.length);
  for (const ev of regEvents) {
    console.log(`Property #${ev.args[0]}: Owner=${ev.args[1]}, DocHash=${ev.args[2]}`);
  }

  const transferReqFilter = contract.filters.TransferRequested();
  const reqEvents = await contract.queryFilter(transferReqFilter, 0, "latest");
  console.log("Transfer requested events:", reqEvents.length);

  const transferAppFilter = contract.filters.TransferApproved();
  const appEvents = await contract.queryFilter(transferAppFilter, 0, "latest");
  console.log("Transfer approved events:", appEvents.length);
}

main().catch(console.error);
