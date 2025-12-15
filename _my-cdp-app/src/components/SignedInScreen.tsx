"use client";

import styled from "styled-components";
import { useCurrentUser, useEvmAddress, useIsSignedIn, useSendUserOperation } from "@coinbase/cdp-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, formatEther, isAddress, encodeFunctionData, parseUnits } from "viem";
import { normalize } from "viem/ens";
import { baseSepolia, mainnet } from "viem/chains";
import { useMultiNetworkAccounts } from "@/hooks/useMultiNetworkAccounts";
import SmartAccountTransaction from "./SmartAccountTransaction";
import TokenTransfer from "./TokenTransfer";
import SendAllETH from "./SendAllETH";
import UserBalance from "./UserBalance";
import AccountDebug from "./AccountDebug";

type NetworkType = "base" | "base-sepolia" | "arbitrum";

const TOKENS_BY_NETWORK = {
  "base": { USDC: { name: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`, decimals: 6 }, USDT: { name: "USDT", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as `0x${string}`, decimals: 6 }, GHO: { name: "GHO", address: "0x88b1Cd4b430D95b406E382C3cDBaE54697a0286E" as `0x${string}`, decimals: 18 } },
  "base-sepolia": { USDC: { name: "USDC", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`, decimals: 6 }, USDT: { name: "USDT", address: "0x0000000000000000000000000000000000000000" as `0x${string}`, decimals: 6 }, GHO: { name: "GHO", address: "0x0000000000000000000000000000000000000000" as `0x${string}`, decimals: 18 } },
};

const ERC20_ABI = [
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
] as const;

const client = createPublicClient({ chain: baseSepolia, transport: http() });
const mainnetClient = createPublicClient({ chain: mainnet, transport: http() });

