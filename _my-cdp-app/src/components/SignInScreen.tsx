"use client";

import styled from "styled-components";

/**
 * Sign in screen
 */
export default function SignInScreen() {
  return (
    <PageMain>
      <MainCard>
        <h1 className="sr-only">Sign in</h1>
        <CardTitle>Welcome!</CardTitle>
        <p>Please sign in to continue.</p>
      </MainCard>
    </PageMain>
  );
}

const PageMain = styled.main`
  padding: 4rem 1rem; /* moved from globals .main */
  width: 100%;
  display: flex;
  justify-content: center;

  @media (max-width: 540px) {
    padding: 4rem 0.5rem; /* keep the smaller padding on very small screens if needed */
  }
`;

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
