import { useState, useEffect } from 'react';
import { getTransactions } from '../services/api';
import {
  CheckCircleIcon,
  CopyIcon,
  ClockIcon,
  SearchIcon,
  LayersIcon,
} from '../components/Icons';

export default function Transactions({ addToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [copiedTx, setCopiedTx] = useState(null);

  useEffect(() => {
    getTransactions()
      .then((res) => {
        if (res.data) setTransactions(res.data);
      })
      .catch((err) => {
        addToast('error', 'Fetch Error', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filtered = transactions.filter((tx) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      tx.propertyId?.toLowerCase().includes(q) ||
      tx.txHash?.toLowerCase().includes(q) ||
      tx.type?.toLowerCase().includes(q) ||
      tx.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <LayersIcon size={28} className="text-amber" />
          <span>Ledger Transaction Blocks</span>
        </h1>
        <p className="page-subtitle">
          Cryptographically confirmed state updates emitted by the Land Record Verification smart contract.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by Property ID, Operation Type, or Transaction Hash..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {filter && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setFilter('')}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p style={{ marginTop: '1rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
              Retrieving On-Chain Transactions...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            No transaction records match your criteria. Perform registrations or transfers to generate blocks.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Property ID</th>
                  <th>Execution Details</th>
                  <th>Transaction Hash</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={`badge ${tx.type === 'Registration' ? 'badge-info' : 'badge-success'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td><strong>{tx.propertyId}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{tx.details}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '0.78rem', color: 'var(--cyan-400)' }}>
                          {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-8)}` : 'Simulated'}
                        </code>
                        {tx.txHash && (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => copyHash(tx.txHash, idx)}
                          >
                            <CopyIcon size={12} />
                            <span>{copiedTx === idx ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ClockIcon size={13} />
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
