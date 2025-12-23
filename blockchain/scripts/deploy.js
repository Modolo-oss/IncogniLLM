const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying IncogniAttestor...");

    const IncogniAttestor = await ethers.getContractFactory("IncogniAttestor");
    const attestor = await IncogniAttestor.deploy();

    await attestor.waitForDeployment();

    const address = await attestor.getAddress();
    console.log(`IncogniAttestor deployed to: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
