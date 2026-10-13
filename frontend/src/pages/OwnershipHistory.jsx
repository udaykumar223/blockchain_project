import { useState, useEffect } from 'react';
import { getOwnershipHistory, seedDemoRecords } from '../services/api';
import {
  HistoryIcon,
  SearchIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  CopyIcon,
  ArrowRightLeftIcon,
  BuildingIcon,
  SparklesIcon,
  AlertTriangleIcon,
} from '../components/Icons';

export default function OwnershipHistory({ addToast, navigateTo }) {
  const [propertyId, setPropertyId] = useState('P101');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchHistory = async (idToSearch, isInitial = false) => {
    const id = (idToSearch || propertyId).trim();
    if (!id) {
      addToast('error', 'Validation Error', 'Please enter a Property ID');
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);
      setHistoryData(null);
      const res = await getOwnershipHistory(id);
      setHistoryData(res.data);
      if (!isInitial) {
        addToast('success', 'History Loaded', `Found provenance records for ${id}`);
      }
    } catch (err) {
      if (err.message && err.message.includes('Property not found')) {
        setNotFound(true);
        if (!isInitial) {
          addToast('error', 'Not Found', `Property ${id} does not exist on the blockchain yet.`);
        }
      } else {
        addToast('error', 'Query Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAndFetch = async () => {
    try {
      setSeeding(true);
      await seedDemoRecords();
      addToast('success', 'Demo Seeded', 'Property P101 registered and transferred on blockchain!');
      setPropertyId('P101');
      await fetchHistory('P101', false);
    } catch (err) {
      addToast('error', 'Seed Failed', err.message);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchHistory('P101', true);
  }, []);

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <HistoryIcon size={28} className="text-cyan" />
          <span>Audit Provenance &amp; Title Lineage</span>
        </h1>
        <p className="page-subtitle">
          Trace the unbroken, chronological on-chain custody chain for any property from initial minting to present day.
        </p>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Property ID (e.g. P101)"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchHistory(propertyId, false)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fetchHistory(propertyId, false)}
            disabled={loading || seeding}
          >
            <SearchIcon size={16} />
            <span>Search Provenance</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setPropertyId('P101');
              fetchHistory('P101', false);
            }}
            disabled={loading || seeding}
          >
            <span>Query P101</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSeedAndFetch}
            disabled={loading || seeding}
            title="Populate blockchain with sample property P101 (Ravi -> Arun)"
          >
            <SparklesIcon size={15} className="text-cyan" />
            <span>{seeding ? 'Seeding...' : 'Seed Demo (P101)'}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p style={{ marginTop: '1rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
            Querying Append-Only Transfer Array from Smart Contract...
          </p>
        </div>
      )}

      {/* Not Found state with quick seed option */}
      {notFound && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 1.25rem', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangleIcon size={30} className="text-amber" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Property &quot;{propertyId}&quot; is not yet on the Blockchain
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            This local blockchain node was recently initialized and does not have this property record yet. You can register it manually or populate the 7-step evaluation demo records with one click.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSeedAndFetch}
              disabled={seeding}
            >
              <SparklesIcon size={16} />
              <span>{seeding ? 'Seeding Records...' : 'Seed Demo Property P101 (Ravi ➔ Arun)'}</span>
            </button>
            {navigateTo && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigateTo('register')}
              >
                <span>Register a New Title</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Data display */}
      {historyData && (
        <div>
          {/* Summary Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 21, 36, 0.9) 0%, rgba(22, 32, 58, 0.9) 100%)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--indigo-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BuildingIcon size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Property Identifier
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {historyData.propertyId}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Legal Owner</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  {historyData.currentOwner}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Initial Registration</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {new Date(historyData.registeredAt * 1000).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Transfers</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                  {historyData.transfers?.length || 0} Event(s)
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="section-title">
              <ShieldCheckIcon size={20} className="text-emerald" />
              <span>Immutable Chain of Custody</span>
            </h3>

            {(!historyData.transfers || historyData.transfers.length === 0) ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No ownership transfers have occurred yet for this property.</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Property remains with original registrant: <strong>{historyData.currentOwner}</strong>.
                </p>
              </div>
            ) : (
              <div className="timeline-wrap">
                {historyData.transfers.map((rec, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">{index + 1}</div>
                    <div className="timeline-card">
                      <div className="timeline-top">
                        <div className="timeline-actors">
                          <span className="owner-pill prev">{rec.previousOwner}</span>
                          <ArrowRightLeftIcon size={16} className="text-cyan" />
                          <span className="owner-pill new">{rec.newOwner}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <ClockIcon size={14} />
                          <span>{new Date(rec.timestamp * 1000).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Conveyance Deed Fingerprint (SHA-256):
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <code style={{ fontSize: '0.78rem', color: 'var(--cyan-400)', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: 4 }}>
                              {rec.newDocumentHash}
                            </code>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => copyText(rec.newDocumentHash, `hash-${index}`)}
                            >
                              <CopyIcon size={12} />
                              <span>{copiedHash === `hash-${index}` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Ratified By Registrar: <code style={{ color: 'var(--text-main)' }}>{rec.initiatedBy}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
