"use client";

import { useCurrentUser } from "@coinbase/cdp-hooks";

export default function AccountDebug() {
  const { currentUser } = useCurrentUser();

  if (!currentUser) return null;

  const smartAccount = currentUser.evmSmartAccounts?.[0];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '1rem',
      maxWidth: '450px',
      fontSize: '0.875rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
        ✅ Multi-Network Smart Account
      </h3>
      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Status:</strong> <span style={{ color: '#10b981' }}>Active</span>
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Total Accounts:</strong> {currentUser.evmSmartAccounts?.length || 0}
        </p>

        {smartAccount && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: '#166534' }}>
              Smart Account Address:
            </p>
            <p style={{ margin: '0', wordBreak: 'break-all', color: '#166534' }}>
              {smartAccount}
            </p>
          </div>
        )}

        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: '0', fontSize: '0.75rem', color: '#1e40af', lineHeight: '1.4' }}>
            <strong>ℹ️ Multi-Network Support:</strong><br />
            This smart account works on:<br />
            • <strong>Base</strong> + Base Sepolia<br />
            • <strong>Arbitrum</strong> + Arbitrum Sepolia<br />
            Same address, different networks!
          </p>
        </div>

        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fcd34d' }}>
          <p style={{ margin: '0', fontSize: '0.7rem', color: '#92400e' }}>
            <strong>Note:</strong> Account deploys on first transaction per network
          </p>
        </div>
      </div>
    </div>
  );
}
