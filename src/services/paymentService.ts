import { PrivacySDK, Note } from '@prxvt/sdk';
import dotenv from 'dotenv';

dotenv.config();

export class PaymentService {
    private static sdk = new PrivacySDK({
        chain: 'base', // Default to base as per roadmap
        rpcUrl: process.env.RPC_URL_BASE || 'https://mainnet.base.org',
    });

    /**
     * Deposit USDC to create a private note.
     * NOTE: In a real production app, this should happen on the CLIENT side 
     * to keep the private key safe. This is here for the "Real Development" 
     * demonstration in the backend.
     */
    static async deposit(amount: number, privateKey: string): Promise<Note> {
        console.log(`[REAL] Processing gasless deposit of ${amount} USDC...`);
        try {
            const note = await this.sdk.depositFast(amount, privateKey);
            console.log(`[REAL] Deposit successful. Note version: ${note.version}`);
            return note;
        } catch (error) {
            console.error('[REAL] Deposit failed:', error);
            throw error;
        }
    }

    /**
     * Process a payment using a private note.
     * The gateway spends the note to pay for the AI request.
     */
    static async processPayment(note: Note, cost: number): Promise<{ success: boolean; updatedNote?: Note; txHash?: string }> {
        console.log(`[REAL] Processing private payment of ${cost} USDC...`);

        const recipient = process.env.GATEWAY_PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";

        try {
            const result = await this.sdk.makePayment(note, recipient, cost);
            console.log(`[REAL] Payment verified and processed. Tx: ${result.txHash}`);
            return {
                success: true,
                updatedNote: result.note,
                txHash: result.txHash
            };
        } catch (error) {
            console.error('[REAL] Payment failed:', error);
            return { success: false };
        }
    }

    /**
     * Helper to parse a note from a string (e.g. from request body)
     */
    static parseNote(noteStr: string): Note {
        try {
            return JSON.parse(noteStr) as Note;
        } catch (e) {
            throw new Error("Invalid note format");
        }
    }
}
