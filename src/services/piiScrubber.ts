/**
 * PII Scrubber Service
 * Automatically redacts Personally Identifiable Information (PII) 
 * before data is sent to external LLM providers.
 */
export class PiiScrubber {
    private static patterns = [
        // Emails
        { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: '[EMAIL_REDACTED]' },
        // Phone Numbers (various formats)
        { regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, label: '[PHONE_REDACTED]' },
        // IPv4 Addresses
        { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: '[IP_REDACTED]' },
        // Credit Card Numbers
        { regex: /\b(?:\d[ -]*?){13,16}\b/g, label: '[CREDIT_CARD_REDACTED]' },
        // API Keys (Generic pattern)
        { regex: /(?:api[_-]?key|secret|token|password|auth)[=:]\s*['"]?([a-zA-Z0-9]{16,})['"]?/gi, label: '[SECRET_REDACTED]' },
        // Social Security Numbers (US)
        { regex: /\b\d{3}-\d{2}-\d{4}\b/g, label: '[SSN_REDACTED]' }
    ];

    /**
     * Scrubs the input string by replacing PII with labels.
     */
    static scrub(text: string): string {
        let scrubbedText = text;

        for (const pattern of this.patterns) {
            scrubbedText = scrubbedText.replace(pattern.regex, (match) => {
                // For secrets, we want to keep the key but redact the value
                if (pattern.label === '[SECRET_REDACTED]') {
                    const parts = match.split(/[=:]/);
                    return `${parts[0]}: ${pattern.label}`;
                }
                return pattern.label;
            });
        }

        return scrubbedText;
    }
}
