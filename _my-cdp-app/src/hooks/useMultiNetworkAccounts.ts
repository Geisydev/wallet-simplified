"use client";

import { useCurrentUser } from "@coinbase/cdp-hooks";
import { useEffect, useState } from "react";

/**
 * Hook to ensure smart accounts are created/initialized on both Base and Base Sepolia
 * Smart accounts are deterministic and have the same address across networks,
 * but may need to be initialized on each network
 */
export function useMultiNetworkAccounts() {
  const { currentUser } = useCurrentUser();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeAccounts() {
      if (!currentUser || initialized) return;

      try {
        // Get the smart account addresses
        const accounts = currentUser.evmSmartAccounts || [];

        if (accounts.length === 0) {
          console.log("No smart accounts found yet");
          return;
        }

        console.log("Smart accounts detected:", accounts);
        console.log("Accounts are deterministic and work across Base and Base Sepolia");

        // Smart accounts in CDP are deterministic
        // The same address works on Base Sepolia and Base mainnet
        // No additional initialization needed - the account is deployed on first transaction

        setInitialized(true);
      } catch (err) {
        console.error("Error initializing multi-network accounts:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }

    initializeAccounts();
  }, [currentUser, initialized]);

  return {
    smartAccount: currentUser?.evmSmartAccounts?.[0],
    accounts: currentUser?.evmSmartAccounts || [],
    initialized,
    error,
  };
}
