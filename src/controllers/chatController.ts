import { Request, Response } from 'express';
import { PiiScrubber } from '../services/piiScrubber';
import { LlmService } from '../services/llmService';
import { PaymentService } from '../services/paymentService';
import { IdentityService } from '../services/identityService';
import { AttestationService } from '../services/attestationService';

export class ChatController {
    static async chat(req: Request, res: Response) {
        try {
            const { prompt, model, paymentNoteId, encryptedIdentity } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            // 0. Verify Identity (Optional for now, but good for structure)
            if (encryptedIdentity) {
                const isValidIdentity = await IdentityService.validateIdentity(encryptedIdentity);
                if (!isValidIdentity) {
                    return res.status(401).json({ error: 'Invalid identity' });
                }
            }

            // 1. Process Payment
            // Cost calculation (simplified): 0.01 USDC per request
            const COST_PER_REQUEST = 0.01;

            if (paymentNoteId) {
                const paymentSuccess = await PaymentService.processPayment(paymentNoteId, COST_PER_REQUEST);
                if (!paymentSuccess) {
                    return res.status(402).json({ error: 'Payment failed' });
                }
            } else {
                // For now, allow free chats if no note provided, but log warning
                console.warn('No payment note provided. Proceeding as free tier (Dev Mode).');
            }

            // 2. Scrub PII
            const scrubbedPrompt = PiiScrubber.scrub(prompt);
            console.log(`Original: ${prompt}`);
            console.log(`Scrubbed: ${scrubbedPrompt}`);

            // 3. Send to LLM
            const response = await LlmService.generateResponse(scrubbedPrompt, model);

            // 4. Attest Interaction
            let txHash = null;
            if (paymentNoteId) {
                txHash = await AttestationService.attestInteraction(paymentNoteId, response);
            }

            // 5. Wipe Data (Stateless)
            IdentityService.wipeData(prompt);
            IdentityService.wipeData(scrubbedPrompt);

            // 6. Return response
            res.json({
                original_prompt_length: prompt.length,
                scrubbed_prompt: scrubbedPrompt,
                response: response,
                payment_status: paymentNoteId ? 'paid' : 'free_tier',
                attestation_tx: txHash
            });

        } catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
