"use client";

import { useState } from "react";
import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, parseEther, Calls } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";

export default function SmartWalletTest() {
  const { address: userAddress } = useAccount();
  const [loading, setLoading] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(message);
  };

  const runTest = async () => {
    if (!userAddress) {
      addLog("❌ Please connect your wallet first");
      return;
    }

    setLoading(true);
    setLogs([]);

    try {
      const cdp = new CdpClient();

      // Create smart account with connected wallet as owner
      const smartAccount = await cdp.evm.createSmartAccount({ owner: userAddress });
      setSmartAccountAddress(smartAccount.address);
      addLog(`✅ Created smart account: ${smartAccount.address}`);

      // Request faucet
      const { transactionHash } = await smartAccount.requestFaucet({
        network: "base-sepolia",
        token: "eth",
      });
      addLog(`💰 Faucet requested: ${transactionHash}`);

      // Wait for faucet transaction
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const faucetTxReceipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });
      addLog(`✅ Faucet transaction confirmed: ${faucetTxReceipt.transactionHash}`);

      // Wait for balance
      addLog("⏳ Waiting for balance to be available...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify balance
      const balance = await publicClient.getBalance({ address: smartAccount.address });
      addLog(`💵 Smart account balance: ${balance.toString()} wei`);

      // Prepare multi-send
      const destinationAddresses = [
        "0xba5f3764f0A714EfaEDC00a5297715Fd75A416B7",
        "0xD84523e4F239190E9553ea59D7e109461752EC3E",
        "0xf1F7Bf05A81dBd5ACBc701c04ce79FbC82fEAD8b",
      ];

      const calls = destinationAddresses.map(destinationAddress => ({
        to: destinationAddress,
        value: parseEther("0.000001"),
        data: "0x" as `0x${string}`,
      }));

      addLog("📤 Sending user operation to three destinations...");
      const { userOpHash } = await smartAccount.sendUserOperation({
        network: "base-sepolia",
        calls: calls as Calls<unknown[]>,
      });
      addLog(`🔄 User operation hash: ${userOpHash}`);

      addLog("⏳ Waiting for user operation to be confirmed...");
      const userOperationResult = await smartAccount.waitForUserOperation({
        userOpHash,
      });

      if (userOperationResult.status === "complete") {
        addLog(
          `✅ User operation confirmed! View on BaseScan: https://sepolia.basescan.org/tx/${userOperationResult.transactionHash}`
        );
      } else {
        addLog("❌ User operation failed.");
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Smart Wallet Test</h1>

      {!userAddress && (
        <div className="alert alert-warning">
          Please connect your wallet to continue
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={runTest}
        disabled={loading || !userAddress}
      >
        {loading ? "Running Test..." : "Run Smart Wallet Test"}
      </button>

      {smartAccountAddress && (
        <div className="alert alert-info">
          <strong>Smart Account:</strong> {smartAccountAddress}
        </div>
      )}

      <div className="bg-base-200 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Logs:</h2>
        <div className="space-y-1 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="break-all">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}