"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, DollarSign, Send, User } from "lucide-react";
import type { NextPage } from "next";
import { normalize } from "viem/ens";
import { usePublicClient } from "wagmi";
import { mainnet } from "wagmi/chains";

type Token = "USDT" | "USDC" | "DAI" | "GHO" | "PYUSD";
type Chain = "Base" | "Arbitrum";

const Home: NextPage = () => {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token>("USDT");
  const [selectedChain, setSelectedChain] = useState<Chain>("Base");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingENS, setIsResolvingENS] = useState(false);
  const [ensError, setEnsError] = useState<string | null>(null);

  const publicClient = usePublicClient({ chainId: mainnet.id });
  const tokens: Token[] = ["USDT", "USDC", "DAI", "GHO", "PYUSD"];
  const chains: Chain[] = ["Base", "Arbitrum"];

  // ENS Resolution Effect
  useEffect(() => {
    const resolveENS = async () => {
      if (!recipient) {
        setResolvedAddress(null);
        setEnsError(null);
        return;
      }

      // Check if it's an ENS name (ends with .eth)
      if (recipient.endsWith(".eth")) {
        setIsResolvingENS(true);
        setEnsError(null);
        try {
          const address = await publicClient?.getEnsAddress({
            name: normalize(recipient),
          });
          if (address) {
            setResolvedAddress(address);
            setEnsError(null);
          } else {
            setResolvedAddress(null);
            setEnsError("ENS name not found");
          }
        } catch (error) {
          console.error("ENS resolution error:", error);
          setResolvedAddress(null);
          setEnsError("Failed to resolve ENS name");
        } finally {
          setIsResolvingENS(false);
        }
      } else if (recipient.startsWith("0x")) {
        // It's already an address
        setResolvedAddress(null);
        setEnsError(null);
      } else {
        // Invalid format
        setResolvedAddress(null);
        setEnsError(null);
      }
    };

    const timeoutId = setTimeout(resolveENS, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [recipient, publicClient]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSending(false);
    setSent(true);

    // Reset after showing success
    setTimeout(() => {
      setAmount("");
      setRecipient("");
      setSent(false);
    }, 3000);
  };

  const isValid = amount && parseFloat(amount) > 0 && recipient.length > 0;

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Send Crypto</h1>
          <p className="text-slate-300">Fast, secure blockchain transfers</p>
        </div>

        {/* Send Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSend} className="space-y-6">
            {/* Chain Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Network</label>
              <div className="relative">
                <select
                  value={selectedChain}
                  onChange={e => setSelectedChain(e.target.value as Chain)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
                  disabled={sending || sent}
                >
                  {chains.map(chain => (
                    <option key={chain} value={chain} className="bg-slate-800">
                      {chain}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Token</label>
              <div className="relative">
                <select
                  value={selectedToken}
                  onChange={e => setSelectedToken(e.target.value as Token)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
                  disabled={sending || sent}
                >
                  {tokens.map(token => (
                    <option key={token} value={token} className="bg-slate-800">
                      {token}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-16 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  disabled={sending || sent}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-300 font-medium">{selectedToken}</span>
                </div>
              </div>
            </div>

            {/* Recipient Input */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Send to</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="Wallet address or ens name"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={sending || sent}
                />
                {isResolvingENS && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {/* ENS Resolution Display */}
              {resolvedAddress && (
                <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-xs text-emerald-400 mb-1">✓ ENS Resolved</p>
                  <p className="text-xs text-slate-300 font-mono break-all">{resolvedAddress}</p>
                </div>
              )}
              {ensError && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">✗ {ensError}</p>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!isValid || sending || sent}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                sent
                  ? "bg-emerald-500 text-white"
                  : isValid && !sending
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              {sent ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Sent Successfully!
                </>
              ) : sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send {selectedToken}
                </>
              )}
            </button>
          </form>

          {/* Transaction Summary */}
          {amount && recipient && !sent && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-sm text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span>Network</span>
                  <span className="font-semibold text-white">{selectedChain}</span>
                </div>
                <div className="flex justify-between">
                  <span>You&apos;re sending</span>
                  <span className="font-semibold text-white">
                    {amount} {selectedToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>To</span>
                  <span className="font-mono text-xs text-white truncate ml-4 max-w-[200px]">
                    {resolvedAddress || recipient}
                  </span>
                </div>
                {resolvedAddress && recipient.endsWith(".eth") && (
                  <div className="flex justify-between">
                    <span>ENS Name</span>
                    <span className="text-xs text-emerald-400">{recipient}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>Secured by blockchain technology</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
