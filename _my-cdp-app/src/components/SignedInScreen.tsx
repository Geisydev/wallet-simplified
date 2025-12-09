"use client";

import { useCurrentUser, useEvmAddress, useIsSignedIn, useSendUserOperation } from "@coinbase/cdp-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, formatEther, isAddress, encodeFunctionData, parseUnits } from "viem";
import { normalize } from "viem/ens";
import { baseSepolia, mainnet, base, arbitrum, arbitrumSepolia } from "viem/chains";
import { useMultiNetworkAccounts } from "@/hooks/useMultiNetworkAccounts";

import Header from "./Header";
import SmartAccountTransaction from "./SmartAccountTransaction";
import TokenTransfer from "./TokenTransfer";
import SendAllETH from "./SendAllETH";
import UserBalance from "./UserBalance";
import AccountDebug from "./AccountDebug";

type NetworkType = "base" | "base-sepolia" | "arbitrum" | "arbitrum-sepolia";

// Token configurations by network
const TOKENS_BY_NETWORK = {
  "base": {
    USDC: {
      name: "USDC",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
      decimals: 6,
    },
    USDT: {
      name: "USDT",
      address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as `0x${string}`,
      decimals: 6,
    },
    GHO: {
      name: "GHO",
      address: "0x88b1Cd4b430D95b406E382C3cDBaE54697a0286E" as `0x${string}`,
      decimals: 18,
    },
  },
  "base-sepolia": {
    USDC: {
      name: "USDC",
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
      decimals: 6,
    },
    USDT: {
      name: "USDT",
      address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      decimals: 6,
    },
    GHO: {
      name: "GHO",
      address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      decimals: 18,
    },
  },
  "arbitrum": {
    USDC: {
      name: "USDC",
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as `0x${string}`,
      decimals: 6,
    },
    USDT: {
      name: "USDT",
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as `0x${string}`,
      decimals: 6,
    },
    ARB: {
      name: "ARB",
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548" as `0x${string}`,
      decimals: 18,
    },
  },
  "arbitrum-sepolia": {
    USDC: {
      name: "USDC (Test)",
      address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`,
      decimals: 6,
    },
    USDT: {
      name: "USDT (Test)",
      address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      decimals: 6,
    },
    ARB: {
      name: "ARB (Test)",
      address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      decimals: 18,
    },
  },
};

// ERC20 ABI for transfer
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * Create a viem client to access user's balance on the Base Sepolia network
 */
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Create a mainnet client for ENS resolution
 */
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * The Signed In screen
 */
export default function SignedInScreen() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, data: txData, error: txError, status: txStatus } = useSendUserOperation();

  // Initialize multi-network accounts
  const { smartAccount, accounts, initialized } = useMultiNetworkAccounts();

  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [recipientInput, setRecipientInput] = useState<string>("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingEns, setIsResolvingEns] = useState(false);

  // Send Crypto widget state
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("base-sepolia");
  const [selectedToken, setSelectedToken] = useState<string>("USDC");
  const [sendAmount, setSendAmount] = useState<string>("");
  const [sendErrorMessage, setSendErrorMessage] = useState<string>("");

  const TOKENS = TOKENS_BY_NETWORK[selectedNetwork];

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

  // ENS Resolution
  const resolveEnsName = useCallback(async (input: string) => {
    const trimmedInput = input.trim();

    // If empty, reset
    if (!trimmedInput) {
      setResolvedAddress(null);
      return;
    }

    // If it's already a valid address, use it directly
    if (isAddress(trimmedInput)) {
      setResolvedAddress(trimmedInput);
      return;
    }

    // Check if it looks like an ENS name (contains .eth or other TLD)
    if (trimmedInput.includes('.')) {
      setIsResolvingEns(true);
      try {
        const normalizedName = normalize(trimmedInput);
        const address = await mainnetClient.getEnsAddress({
          name: normalizedName,
        });
        setResolvedAddress(address);
      } catch (error) {
        console.error('ENS resolution failed:', error);
        setResolvedAddress(null);
      } finally {
        setIsResolvingEns(false);
      }
    } else {
      setResolvedAddress(null);
    }
  }, []);

  // Debounce ENS resolution
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      resolveEnsName(recipientInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recipientInput, resolveEnsName]);

  // Handle token send
  const handleSendToken = async () => {
    if (!smartAccount || !resolvedAddress || !sendAmount) {
      setSendErrorMessage("Please fill in all fields and enter a valid recipient");
      return;
    }

    const token = TOKENS[selectedToken as keyof typeof TOKENS];
    if (!token || token.address === "0x0000000000000000000000000000000000000000") {
      setSendErrorMessage("Selected token is not available on this network");
      return;
    }

    try {
      setSendErrorMessage("");

      const amountInWei = parseUnits(sendAmount, token.decimals);

      // Encode the ERC20 transfer function call
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [resolvedAddress as `0x${string}`, amountInWei],
      });

      await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: selectedNetwork,
        calls: [
          {
            to: token.address,
            value: 0n,
            data: transferData,
          },
        ],
        useCdpPaymaster: true, // Use gas sponsorship
      });

      // Reset form on success
      setSendAmount("");
      setRecipientInput("");
      setResolvedAddress(null);
    } catch (err) {
      setSendErrorMessage(err instanceof Error ? err.message : "Transaction failed");
      console.error("Error sending token:", err);
    }
  };

  const isSending = txStatus === "pending";
  const isSendSuccess = txStatus === "success" && txData;

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            width: '100%'
          }}>
            {/* ETH Balance */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                ETH Balance
              </h3>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                {formattedBalance === undefined ? '...' : `${parseFloat(formattedBalance).toFixed(4)} ETH`}
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {/* TODO: Add USD value */}
                ≈ $0.00 USD
              </p>
            </div>

            {/* Stablecoin Balance */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                Stablecoin Balance
              </h3>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                0.00 USDC
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {/* TODO: Add actual stablecoin balance */}
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
                  value={selectedNetwork}
                  onChange={(e) => {
                    setSelectedNetwork(e.target.value as NetworkType);
                    setSelectedToken("USDC");
                  }}
                  disabled={isSending}
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
                  <option value="base">Base</option>
                  <option value="arbitrum-sepolia">Arbitrum Sepolia</option>
                  <option value="arbitrum">Arbitrum</option>
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
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  disabled={isSending}
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
                  {Object.entries(TOKENS).map(([key, token]) => {
                    const isDisabled = token.address === "0x0000000000000000000000000000000000000000";
                    return (
                      <option key={key} value={key} disabled={isDisabled}>
                        {token.name} {isDisabled ? "(Not available)" : ""}
                      </option>
                    );
                  })}
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
                  <input
                    type="number"
                    placeholder="0.00"
                    step="any"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    disabled={isSending}
                    style={{
                      width: '100%',
                      padding: '0.875rem 4rem 0.875rem 0.875rem',
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
                  }}>{selectedToken}</span>
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
                    placeholder="Wallet address or ENS name"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 0.875rem 0.875rem 3rem',
                      fontSize: '1rem',
                      border: `2px solid ${resolvedAddress ? '#10b981' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  {isResolvingEns && (
                    <div style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280'
                    }}>
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </div>
                  )}
                </div>
                {resolvedAddress && recipientInput.includes('.') && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span style={{ fontWeight: '500' }}>Resolved:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
                    </span>
                  </div>
                )}
                {recipientInput && !isResolvingEns && !resolvedAddress && recipientInput.includes('.') && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>ENS name not found</span>
                  </div>
                )}
              </div>

              {/* Error/Success Messages */}
              {sendErrorMessage && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#991b1b'
                }}>
                  {sendErrorMessage}
                </div>
              )}

              {isSendSuccess && txData && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#166534'
                }}>
                  ✅ Transaction successful!{' '}
                  <a
                    href={`${
                      selectedNetwork === "base"
                        ? "https://basescan.org"
                        : selectedNetwork === "base-sepolia"
                        ? "https://sepolia.basescan.org"
                        : selectedNetwork === "arbitrum"
                        ? "https://arbiscan.io"
                        : "https://sepolia.arbiscan.io"
                    }/tx/${txData.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    View on Explorer
                  </a>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendToken}
                disabled={isSending || !resolvedAddress || !sendAmount || !smartAccount}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  background: isSending || !resolvedAddress || !sendAmount || !smartAccount
                    ? '#d1d5db'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isSending || !resolvedAddress || !sendAmount || !smartAccount
                    ? 'not-allowed'
                    : 'pointer',
                  marginTop: '0.5rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  opacity: isSending || !resolvedAddress || !sendAmount || !smartAccount ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSending && resolvedAddress && sendAmount && smartAccount) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Send {selectedToken}
                  </>
                )}
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
          {isSignedIn && evmAddress && (
            <SendAllETH balance={formattedBalance} onSuccess={getBalance} />
          )}
          <div className="card card--token-transfer">
            {isSignedIn && evmAddress && <TokenTransfer />}
          </div>
        </div>
      </main>

      {/* Debug component - remove in production */}
      <AccountDebug />
    </>
  );
}
