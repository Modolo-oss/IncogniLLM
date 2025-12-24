import { Request, Response } from 'express';
import { PiiScrubber } from '../services/piiScrubber';
import { LlmService } from '../services/llmService';
import { PaymentService } from '../services/paymentService';
import { IdentityService } from '../services/identityService';
import { AttestationService } from '../services/attestationService';

export class ChatController {
    static async chat(req: Request, res: Response) {
        try {
            const { prompt, model, paymentNote, agentIdentity } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            // 1. ERC-8004 Identity Validation (Real Development)
            if (agentIdentity) {
                const { agentId, agentCard } = agentIdentity;
                const isValid = await IdentityService.validateAgentIdentity(agentId, agentCard);
                if (!isValid) {
                    return res.status(401).json({ error: 'Invalid ERC-8004 Agent Identity' });
                }
            }

            // 2. PX402 Payment Processing (Real Development)
            let updatedNote = null;
            let paymentTxHash = null;
            const COST_PER_REQUEST = 0.01; // 0.01 USDC

            if (paymentNote) {
                const note = typeof paymentNote === 'string' ? PaymentService.parseNote(paymentNote) : paymentNote;
                const paymentResult = await PaymentService.processPayment(note, COST_PER_REQUEST);

                if (!paymentResult.success) {
                    return res.status(402).json({ error: 'PX402 Payment failed: Insufficient funds or invalid note' });
                }

                updatedNote = paymentResult.updatedNote;
                paymentTxHash = paymentResult.txHash;
            } else {
                console.warn('No PX402 payment note provided. Proceeding as free tier (Dev Mode).');
            }

            // 3. PII Scrubbing (Real Development)
            const scrubbedPrompt = PiiScrubber.scrub(prompt);
            console.log(`[REAL] Original Prompt: ${prompt}`);
            console.log(`[REAL] Scrubbed Prompt: ${scrubbedPrompt}`);

            // 4. LLM Response Generation (Real Development - Anthropic)
            const aiResponse = await LlmService.generateResponse(scrubbedPrompt, model);

            // 5. Capx On-Chain Attestation (Real Development)
            let attestationTxHash = null;
            if (paymentTxHash) {
                // Use the payment transaction hash as the unique identifier for attestation
                attestationTxHash = await AttestationService.attestInteraction(paymentTxHash, aiResponse);
            }

            // 6. Stateless Data Wipe (Real Development)
            IdentityService.wipeData(prompt);
            IdentityService.wipeData(scrubbedPrompt);

            // 7. Return Response with Proofs and Updated Note
            res.json({
                response: aiResponse,
                scrubbed_prompt: scrubbedPrompt,
                payment_tx: paymentTxHash,
                attestation_tx: attestationTxHash,
                updated_note: updatedNote, // Return the new note commitment to the user
                status: 'verified'
            });

        } catch (error: any) {
            console.error('[REAL] Chat error:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
}
