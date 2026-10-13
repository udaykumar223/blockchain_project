import { useState } from 'react';
import { verifyDocument, fetchSampleDocBlob } from '../services/api';
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  FileTextIcon,
  CheckCircleIcon,
  DownloadIcon,
  CopyIcon,
  SparklesIcon,
} from '../components/Icons';
import SampleDocsBar from '../components/SampleDocsBar';

export default function VerifyDocument({ addToast }) {
  const [propertyId, setPropertyId] = useState('P101');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!propertyId.trim()) {
      addToast('error', 'Validation Error', 'Property ID is required');
      return;
    }
    if (!file) {
      addToast('error', 'Validation Error', 'Please select a deed PDF to verify');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const res = await verifyDocument(propertyId.trim(), file);
      setResult(res.data);
      if (res.data.isMatch) {
        addToast('success', 'Document Verified', `Document hash matches on-chain record for ${propertyId}`);
      } else if (res.data.result === 'PROPERTY_NOT_FOUND') {
        addToast('error', 'Not Found', `Property ${propertyId} does not exist on blockchain`);
      } else {
        addToast('error', 'Tamper Detected', `Hash mismatch! Document has been altered`);
      }
    } catch (err) {
      addToast('error', 'Verification Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (filename, propId = 'P101') => {
    try {
      setLoading(true);
      setPropertyId(propId);
      const blob = await fetchSampleDocBlob(filename);
      const sampleFile = new File([blob], filename, { type: 'application/pdf' });
      setFile(sampleFile);
      addToast('info', 'Sample Deed Loaded', `Loaded ${filename}`);

      // Auto-trigger verification with sample file
      const res = await verifyDocument(propId, sampleFile);
      setResult(res.data);
      if (res.data.isMatch) {
        addToast('success', 'Document Verified', `Original deed matches on-chain record!`);
      } else {
        addToast('error', 'Tamper Detected', `Tampered deed successfully caught by hash mismatch!`);
      }
    } catch (err) {
      addToast('error', 'Load Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div>
      <SampleDocsBar
        onSelectSample={(doc) => handleLoadSample(doc.filename, 'P101')}
        currentAction="verify"
      />

      <div className="page-header">
        <h1 className="page-title">
          <ShieldCheckIcon size={28} className="text-cyan" />
          <span>Cryptographic Deed Verification</span>
        </h1>
        <p className="page-subtitle">
          Verify digital land records against immutable Ethereum smart contract fingerprints using deterministic SHA-256.
        </p>
      </div>

      <div className="grid-2">
        {/* Verification Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Verification Input</h3>
            <div className="demo-shortcuts" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleLoadSample('deed_P101_ravi_original.pdf', 'P101')}
                title="Load genuine deed"
              >
                <CheckCircleIcon size={14} className="text-emerald" />
                <span>Test Original</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleLoadSample('deed_P101_tampered.pdf', 'P101')}
                title="Load modified deed to test tamper detection"
              >
                <AlertTriangleIcon size={14} className="text-rose" />
                <span>Test Tampered</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="verify-prop-id">
                Property Identifier (ID)
              </label>
              <input
                id="verify-prop-id"
                className="form-input"
                type="text"
                placeholder="e.g. P101"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Property Title Document (PDF)</label>
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
                  {file ? file.name : 'Click or Drag Deed PDF Here'}
                </div>
                <div className="file-upload-sub">
                  Strictly PDF format • Evaluated in volatile memory via SHA-256
                </div>
                {file && (
                  <span className="file-upload-name">
                    {(file.size / 1024).toFixed(1)} KB • Ready for cryptographic comparison
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-success btn-lg"
              type="submit"
              disabled={loading || !file}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Computing SHA-256 &amp; Querying EVM...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon size={18} />
                  <span>Run Cryptographic Verification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Verification Report</h3>
            {result && result.isMatch && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => window.print()}
              >
                <DownloadIcon size={14} />
                <span>Print Certificate</span>
              </button>
            )}
          </div>

          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheckIcon size={28} className="text-cyan" />
              </div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.4rem' }}>Ready for Verification</h4>
              <p style={{ fontSize: '0.88rem' }}>
                Enter a Property ID and upload a deed PDF or click one of the quick test buttons above to evaluate.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p style={{ marginTop: '1rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
                Querying Ethereum Smart Contract Ledger...
              </p>
            </div>
          )}

          {result && (
            <div className={`verification-card ${result.isMatch ? 'match' : result.result === 'PROPERTY_NOT_FOUND' ? 'not-found' : 'mismatch'}`}>
              <div className="verification-header">
                <div className="verification-header-icon">
                  {result.isMatch ? (
                    <CheckCircleIcon size={28} />
                  ) : result.result === 'PROPERTY_NOT_FOUND' ? (
                    <AlertTriangleIcon size={28} />
                  ) : (
                    <AlertTriangleIcon size={28} />
                  )}
                </div>
                <div>
                  <div className="verification-headline">
                    {result.isMatch
                      ? 'OFFICIAL TITLE VERIFIED'
                      : result.result === 'PROPERTY_NOT_FOUND'
                      ? 'PROPERTY UNREGISTERED'
                      : 'TAMPERING DETECTED!'}
                  </div>
                  <div className="verification-subline">
                    {result.isMatch
                      ? `Document matches registered on-chain fingerprint for Property ID: ${result.propertyId}`
                      : result.result === 'PROPERTY_NOT_FOUND'
                      ? `No record found on the blockchain for Property ID: ${result.propertyId}`
                      : `Cryptographic divergence detected. The deed has been altered or substituted.`}
                  </div>
                </div>
              </div>

              {result.result !== 'PROPERTY_NOT_FOUND' && (
                <div className="hash-comparison-box">
                  <div className="hash-row">
                    <div className="hash-title">Uploaded Document Digest (SHA-256)</div>
                    <div className={`hash-code ${result.isMatch ? 'match' : 'diff'}`}>
                      {result.calculatedHash}
                    </div>
                  </div>

                  <div className="hash-row">
                    <div className="hash-title">Smart Contract On-Chain Digest</div>
                    <div className={`hash-code ${result.isMatch ? 'match' : 'diff'}`}>
                      {result.storedHash}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Audit Status: <strong>{result.isMatch ? 'AUTHENTIC' : 'FRAUD / MISMATCH'}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => copyToClipboard(result.calculatedHash)}
                    >
                      <CopyIcon size={12} />
                      <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
