"use client";

import { useCurrentUser, useSendUserOperation } from "@coinbase/cdp-hooks";
import { Button } from "@coinbase/cdp-react/components/ui/Button";
import { useState } from "react";
import { parseEther } from "viem";

type NetworkType = "base" | "base-sepolia" | "arbitrum" | "arbitrum-sepolia";

interface Props {
  balance?: string;
  onSuccess?: () => void;
}

export default function SendAllETH({ balance, onSuccess }: Props) {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, data, error, status } = useSendUserOperation();
  const [network, setNetwork] = useState<NetworkType>("base-sepolia");
  const [recipient, setRecipient] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const smartAccount = currentUser?.evmSmartAccounts?.[0];

  const handleSendAll = async () => {
    if (!smartAccount || !recipient || !balance) {
      setErrorMessage("Please enter a recipient address");
      return;
    }

    try {
      setErrorMessage("");

      // Parse the balance to wei
      const amountInWei = parseEther(balance);

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: network,
        calls: [
          {
            to: recipient as `0x${string}`,
            value: amountInWei,
            data: "0x",
          },
        ],
        useCdpPaymaster: true, // Sponsor the gas!
      });

      console.log("Transaction sent:", result);
      setRecipient("");
      onSuccess?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Transaction failed");
      console.error("Error sending ETH:", err);
    }
  };

  const handleReset = () => {
    setErrorMessage("");
  };

  const isLoading = status === "pending";
  const isSuccess = status === "success" && data;
  const hasError = error || errorMessage;

  if (!smartAccount) {
    return (
      <div>
        <p>Please connect your wallet first.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    }}>
      <h2 style={{
        margin: '0 0 1rem 0',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center'
      }}>
        Send All ETH
      </h2>

      <p style={{
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: '1.5rem',
        fontSize: '0.875rem'
      }}>
        Transfer your entire ETH balance with sponsored gas
      </p>

      {/* Current Balance Display */}
      <div style={{
        background: '#f9fafb',
        padding: '1rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
          Current Balance
        </p>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
          {balance === undefined ? '...' : `${parseFloat(balance).toFixed(6)} ETH`}
        </p>
      </div>

      {/* Error Display */}
      {hasError && !isSuccess && (
        <div style={{
          padding: '1rem',
          background: '#fee',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: 0, color: '#c00', fontSize: '0.875rem' }}>
            {error?.message || errorMessage}
          </p>
          <Button onClick={handleReset} variant="secondary" style={{ marginTop: '0.5rem' }}>
            Try Again
          </Button>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && data && (
        <div style={{
          padding: '1rem',
          background: '#efe',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#080', fontWeight: '600' }}>
            ✅ ETH sent successfully!
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            <a
              href={`${
                network === "base"
                  ? "https://basescan.org"
                  : network === "base-sepolia"
                  ? "https://sepolia.basescan.org"
                  : network === "arbitrum"
                  ? "https://arbiscan.io"
                  : "https://sepolia.arbiscan.io"
              }/tx/${data.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb', textDecoration: 'underline' }}
            >
              View on Explorer
            </a>
          </p>
        </div>
      )}

      {/* Transfer Form */}
      {!isSuccess && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Network Selection */}
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
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkType)}
              disabled={isLoading}
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
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="base-sepolia">Base Sepolia (Testnet)</option>
              <option value="base">Base (Mainnet)</option>
              <option value="arbitrum-sepolia">Arbitrum Sepolia (Testnet)</option>
              <option value="arbitrum">Arbitrum (Mainnet)</option>
            </select>
          </div>

          {/* Recipient Address */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#374151'
            }}>
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isLoading}
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
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendAll}
            disabled={isLoading || !recipient || !balance || parseFloat(balance) === 0}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              background: isLoading || !recipient || !balance || parseFloat(balance) === 0
                ? '#d1d5db'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading || !recipient || !balance || parseFloat(balance) === 0
                ? 'not-allowed'
                : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && recipient && balance && parseFloat(balance) > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
            }}
          >
            {isLoading ? "Sending..." : `Send All ${balance || '0'} ETH`}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#9ca3af',
            margin: 0
          }}>
            Gas fees sponsored - you keep 100% of your ETH
          </p>
        </div>
      )}
    </div>
  );
}
