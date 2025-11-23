"use client";

import { useEvmAddress, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

import Header from "./Header";
import SmartAccountTransaction from "./SmartAccountTransaction";
import TokenTransfer from "./TokenTransfer";
import UserBalance from "./UserBalance";

/**
 * Create a viem client to access user's balance on the Base Sepolia network
 */
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * The Signed In screen
 */
export default function SignedInScreen() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const [balance, setBalance] = useState<bigint | undefined>(undefined);

  const formattedBalance = useMemo(() => {
    if (balance === undefined) return undefined;
    return formatEther(balance);
  }, [balance]);

  const getBalance = useCallback(async () => {
    if (!evmAddress) return;
    const weiBalance = await client.getBalance({
      address: evmAddress,
    });
    setBalance(weiBalance);
  }, [evmAddress]);

  useEffect(() => {
    getBalance();
    const interval = setInterval(getBalance, 500);
    return () => clearInterval(interval);
  }, [getBalance]);

  return (
    <>
      <Header />

      <main className="main flex-col-container flex-grow" style={{ backgroundColor: '#f9fafb' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
          padding: '2rem 1rem',
          boxSizing: 'border-box'
        }}>
          {/* Top section - Balance and Yield */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            width: '100%'
          }}>
            {/* Balance */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                Available Balance
              </h3>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                {formattedBalance === undefined ? '...' : `${parseFloat(formattedBalance).toFixed(4)} ETH`}
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {/* TODO: Add USD value */}
                ≈ $0.00 USD
              </p>
            </div>

            {/* Overall Yield */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                Overall Yield
              </h3>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                +$0.00
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                +0.00% APY
              </p>
            </div>
          </div>

          {/* Send Crypto Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '3rem 2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '2rem',
                fontWeight: '700',
                color: '#111827',
                letterSpacing: '-0.02em'
              }}>
                Send Crypto
              </h2>
              <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#6b7280',
                fontWeight: '400'
              }}>
                Fast, secure blockchain transfers
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Network */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Network
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    fontSize: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#111827',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <option value="base-sepolia">Base Sepolia</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                </select>
              </div>

              {/* Token */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Token
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    fontSize: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#111827',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <option value="eth">ETH</option>
                  <option value="usdc">USDC</option>
                  <option value="dai">DAI</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#10b981',
                    fontSize: '1.25rem',
                    fontWeight: '600'
                  }}>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.875rem 0.875rem 0.875rem 2.5rem',
                      fontSize: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>USDT</span>
                </div>
              </div>

              {/* Send To */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Send to
                </label>
                <div style={{ position: 'relative' }}>
                  <svg
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="Wallet address or username"
                    style={{
                      width: '100%',
                      padding: '0.875rem 0.875rem 0.875rem 3rem',
                      fontSize: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Send Button */}
              <button
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Send USDT
              </button>
            </div>

            {/* Footer text */}
            <p style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '1.5rem',
              marginBottom: 0
            }}>
              Secured by blockchain technology
            </p>
          </div>

          {/* Transaction History Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#111827', textAlign: 'center' }}>
              Transaction History
            </h2>
            <div style={{
              color: '#6b7280',
              textAlign: 'center',
              padding: '2rem 0',
              fontSize: '0.95rem'
            }}>
              <p style={{ margin: 0 }}>No transactions yet</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                Your transaction history will appear here
              </p>
            </div>
          </div>

          {/* Original Transaction Card - Keep for backward compatibility */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {isSignedIn && evmAddress && (
              <SmartAccountTransaction balance={formattedBalance} onSuccess={getBalance} />
            )}
          </div>
          <div className="card card--token-transfer">
            {isSignedIn && evmAddress && <TokenTransfer />}
          </div>
        </div>
      </main>
    </>
  );
}
