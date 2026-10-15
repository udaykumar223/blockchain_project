
const hre = require("hardhat");

async function main() {
    const LandRecordVerification =
        await hre.ethers.getContractFactory(
            "LandRecordVerification"
        );

    const contract =
        await LandRecordVerification.deploy();

    await contract.waitForDeployment();

    console.log(
        "Contract deployed to:",
        await contract.getAddress()
    );

    console.log(
        "Registrar address:",
        await contract.registrar()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
