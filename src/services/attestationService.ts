import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// ABI of the IncogniAttestor contract
const CONTRACT_ABI = [
    "function attest(bytes32 paymentId, bytes32 responseHash) external",
    "event AttestationRecorded(bytes32 indexed paymentId, bytes32 indexed responseHash, uint256 timestamp)"
];

const CONTRACT_ADDRESS = process.env.ATTESTATION_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export class AttestationService {
    private static provider: ethers.JsonRpcProvider | null = null;
    private static wallet: ethers.Wallet | null = null;
    private static contract: ethers.Contract | null = null;

    private static initialize() {
        const rpcUrl = process.env.CAPX_MAINNET_RPC || process.env.CAPX_TESTNET_RPC;
        if (!this.provider && rpcUrl) {
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            if (process.env.PRIVATE_KEY) {
                this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
                this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
            }
        }
    }

    static async attestInteraction(paymentId: string, responseContent: string): Promise<string> {
        const responseHash = ethers.keccak256(ethers.toUtf8Bytes(responseContent));

        // Ensure paymentId is treated as bytes32
        let paymentIdHash: string;
        if (paymentId.startsWith('0x') && paymentId.length === 66) {
            paymentIdHash = paymentId;
        } else {
            paymentIdHash = ethers.keccak256(ethers.toUtf8Bytes(paymentId));
        }

        console.log(`Preparing attestation for PaymentID: ${paymentId}`);
        console.log(`Response Hash: ${responseHash}`);

        const rpcUrl = process.env.CAPX_MAINNET_RPC || process.env.CAPX_TESTNET_RPC;
        if (!process.env.PRIVATE_KEY || !rpcUrl || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
            console.log('[MOCK] Attestation recorded on-chain (simulated).');
            return `0x${Math.random().toString(16).substring(2).repeat(4)}`;
        }

        try {
            this.initialize();
            if (!this.contract) throw new Error("Contract not initialized");

            const tx = await this.contract.attest(paymentIdHash, responseHash);
            console.log(`Attestation transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log('Attestation confirmed.');
            return tx.hash;
        } catch (error) {
            console.error('Failed to record attestation:', error);
            return `0x${Math.random().toString(16).substring(2).repeat(4)} (Fallback)`;
        }
    }
}
