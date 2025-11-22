"use client";

import React, { useState } from "react";
import { CheckCircle, DollarSign, Send, User } from "lucide-react";
import type { NextPage } from "next";

const Home: NextPage = () => {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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
          <h1 className="text-4xl font-bold text-white mb-2">Send USDT</h1>
          <p className="text-slate-300">Fast, secure blockchain transfers</p>
        </div>

        {/* Send Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSend} className="space-y-6">
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
                  <span className="text-slate-300 font-medium">USDT</span>
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
                  placeholder="Wallet address or username"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={sending || sent}
                />
              </div>
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
                  Send USDT
                </>
              )}
            </button>
          </form>

          {/* Transaction Summary */}
          {amount && recipient && !sent && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-sm text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span>You&apos;re sending</span>
                  <span className="font-semibold text-white">{amount} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>To</span>
                  <span className="font-mono text-xs text-white truncate ml-4 max-w-[200px]">{recipient}</span>
                </div>
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
