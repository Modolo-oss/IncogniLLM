import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Send,
  Shield,
  ShieldCheck,
  Wallet,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  User,
  Bot,
  Key,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivacySDK, type Note } from '@prxvt/sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scrubbedContent?: string;
  txHash?: string;
  paymentTx?: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showScrubbed, setShowScrubbed] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [agentId, setAgentId] = useState('0x85c992ec27DD9F9fd8421413aa3992EA69434259');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sdk = useRef(new PrivacySDK({ chain: 'base' }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(address);

        const walletClient = createWalletClient({
          account: address,
          chain: base,
          transport: custom(window.ethereum)
        });

        await sdk.current.connect(walletClient);
        console.log('Wallet connected:', address);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install MetaMask or Rabby wallet!');
    }
  };

  // Load saved note on mount
  useEffect(() => {
    const savedNote = localStorage.getItem('incogni_note_real');
    if (savedNote) {
      try {
        const parsed = JSON.parse(savedNote);
        setCurrentNote(parsed);
        updateBalance(parsed);
      } catch (e) {
        console.error('Failed to parse saved note');
      }
    }
  }, []);

  const updateBalance = async (note: Note) => {
    try {
      const bal = await sdk.current.getBalance(note);
      setBalance(bal);
    } catch (e) {
      console.error('Failed to get balance');
    }
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      const amount = 0.1; // Small amount for demo
      let note;

      if (walletAddress) {
        // Use connected wallet extension (MetaMask/Rabby)
        console.log(`Depositing ${amount} USDC via Wallet Extension...`);
        note = await sdk.current.deposit(amount, ""); // SDK will use connected wallet
      } else if (privateKey) {
        // Fallback to manual private key
        console.log(`Depositing ${amount} USDC via Private Key...`);
        note = await sdk.current.depositFast(amount, privateKey);
      } else {
        setIsLoading(false);
        setShowKeyInput(true);
        alert("Please connect your wallet or enter a private key.");
        return;
      }

      setCurrentNote(note);
      setBalance(amount);
      localStorage.setItem('incogni_note_real', JSON.stringify(note));
      alert("Deposit Successful! Private Note created.");
    } catch (error) {
      console.error('Deposit error:', error);
      alert("Deposit failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Real ERC-8004 Agent Identity
      const agentIdentity = {
        agentId: agentId,
        agentCard: {
          name: "IncogniAgent-Alpha",
          capabilities: ["privacy-chat", "pii-scrubbing"],
          version: "1.0.0",
          endpoint: window.location.origin
        }
      };

      const response = await axios.post('/api/chat', {
        prompt: input,
        model: 'claude-3-5-sonnet-20240620',
        paymentNote: currentNote,
        agentIdentity: agentIdentity
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        scrubbedContent: response.data.scrubbed_prompt,
        txHash: response.data.attestation_tx,
        paymentTx: response.data.payment_tx,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update the note with the change returned from the server
      if (response.data.updated_note) {
        setCurrentNote(response.data.updated_note);
        localStorage.setItem('incogni_note_real', JSON.stringify(response.data.updated_note));
        updateBalance(response.data.updated_note);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.response?.data?.error || 'Failed to connect to the IncogniLLM gateway.'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 glass p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-accent/20 p-2 rounded-xl">
            <Shield className="text-accent w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">IncogniLLM</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Real ZK-Gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold">
              {walletAddress ? 'Connected Wallet' : 'Agent ID (ERC-8004)'}
            </span>
            <span className="text-xs font-mono text-gray-400">
              {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : `${agentId.substring(0, 10)}...`}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase font-bold">ZK-Balance</span>
            <span className="text-accent font-mono font-bold">{balance.toFixed(4)} USDC</span>
          </div>

          {!walletAddress ? (
            <button
              onClick={connectWallet}
              className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-sm"
            >
              <Wallet size={18} /> Connect
            </button>
          ) : (
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-2 rounded-xl transition-all active:scale-95 ${showKeyInput ? 'bg-accent text-black' : 'bg-stealth-gray text-gray-400'}`}
              title="Settings"
            >
              <Key size={20} />
            </button>
          )}

          <button
            onClick={handleDeposit}
            disabled={isLoading}
            className="bg-accent hover:bg-accent-hover text-black p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            title="Gasless Deposit (PX402)"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Wallet size={20} />}
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showKeyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full max-w-4xl mb-6 overflow-hidden"
          >
            <div className="glass p-6 rounded-2xl space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Private Key (Demo Only - Signs Gasless Deposit)</label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 focus:outline-none focus:border-accent/50 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Agent ID (ERC-8004 Identity)</label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 focus:outline-none focus:border-accent/50 text-sm font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="w-full max-w-4xl flex-1 flex flex-col glass rounded-3xl overflow-hidden relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Database size={48} className="text-gray-600" />
              <div>
                <p className="text-lg font-medium">Real-time ZK-Payment Gateway</p>
                <p className="text-sm">Every message is a ZK-transaction on Base.</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 text-[10px] uppercase font-bold tracking-wider text-gray-500`}>
                    {msg.role === 'user' ? (
                      <>
                        Agent Identity <User size={12} />
                      </>
                    ) : (
                      <>
                        <Bot size={12} /> IncogniLLM Node
                      </>
                    )}
                  </div>

                  <div className={`p-4 rounded-2xl ${msg.role === 'user'
                    ? 'bg-accent/10 border border-accent/20 text-accent'
                    : 'bg-stealth-gray border border-white/5'
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="mt-2 flex flex-col gap-1 w-full">
                      {msg.paymentTx && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-400/60 bg-blue-400/5 px-2 py-1 rounded-lg border border-blue-400/10">
                          <Wallet size={12} />
                          <span>PX402 ZK-Payment Confirmed</span>
                          <a
                            href={`https://basescan.org/tx/${msg.paymentTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto hover:text-blue-400 flex items-center gap-1"
                          >
                            TX <ExternalLink size={10} />
                          </a>
                        </div>
                      )}

                      {msg.txHash && (
                        <div className="flex items-center gap-2 text-[10px] text-accent/60 bg-accent/5 px-2 py-1 rounded-lg border border-accent/10">
                          <ShieldCheck size={12} />
                          <span>Capx On-Chain Attestation</span>
                          <a
                            href={`https://capxscan.com/tx/${msg.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto hover:text-accent flex items-center gap-1"
                          >
                            Proof <ExternalLink size={10} />
                          </a>
                        </div>
                      )}

                      {msg.scrubbedContent && (
                        <div className="mt-1">
                          <button
                            onClick={() => setShowScrubbed(!showScrubbed)}
                            className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                          >
                            {showScrubbed ? <EyeOff size={10} /> : <Eye size={10} />}
                            {showScrubbed ? 'Hide Scrubbed Prompt' : 'View Scrubbed Prompt (PII Redacted)'}
                          </button>
                          {showScrubbed && (
                            <div className="mt-1 p-2 bg-black/40 rounded-lg border border-white/5 text-[10px] font-mono text-gray-400 italic">
                              {msg.scrubbedContent}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={balance > 0 ? "Type your prompt..." : "Deposit USDC (PX402) to start chatting..."}
              disabled={isLoading || balance <= 0}
              className="w-full bg-stealth-dark border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-accent/50 transition-all placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || balance <= 0}
              className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl flex items-center justify-center transition-all ${isLoading || !input.trim() || balance <= 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-accent text-black hover:bg-accent-hover active:scale-95'
                }`}
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
          <div className="mt-3 flex justify-between items-center px-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <Lock size={10} />
              <span>End-to-end encrypted session</span>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
              $ILLM v1.0.0-real
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="mt-8 text-center text-gray-600 text-[10px] uppercase tracking-[0.2em]">
        The Zero-Knowledge, Verifiable AI Gateway for the Agentic Economy
      </footer>
    </div>
  );
};

export default App;
