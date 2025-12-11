"use client";

import styled from "styled-components";
import Header from "./Header";

/**
 * Sign in screen
 */
export default function SignInScreen() {
  return (
    <MainCard>
      <h1 className="sr-only">Sign in</h1>
      <h2>Welcome!</h2>
      <p>Please sign in to continue.</p>
    </MainCard>
  );
}

const MainCard = styled.main`
  align-items: center;
  background-color: var(--cdp-example-card-bg-color);
  border: 1px solid var(--cdp-example-card-border-color);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-between;
  max-width: var(--cdp-example-card-max-width);
  padding: 2rem 1rem;
  text-align: center;
  width: 100%;
`;


const CardTitle = styled.p`
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
`;
