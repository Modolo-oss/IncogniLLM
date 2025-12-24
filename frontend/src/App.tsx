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
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scrubbedContent?: string;
  txHash?: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showScrubbed, setShowScrubbed] = useState(false);
  const [paymentNoteId, setPaymentNoteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDeposit = () => {
    const amount = 10;
    const fakeNote = `note_${Math.random().toString(36).substring(7)}`;
    setBalance(prev => prev + amount);
    setPaymentNoteId(fakeNote);

    // In a real app, this would be stored in a more secure way or managed by the SDK
    localStorage.setItem('incogni_note', fakeNote);
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
      const response = await axios.post('/api/chat', {
        prompt: input,
        model: 'openai/gpt-3.5-turbo',
        paymentNoteId: paymentNoteId,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        scrubbedContent: response.data.scrubbed_prompt,
        txHash: response.data.attestation_tx,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);

      if (paymentNoteId) {
        setBalance(prev => Math.max(0, prev - 0.01));
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Failed to connect to the IncogniLLM gateway. Please ensure the backend is running.',
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
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Stealth Gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Private Balance</span>
            <span className="text-accent font-mono font-bold">{balance.toFixed(2)} USDC</span>
          </div>
          <button
            onClick={handleDeposit}
            className="bg-accent hover:bg-accent-hover text-black p-2 rounded-xl transition-all active:scale-95"
            title="Top-up (Mock)"
          >
            <Wallet size={20} />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="w-full max-w-4xl flex-1 flex flex-col glass rounded-3xl overflow-hidden relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <Lock size={48} className="text-gray-600" />
              <div>
                <p className="text-lg font-medium">Your session is stateless.</p>
                <p className="text-sm">Messages are scrubbed and attested on-chain.</p>
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
                        Anonymous User <User size={12} />
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

                  {msg.role === 'assistant' && msg.txHash && (
                    <div className="mt-2 flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 text-[10px] text-accent/60 bg-accent/5 px-2 py-1 rounded-lg border border-accent/10">
                        <ShieldCheck size={12} />
                        <span>On-Chain Attestation Verified</span>
                        <a
                          href={`https://scan.capx.fi/tx/${msg.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto hover:text-accent flex items-center gap-1"
                        >
                          View Proof <ExternalLink size={10} />
                        </a>
                      </div>

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
              placeholder={balance > 0 ? "Type your prompt..." : "Deposit USDC to start chatting..."}
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
              $ILLM v1.0.0-alpha
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
