"use client";

import { useCurrentUser, useSendUserOperation } from "@coinbase/cdp-hooks";
import { Button } from "@coinbase/cdp-react/components/ui/Button";
import { useState, useEffect } from "react";
import { encodeFunctionData, formatUnits, parseUnits, createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

type NetworkType = "base" | "base-sepolia";

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
    // Note: These are placeholder addresses for Base Sepolia
    // You may need to deploy or find actual testnet tokens
    USDT: {
      name: "USDT (Test)",
      address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      decimals: 6,
    },
    DAI: {
      name: "DAI (Test)",
      address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      decimals: 18,
    },
  },
};

// ERC20 ABI for balance and transfer
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
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

export default function TokenTransfer() {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, data, error, status } = useSendUserOperation();

  const [network, setNetwork] = useState<NetworkType>("base-sepolia");
  const [selectedToken, setSelectedToken] = useState<string>("USDC");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const smartAccount = currentUser?.evmSmartAccounts?.[0];
  const TOKENS = TOKENS_BY_NETWORK[network];

  // Fetch token balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!smartAccount) return;

      try {
        setLoadingBalances(true);
        const publicClient = createPublicClient({
          chain: network === "base" ? base : baseSepolia,
          transport: http(),
        });

        const balancePromises = Object.entries(TOKENS).map(async ([key, token]) => {
          // Skip zero address tokens
          if (token.address === "0x0000000000000000000000000000000000000000") {
            return [key, "0"];
          }

          const balance = await publicClient.readContract({
            address: token.address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [smartAccount as `0x${string}`],
          });

          return [key, formatUnits(balance, token.decimals)];
        });

        const results = await Promise.all(balancePromises);
        const balancesObj = Object.fromEntries(results);
        setBalances(balancesObj);
      } catch (err) {
        console.error("Error fetching balances:", err);
      } finally {
        setLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [smartAccount, network, TOKENS]);

  const handleSendToken = async () => {
    if (!smartAccount || !recipient || !amount) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    try {
      setErrorMessage("");

      const token = TOKENS[selectedToken];
      const amountInWei = parseUnits(amount, token.decimals);

      // Encode the ERC20 transfer function call
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amountInWei],
      });

      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: network,
        calls: [
          {
            to: token.address,
            value: 0n,
            data: transferData,
          },
        ],
        useCdpPaymaster: true, // Sponsor the gas!
      });

      console.log("Transaction sent:", result);

      // Reset form on success
      setRecipient("");
      setAmount("");

      // Refresh balances after a delay
      setTimeout(() => {
        const fetchBalances = async () => {
          if (!smartAccount) return;
          const publicClient = createPublicClient({
            chain: network === "base" ? base : baseSepolia,
            transport: http(),
          });
          const balancePromises = Object.entries(TOKENS).map(async ([key, token]) => {
            // Skip zero address tokens
            if (token.address === "0x0000000000000000000000000000000000000000") {
              return [key, "0"];
            }
            const balance = await publicClient.readContract({
              address: token.address,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [smartAccount as `0x${string}`],
            });
            return [key, formatUnits(balance, token.decimals)];
          });
          const results = await Promise.all(balancePromises);
          setBalances(Object.fromEntries(results));
        };
        fetchBalances();
      }, 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Transaction failed");
      console.error("Error sending token:", err);
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
      <div className="token-transfer-widget">
        <h2>Token Transfer</h2>
        <p>Please connect your wallet first.</p>
      </div>
    );
  }

  return (
    <div className="token-transfer-widget">
      <h2>Send Tokens (Sponsored Gas)</h2>

      {/* Token Balances */}
      <div className="balances-section">
        <h3>Your Balances</h3>
        {loadingBalances ? (
          <p>Loading balances...</p>
        ) : (
          <div className="balances-list">
            {Object.entries(TOKENS).map(([key, token]) => (
              <div key={key} className="balance-item">
                <strong>{token.name}:</strong> {balances[key] || "0"}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {hasError && !isSuccess && (
        <div className="error-section">
          <p className="error-message">{error?.message || errorMessage}</p>
          <Button onClick={handleReset} variant="secondary">
            Try Again
          </Button>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && data && (
        <div className="success-section">
          <p className="success-message">
            ✅ Transfer successful! No gas fees paid.
          </p>
          <p>
            <a
              href={`${network === "base" ? "https://basescan.org" : "https://sepolia.basescan.org"}/tx/${data.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on {network === "base" ? "BaseScan" : "BaseScan Sepolia"}
            </a>
          </p>
        </div>
      )}

      {/* Transfer Form */}
      {!isSuccess && (
        <div className="transfer-form">
          {/* Network Selection */}
          <div className="form-group">
            <label htmlFor="network-select">Network:</label>
            <select
              id="network-select"
              value={network}
              onChange={(e) => {
                setNetwork(e.target.value as NetworkType);
                setBalances({});
                setSelectedToken("USDC");
              }}
              disabled={isLoading}
            >
              <option value="base-sepolia">Base Sepolia (Testnet)</option>
              <option value="base">Base (Mainnet)</option>
            </select>
          </div>

          {/* Token Selection */}
          <div className="form-group">
            <label htmlFor="token-select">Select Token:</label>
            <select
              id="token-select"
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              disabled={isLoading}
            >
              {Object.keys(TOKENS).map((key) => (
                <option key={key} value={key}>
                  {TOKENS[key as keyof typeof TOKENS].name}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Address */}
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address:</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input
              id="amount"
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
            <small>Available: {balances[selectedToken] || "0"} {selectedToken}</small>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendToken}
            disabled={isLoading || !recipient || !amount}
            className="send-button"
          >
            {isLoading ? "Sending..." : "Send with Sponsored Gas"}
          </Button>
        </div>
      )}

      <style jsx>{`
        .token-transfer-widget {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          max-width: 500px;
          margin: 20px auto;
        }

        .balances-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 6px;
        }

        .balances-section h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .balances-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .balance-item {
          padding: 8px;
          background: white;
          border-radius: 4px;
        }

        .transfer-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-weight: 600;
        }

        .form-group input,
        .form-group select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group small {
          color: #666;
          font-size: 12px;
        }

        .send-button {
          margin-top: 10px;
        }

        .error-section {
          padding: 15px;
          background: #fee;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .error-message {
          color: #c00;
          margin-bottom: 10px;
        }

        .success-section {
          padding: 15px;
          background: #efe;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .success-message {
          color: #080;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}
