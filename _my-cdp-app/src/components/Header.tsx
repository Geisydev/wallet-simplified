"use client";
import styled from "styled-components";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { useEffect, useState } from "react";

import { IconCheck, IconCopy, IconUser } from "@/components/Icons";

/**
 * Header component
 */
export default function Header() {
  const { evmAddress } = useEvmAddress();
  const [isCopied, setIsCopied] = useState(false);

  const copyAddress = async () => {
    if (!evmAddress) return;
    try {
      await navigator.clipboard.writeText(evmAddress);
      setIsCopied(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!isCopied) return;
    const timeout = setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  return (
    <HeaderWrapper>
      <HeaderInner>
        <TitleContainer>
          <SiteTitle>Wealth$table</SiteTitle>
          {/* <span className="smart-badge">SMART</span> */}
        </TitleContainer>
        <UserInfo>
          {evmAddress && (
            <CopyAddressButton
              aria-label="copy wallet address"
              onClick={copyAddress}
            >
              {!isCopied ? (
                <>
                  <IconWrapper>
                    <IconUser className="user-icon user-icon--user" />
                  </IconWrapper>
                  <IconWrapper>
                    <IconCopy className="user-icon user-icon--copy" />
                  </IconWrapper>
                </>
              ) : (
                <IconWrapper>
                  <IconCheck className="user-icon user-icon--check" />
                </IconWrapper>
              )}

              <WalletAddress>
                {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
              </WalletAddress>
            </CopyAddressButton>
          )}
          <AuthButton />
        </UserInfo>
      </HeaderInner>
    </HeaderWrapper>
  );
}



const HeaderWrapper = styled.header`
  background-color: var(--cdp-example-card-bg-color, #fff);
  border-bottom: 1px solid var(--cdp-example-card-border-color, #e6e6e6);
  padding: 0.5rem 1rem;
  width: 100%;
`;

const HeaderInner = styled.div`
  display: flex;
  flex-direction: column;      /* mobile first: stacked */
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 75rem;
  width: 100%;
  gap: 1rem;
  text-align: center;

  @media (min-width: 540px) {
    flex-direction: row;      /* original desktop layout */
    text-align: left;
  }
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SiteTitle = styled.h1`
  && {
    color: #141519;
    font-size: 1.2rem;
    font-weight: 400;
    line-height: 1.2;
    margin: 0;
    margin-bottom: 0.5rem;
    opacity: 1;
  }

  br {
    display: none;
  }

  @media (min-width: 540px) {
    && {
      margin-bottom: 0;
    }
    br {
      display: inline;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;                /* mobile: take full width so header stacks nicely */
  justify-content: center;

  @media (min-width: 540px) {
    width: auto;              /* desktop: revert to auto so items align right */
    justify-content: flex-end;
  }
`;

const CopyAddressButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  color: inherit;
  font: inherit;

  /* default: show user icon, hide copy/check icons */
  .user-icon--copy,
  .user-icon--check {
    display: none;
  }
  .user-icon--user {
    display: inline;
  }

  /* on hover: hide user icon, show copy/check icons */
  &:hover .user-icon--user {
    display: none;
  }
  &:hover .user-icon--copy,
  &:hover .user-icon--check {
    display: inline;
  }

  svg {
    color: inherit;
    fill: currentColor;
    height: 1rem;
    width: 1rem;
`;

const WalletAddress = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  margin - right: 1rem;
  color: #26282b;
  font-weight: 500;
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  height: 1.25rem;
  width: auto;
`;
