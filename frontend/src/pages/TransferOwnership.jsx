import { useState } from 'react';
import { transferOwnership, fetchSampleDocBlob } from '../services/api';
import {
  ArrowRightLeftIcon,
  CheckCircleIcon,
  FileTextIcon,
  UserIcon,
  CopyIcon,
  SparklesIcon,
} from '../components/Icons';
import SampleDocsBar from '../components/SampleDocsBar';

export default function TransferOwnership({ addToast }) {
  const [propertyId, setPropertyId] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedTx, setCopiedTx] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!propertyId.trim() || !currentOwner.trim() || !newOwner.trim() || !file) {
      addToast('error', 'Validation Error', 'All fields and new deed PDF are required');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const res = await transferOwnership(
        propertyId.trim(),
        currentOwner.trim(),
        newOwner.trim(),
        file
      );
      setResult(res.data);
      addToast(
        'success',
        'Ownership Transferred',
        `Title for ${propertyId} transferred from ${currentOwner} to ${newOwner}`
      );
    } catch (err) {
      addToast('error', 'Transfer Reverted', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreloadDemo = async () => {
    try {
      setLoading(true);
      setPropertyId('P101');
      setCurrentOwner('Ravi');
      setNewOwner('Arun');
      const blob = await fetchSampleDocBlob('deed_P101_arun_transfer.pdf');
      const sampleFile = new File([blob], 'deed_P101_arun_transfer.pdf', { type: 'application/pdf' });
      setFile(sampleFile);
      addToast('info', 'Demo Data Pre-filled', 'Loaded scenario: Ravi -> Arun with transfer deed');
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
      <SampleDocsBar onSelectSample={() => handlePreloadDemo()} currentAction="transfer" />

      <div className="page-header">
        <h1 className="page-title">
          <ArrowRightLeftIcon size={28} className="text-emerald" />
          <span>Transfer Title Ownership</span>
        </h1>
        <p className="page-subtitle">
          Ratify legal ownership reassignment on-chain with updated deed hashing and provenance appending.
        </p>
      </div>

      <div className="grid-2">
        {/* Transfer Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transfer Ratification</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handlePreloadDemo}
              disabled={loading}
            >
              <SparklesIcon size={14} className="text-cyan" />
              <span>Fill Demo (Ravi &rarr; Arun)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="trans-prop-id">
                Property Identifier (PID)
              </label>
              <input
                id="trans-prop-id"
                className="form-input"
                type="text"
                placeholder="e.g. P101"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="trans-curr-owner">
                Current Registered Owner
              </label>
              <input
                id="trans-curr-owner"
                className="form-input"
                type="text"
                placeholder="Must match on-chain record exactly (e.g. Ravi)"
                value={currentOwner}
                onChange={(e) => setCurrentOwner(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="trans-new-owner">
                New Legal Beneficiary / Owner
              </label>
              <input
                id="trans-new-owner"
                className="form-input"
                type="text"
                placeholder="e.g. Arun Kumar"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Title Conveyance Deed (PDF)</label>
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
                  {file ? file.name : 'Upload Transferred Deed Document'}
                </div>
                <div className="file-upload-sub">
                  Cryptographic SHA-256 will replace existing deed hash
                </div>
                {file && (
                  <span className="file-upload-name">
                    {(file.size / 1024).toFixed(1)} KB • Valid PDF attachment
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading || !file || !propertyId || !currentOwner || !newOwner}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Executing Transfer on Blockchain...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeftIcon size={18} />
                  <span>Execute Ownership Transfer</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Transfer Confirmation Receipt */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transfer Provenance Receipt</h3>
            {result && <span className="badge badge-success">Transfer Sealed</span>}
          </div>

          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRightLeftIcon size={28} className="text-emerald" />
              </div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem' }}>Awaiting Transfer Action</h4>
              <p style={{ fontSize: '0.88rem' }}>
                The smart contract will verify current owner alignment before recording the transfer event.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ marginTop: '1rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
                Verifying Ownership &amp; Committing Block...
              </p>
            </div>
          )}

          {result && (
            <div className="receipt-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--emerald-500)', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircleIcon size={28} className="text-emerald" />
                <div>
                  <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>Ownership Successfully Reassigned</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Title for {result.propertyId} is now legally held by {result.newOwner}.
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
                      <th>Previous Owner</th>
                      <td><span className="owner-pill prev">{result.previousOwner}</span></td>
                    </tr>
                    <tr>
                      <th>New Owner</th>
                      <td><span className="owner-pill new">{result.newOwner}</span></td>
                    </tr>
                    <tr>
                      <th>Block Number</th>
                      <td>#{result.blockNumber}</td>
                    </tr>
                    <tr>
                      <th>Updated Deed Hash</th>
                      <td>
                        <code style={{ fontSize: '0.78rem', color: 'var(--cyan-400)' }}>
                          {result.newDocumentHash}
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
