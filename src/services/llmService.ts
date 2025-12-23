import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

export class LlmService {
    static async generateResponse(prompt: string, model: string = 'openai/gpt-3.5-turbo'): Promise<string> {
        if (!API_KEY) {
            throw new Error('OPENROUTER_API_KEY is not defined');
        }

        if (API_KEY === 'mock') {
            return `[MOCK RESPONSE] Processed prompt: ${prompt}`;
        }

        try {
            const response = await axios.post(
                OPENROUTER_API_URL,
                {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                },
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://incognillm.com', // Required by OpenRouter
                        'X-Title': 'IncogniLLM', // Optional
                    },
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling OpenRouter API:', error);
            throw new Error('Failed to generate response from LLM');
        }
    }
}
