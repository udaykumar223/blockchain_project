import { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';
import {
  ActivityIcon,
  BuildingIcon,
  ArrowRightLeftIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
} from '../components/Icons';

export default function Dashboard({ addToast, navigateTo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      addToast('error', 'Dashboard Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <span className="spinner" style={{ width: 42, height: 42, borderWidth: 3 }} />
        <p style={{ marginTop: '1.25rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
          Synchronizing Live Blockchain State...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 1.25rem', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangleIcon size={32} className="text-rose" />
        </div>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Unable to Fetch Blockchain Data</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto 1.5rem' }}>
          Please verify that the Hardhat local node and backend API service are actively running.
        </p>
        <button type="button" className="btn btn-primary" onClick={fetchData}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <ActivityIcon size={28} className="text-cyan" />
          <span>Blockchain Ledger Analytics</span>
        </h1>
        <p className="page-subtitle">
          Real-time telemetry, transaction activity, and verification audit events directly from the EVM smart contract.
        </p>
      </div>

      {/* Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap indigo">
            <BuildingIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.totalProperties ?? 0}</span>
            <span className="stat-label">Minted Property Records</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap emerald">
            <ArrowRightLeftIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.totalTransfers ?? 0}</span>
            <span className="stat-label">Ratified Title Transfers</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigateTo('verify')}>
          <div className="stat-icon-wrap cyan">
            <ShieldCheckIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.recentVerifications?.length || 0}</span>
            <span className="stat-label">Verification Audits Logged</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigateTo('transactions')}>
          <div className="stat-icon-wrap amber">
            <CheckCircleIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.recentTransactions?.length || 0}</span>
            <span className="stat-label">Confirmed Ledger Blocks</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <CheckCircleIcon size={18} className="text-indigo" />
              <h3 className="card-title">Recent Transactions</h3>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => navigateTo('transactions')}
            >
              View Full Log
            </button>
          </div>

          {data.recentTransactions?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>PID</th>
                    <th>Beneficiary / Details</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.slice(0, 6).map((tx, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`badge ${tx.type === 'Registration' ? 'badge-info' : 'badge-success'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td><strong>{tx.propertyId}</strong></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.details}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions recorded yet in current session.
            </div>
          )}
        </div>

        {/* Recent Verifications */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <ShieldCheckIcon size={18} className="text-cyan" />
              <h3 className="card-title">Verification Audits</h3>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => navigateTo('verify')}
            >
              Verify Document
            </button>
          </div>

          {data.recentVerifications?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Audit Outcome</th>
                    <th>Computed SHA-256 Digest</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVerifications.slice(0, 6).map((v, i) => (
                    <tr key={i}>
                      <td><strong>{v.propertyId}</strong></td>
                      <td>
                        <span className={`badge ${v.result === 'VERIFIED' ? 'badge-success' : 'badge-danger'}`}>
                          {v.result === 'VERIFIED' ? 'AUTHENTIC' : 'TAMPERED'}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem', color: 'var(--cyan-400)' }}>
                          {v.calculatedHash ? `${v.calculatedHash.slice(0, 10)}...${v.calculatedHash.slice(-6)}` : 'N/A'}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No document verifications performed yet. Go to Verify to test deeds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
