import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.ANTHROPIC_API_KEY;

export class LlmService {
    static async generateResponse(prompt: string, model: string = 'claude-3-5-sonnet-20240620'): Promise<string> {
        if (!API_KEY) {
            // Fallback to mock if no key is provided for testing
            if (process.env.OPENROUTER_API_KEY === 'mock') {
                return `[MOCK RESPONSE] Processed prompt: ${prompt}`;
            }
            throw new Error('ANTHROPIC_API_KEY is not defined');
        }

        try {
            const response = await axios.post(
                ANTHROPIC_API_URL,
                {
                    model: model,
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }],
                },
                {
                    headers: {
                        'x-api-key': API_KEY,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Anthropic response structure: response.data.content[0].text
            return response.data.content[0].text;
        } catch (error: any) {
            console.error('Error calling Anthropic API:', error.response?.data || error.message);
            throw new Error('Failed to generate response from Anthropic');
        }
    }
}
