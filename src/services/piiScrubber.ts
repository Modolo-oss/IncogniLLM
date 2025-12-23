export class PiiScrubber {
    static scrub(text: string): string {
        // Basic regex for email
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        // Basic regex for phone numbers (generic)
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

        let scrubbedText = text.replace(emailRegex, '[EMAIL_REDACTED]');
        scrubbedText = scrubbedText.replace(phoneRegex, '[PHONE_REDACTED]');

        return scrubbedText;
    }
}