export default function SignedInScreen() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, data: txData, error: txError, status: txStatus } = useSendUserOperation();
  const { smartAccount, accounts, initialized } = useMultiNetworkAccounts();

  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [recipientInput, setRecipientInput] = useState<string>("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingEns, setIsResolvingEns] = useState(false);

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("base-sepolia");
  const [selectedToken, setSelectedToken] = useState<string>("USDC");
  const [sendAmount, setSendAmount] = useState<string>("");
  const [sendErrorMessage, setSendErrorMessage] = useState<string>("");

  const TOKENS = (TOKENS_BY_NETWORK as any)[selectedNetwork];

  const formattedBalance = useMemo(() => {
    if (balance === undefined) return undefined;
    return formatEther(balance);
  }, [balance]);

  const getBalance = useCallback(async () => {
    if (!evmAddress) return;
    const weiBalance = await client.getBalance({ address: evmAddress });
    setBalance(weiBalance);
  }, [evmAddress]);

  useEffect(() => {
    getBalance();
    const interval = setInterval(getBalance, 500);
    return () => clearInterval(interval);
  }, [getBalance]);

  const resolveEnsName = useCallback(async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) { setResolvedAddress(null); return; }
    if (isAddress(trimmedInput)) { setResolvedAddress(trimmedInput); return; }
    if (trimmedInput.includes('.')) {
      setIsResolvingEns(true);
      try {
        const normalizedName = normalize(trimmedInput);
        const address = await mainnetClient.getEnsAddress({ name: normalizedName });
        setResolvedAddress(address);
      } catch (error) {
        console.error('ENS resolution failed:', error);
        setResolvedAddress(null);
      } finally { setIsResolvingEns(false); }
    } else { setResolvedAddress(null); }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => resolveEnsName(recipientInput), 500);
    return () => clearTimeout(timeoutId);
  }, [recipientInput, resolveEnsName]);

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
      const transferData = encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [resolvedAddress as `0x${string}`, amountInWei] });
      await sendUserOperation({ evmSmartAccount: smartAccount, network: selectedNetwork, calls: [{ to: token.address, value: 0n, data: transferData }], useCdpPaymaster: true });
      setSendAmount(""); setRecipientInput(""); setResolvedAddress(null);
    } catch (err) {
      setSendErrorMessage(err instanceof Error ? err.message : "Transaction failed");
      console.error("Error sending token:", err);
    }
  };

  const isSending = txStatus === "pending";
  const isSendSuccess = txStatus === "success" && txData;

  return (
    <>
      <MainRoot>
        <Inner>
          <StatsGrid>
            <StatCard>
              <StatTitle>ETH Balance</StatTitle>
              <StatValue>{formattedBalance === undefined ? '...' : `${parseFloat(formattedBalance).toFixed(4)} ETH`}</StatValue>
              <StatMeta>≈ $0.00 USD</StatMeta>
            </StatCard>

            <StatCard>
              <StatTitle>Stablecoin Balance</StatTitle>
              <StatValue>0.00 USDC</StatValue>
              <StatMeta>≈ $0.00 USD</StatMeta>
            </StatCard>

            <StatCard>
              <StatTitle>Overall Yield</StatTitle>
              <StatValue style={{ color: '#10b981' }}>+$0.00</StatValue>
              <StatMeta>+0.00% APY</StatMeta>
            </StatCard>
          </StatsGrid>

          <SendCard>
            <SendHeader>
              <SendTitle>Send Crypto</SendTitle>
              <SendSubtitle>Fast, secure blockchain transfers</SendSubtitle>
            </SendHeader>

            <FormColumn>
              <FormRow>
                <FormLabel>Network</FormLabel>
                <Select value={selectedNetwork} onChange={(e) => { setSelectedNetwork(e.target.value as NetworkType); setSelectedToken("USDC"); }} disabled={isSending}>
                  <option value="base-sepolia">Base Sepolia</option>
                  <option value="base">Base</option>
                </Select>
              </FormRow>

              <FormRow>
                <FormLabel>Token</FormLabel>
                <Select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)} disabled={isSending}>
                  {Object.entries(TOKENS).map(([key, token]: any) => (
                    <option key={key} value={key} disabled={token.address === "0x0000000000000000000000000000000000000000"}>
                      {token.name} {token.address === "0x0000000000000000000000000000000000000000" ? "(Not available)" : ""}
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow>
                <FormLabel>Amount</FormLabel>
                <AmountInputWrapper>
                  <AmountInput type="number" placeholder="0.00" step="any" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} disabled={isSending} />
                  <TokenBadge>{selectedToken}</TokenBadge>
                </AmountInputWrapper>
              </FormRow>

              <FormRow>
                <FormLabel>Send to</FormLabel>
                <InputWithIcon>
                  <IconSvg viewBox="0 0 24 24" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </IconSvg>
                  <TextInput type="text" placeholder="Wallet address or ENS name" value={recipientInput} onChange={(e) => setRecipientInput(e.target.value)} style={{ borderColor: resolvedAddress ? '#10b981' : undefined }} />
                  {isResolvingEns && <ResolvingSpinner viewBox="0 0 24 24" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></ResolvingSpinner>}
                </InputWithIcon>

                {resolvedAddress && recipientInput.includes('.') && (
                  <ResolvedBox>
                    <ResolvedIcon viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></ResolvedIcon>
                    <strong>Resolved:</strong>
                    <ResolvedAddr>{resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}</ResolvedAddr>
                  </ResolvedBox>
                )}

                {recipientInput && !isResolvingEns && !resolvedAddress && recipientInput.includes('.') && (
                  <ErrorBox>ENS name not found</ErrorBox>
                )}
              </FormRow>

              {sendErrorMessage && <ErrorBox>{sendErrorMessage}</ErrorBox>}

              {isSendSuccess && txData && (
                <SuccessBox>✅ Transaction successful! <a href={`${selectedNetwork === "base" ? "https://basescan.org" : "https://sepolia.basescan.org"}/tx/${txData.transactionHash}`} target="_blank" rel="noreferrer">View on Explorer</a></SuccessBox>
              )}

              <SendButton onClick={handleSendToken} disabled={isSending || !resolvedAddress || !sendAmount || !smartAccount} onMouseEnter={() => { }} onMouseLeave={() => { }}>
                {isSending ? (<><Spinner viewBox="0 0 24 24" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></Spinner>Sending...</>) : (<><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>Send {selectedToken}</>)}
              </SendButton>
            </FormColumn>

            <FooterText>Secured by blockchain technology</FooterText>
          </SendCard>

          <TransactionCard>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#111827', textAlign: 'center' }}>Transaction History</h2>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0', fontSize: '0.95rem' }}>
              <p style={{ margin: 0 }}>No transactions yet</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Your transaction history will appear here</p>
            </div>
          </TransactionCard>

          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', width: '100%', boxSizing: 'border-box' }}>
            {isSignedIn && evmAddress && (<SmartAccountTransaction balance={formattedBalance} onSuccess={getBalance} />)}
          </div>

          {isSignedIn && evmAddress && <SendAllETH balance={formattedBalance} onSuccess={getBalance} />}

          <div className="card card--token-transfer">{isSignedIn && evmAddress && <TokenTransfer />}</div>
        </Inner>
      </MainRoot>

      <AccountDebug />
    </>
  );
}

