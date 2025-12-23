const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config({ path: '../.env' });

async function main() {
    const contractPath = path.resolve(__dirname, '../contracts/IncogniAttestor.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'IncogniAttestor.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    };

    console.log('Compiling contract...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach((err) => {
            console.error(err.formattedMessage);
        });
        if (output.errors.some(err => err.severity === 'error')) {
            process.exit(1);
        }
    }

    const contractFile = output.contracts['IncogniAttestor.sol']['IncogniAttestor'];
    const abi = contractFile.abi;
    const bytecode = contractFile.evm.bytecode.object;

    console.log('Connecting to network...');
    const provider = new ethers.JsonRpcProvider(process.env.CAPX_MAINNET_RPC || 'https://rpc.capx.fi');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log('Deploying from:', wallet.address);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();

    console.log('Waiting for deployment...');
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log('IncogniAttestor deployed to:', address);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
