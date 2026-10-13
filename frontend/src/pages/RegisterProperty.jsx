import { useState } from 'react';
import { registerProperty, fetchSampleDocBlob } from '../services/api';
import {
  FileTextIcon,
  CheckCircleIcon,
  BuildingIcon,
  UserIcon,
  CopyIcon,
  SparklesIcon,
} from '../components/Icons';
import SampleDocsBar from '../components/SampleDocsBar';

export default function RegisterProperty({ addToast }) {
  const [propertyId, setPropertyId] = useState('');
  const [owner, setOwner] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedTx, setCopiedTx] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!propertyId.trim() || !owner.trim() || !file) {
      addToast('error', 'Validation Error', 'Property ID, owner name, and PDF deed are all required');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const res = await registerProperty(propertyId.trim(), owner.trim(), file);
      setResult(res.data);
      addToast('success', 'Property Registered', `${propertyId} successfully committed to blockchain!`);
    } catch (err) {
      addToast('error', 'Registration Reverted', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreloadDemo = async () => {
    try {
      setLoading(true);
      setPropertyId('P101');
      setOwner('Ravi Kumar');
      const blob = await fetchSampleDocBlob('deed_P101_ravi_original.pdf');
      const sampleFile = new File([blob], 'deed_P101_ravi_original.pdf', { type: 'application/pdf' });
      setFile(sampleFile);
      addToast('info', 'Demo Data Pre-filled', 'Pre-filled Property P101 with original sample deed');
    } catch (err) {
      addToast('error', 'Failed to load sample', err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyTx = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div>
      <SampleDocsBar onSelectSample={() => handlePreloadDemo()} currentAction="register" />

      <div className="page-header">
        <h1 className="page-title">
          <FileTextIcon size={28} className="text-indigo" />
          <span>Register Land Title</span>
        </h1>
        <p className="page-subtitle">
          Record property ownership and cryptographic deed fingerprint into the immutable smart contract ledger.
        </p>
      </div>

      <div className="grid-2">
        {/* Form Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Title Registration Form</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handlePreloadDemo}
              disabled={loading}
            >
              <SparklesIcon size={14} className="text-cyan" />
              <span>Fill Demo (P101)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-prop-id">
                Unique Property Identifier (PID)
              </label>
              <input
                id="reg-prop-id"
                className="form-input"
                type="text"
                placeholder="e.g. P101, PLOT-8820"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-owner-name">
                Authorized Legal Owner Name
              </label>
              <input
                id="reg-owner-name"
                className="form-input"
                type="text"
                placeholder="e.g. Ravi Kumar"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Title Deed Document (PDF)</label>
              <div className={`file-upload ${file ? 'has-file' : ''}`}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  disabled={loading}
                />
                <div className="file-upload-icon">
                  {file ? <CheckCircleIcon size={26} /> : <FileTextIcon size={26} />}
                </div>
                <div className="file-upload-title">
                  {file ? file.name : 'Upload Official Deed PDF'}
                </div>
                <div className="file-upload-sub">
                  SHA-256 fingerprint will be computed securely in memory
                </div>
                {file && (
                  <span className="file-upload-name">
                    {(file.size / 1024).toFixed(1)} KB • Valid PDF format
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading || !file || !propertyId || !owner}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Submitting to EVM Registrar...</span>
                </>
              ) : (
                <>
                  <BuildingIcon size={18} />
                  <span>Commit Title to Blockchain</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Confirmation / Receipt Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Blockchain Minting Receipt</h3>
            {result && <span className="badge badge-success">Block Confirmed</span>}
          </div>

          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleIcon size={28} className="text-indigo" />
              </div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem' }}>Awaiting Submission</h4>
              <p style={{ fontSize: '0.88rem' }}>
                Complete the title form and sign with the registrar authority to generate an on-chain receipt.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ marginTop: '1rem', color: 'var(--indigo-500)', fontWeight: 600 }}>
                Writing to Hardhat Local Blockchain...
              </p>
            </div>
          )}

          {result && (
            <div className="receipt-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--emerald-500)', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircleIcon size={28} className="text-emerald" />
                <div>
                  <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>Title Immutably Registered</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Property ID {result.propertyId} is now locked on-chain.
                  </p>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <tbody>
                    <tr>
                      <th style={{ width: '35%' }}>Property ID</th>
                      <td><strong>{result.propertyId}</strong></td>
                    </tr>
                    <tr>
                      <th>Current Owner</th>
                      <td>{result.owner}</td>
                    </tr>
                    <tr>
                      <th>Block Height</th>
                      <td>#{result.blockNumber}</td>
                    </tr>
                    <tr>
                      <th>Document Digest</th>
                      <td>
                        <code style={{ fontSize: '0.78rem', color: 'var(--cyan-400)' }}>
                          {result.documentHash}
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <th>Transaction Hash</th>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code style={{ fontSize: '0.78rem' }}>
                            {result.transactionHash.slice(0, 16)}...{result.transactionHash.slice(-8)}
                          </code>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => copyTx(result.transactionHash)}
                          >
                            <CopyIcon size={12} />
                            <span>{copiedTx ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