/* Styled components */
const MainRoot = styled.main`
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #f9fafb;
  padding: 4rem 1rem;
  box-sizing: border-box;

  @media (max-width: 540px) {
    padding: 4rem 0.5rem;
  }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 0; /* page-level padding handled by MainRoot */
  box-sizing: border-box;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  width: 100%;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
`;

const StatTitle = styled.h3`margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: #374151;`;
const StatValue = styled.p`margin: 0 0 0.25rem 0; font-size: 2rem; font-weight: 700; color: #111827;`;
const StatMeta = styled.p`margin: 0; font-size: 0.875rem; color: #6b7280;`;

const SendCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
  width: 100%;
  box-sizing: border-box;
`;

const SendHeader = styled.div`text-align: center; margin-bottom: 2rem;`;
const SendTitle = styled.h2`margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #111827; letter-spacing: -0.02em;`;
const SendSubtitle = styled.p`margin: 0; font-size: 1rem; color: #6b7280;`;

const FormColumn = styled.div`display: flex; flex-direction: column; gap: 1.25rem;`;
const FormRow = styled.div``;
const FormLabel = styled.label`display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.875rem; color: #374151;`;

const Select = styled.select`
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  color: #111827;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
`;

const AmountInputWrapper = styled.div`position: relative;`;
const AmountInput = styled.input`
  width: 100%;
  padding: 0.875rem 4rem 0.875rem 0.875rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  color: #111827;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
`;
const TokenBadge = styled.span`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 1rem;
  font-weight: 600;
`;

const InputWithIcon = styled.div`position: relative;`;
const IconSvg = styled.svg`position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; width: 20px; height: 20px;`;
const TextInput = styled.input`
  width: 100%;
  padding: 0.875rem 0.875rem 0.875rem 3rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  color: #111827;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
`;
const ResolvingSpinner = styled.svg`position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #6b7280; width: 20px; height: 20px;`;

const ResolvedBox = styled.div`margin-top: 0.5rem; padding: 0.75rem; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; font-size: 0.875rem; color: #166534; display: flex; align-items: center; gap: 0.5rem;`;
const ResolvedIcon = styled.svg`width:16px; height:16px;`;
const ResolvedAddr = styled.span`font-family: monospace; font-size: 0.8rem;`;

const ErrorBox = styled.div`margin-top:0.5rem; padding:0.75rem; background-color:#fef2f2; border:1px solid #fca5a5; border-radius:8px; font-size:0.875rem; color:#991b1b;`;
const SuccessBox = styled.div`margin-top:0.5rem; padding:0.75rem; background-color:#f0fdf4; border:1px solid #86efac; border-radius:8px; font-size:0.875rem; color:#166534;`;

const SendButton = styled.button`
  width:100%;
  padding:1rem;
  font-size:1.125rem;
  font-weight:600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color:white;
  border:none;
  border-radius:12px;
  cursor:pointer;
  margin-top:0.5rem;
  transition: all 0.2s;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:0.5rem;

  &:disabled { background:#d1d5db; cursor:not-allowed; opacity:0.6; }
`;

const Spinner = styled.svg`width:20px; height:20px;`;
const FooterText = styled.p`text-align:center; font-size:0.875rem; color:#6b7280; margin-top:1.5rem; margin-bottom:0;`;

const TransactionCard = styled.div`background:white; border-radius:20px; padding:2rem; box-shadow:0 1px 3px rgba(0,0,0,0.1); border:1px solid #e5e7eb; width:100%; box-sizing:border-box;`;