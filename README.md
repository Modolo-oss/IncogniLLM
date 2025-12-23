# IncogniLLM

**The Zero-Knowledge, Verifiable AI Gateway for the Agentic Economy.**

IncogniLLM is an autonomous privacy gateway designed to decouple user identity, payment trails, and AI interactions.

## Key Features
- **Invisible ZK-Payments (px402)**: Anonymous, gasless payments for AI services.
- **On-Chain Attestation (Capx Chain)**: Cryptographic proof of service without revealing chat content.
- **PII Scrubbing**: Automatic removal of sensitive data before forwarding to LLMs.
- **Sovereign Identity (ERC-8004)**: Client-side encrypted history and preferences.
- **Stateless Gateway**: No central database of user interactions.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, Ethers.js, OpenRouter.
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide.
- **Blockchain**: Solidity, Hardhat (Capx Testnet).

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

1. Clone the repository.
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the Project

1. **Start the Backend**:
   In the root directory:
   ```bash
   # Set your OpenRouter API Key (or use 'mock' for testing)
   $env:OPENROUTER_API_KEY='your_key'
   npm run dev
   ```

2. **Start the Frontend**:
   In the `frontend` directory:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure
- `/src`: Backend source code.
- `/frontend`: React frontend application.
- `/blockchain`: Smart contracts and Hardhat configuration.
- `/contracts`: (Legacy) Smart contract source.

## License
ISC
