import { useState, useEffect } from 'react';
import { getSampleDocs } from '../services/api';
import { FileTextIcon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon } from './Icons';

export default function SampleDocsBar({ onSelectSample, currentAction = "verify" }) {
  const [samples, setSamples] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getSampleDocs()
      .then((res) => {
        if (res.data) setSamples(res.data);
      })
      .catch(() => {});
  }, []);

  if (!samples.length) return null;

  return (
    <div className="sample-bar-container">
      <div className="sample-bar-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="sample-bar-title">
          <SparklesIcon size={16} className="text-cyan animate-pulse" />
          <span>Interactive Demo Sandbox: <strong>Pre-Built Evaluation Deeds</strong></span>
        </div>
        <button type="button" className="sample-bar-toggle">
          {isOpen ? 'Hide Quick Deeds ▲' : 'Show Quick Deeds (1-Click Test) ▼'}
        </button>
      </div>

      {isOpen && (
        <div className="sample-bar-content">
          <p className="sample-bar-desc">
            Click any deed below to automatically download or inspect sample PDFs for Property <code>P101</code>:
          </p>
          <div className="sample-cards-grid">
            {samples.map((doc) => {
              const isTampered = doc.filename.includes('tampered');
              const isTransfer = doc.filename.includes('transfer');
              const isOriginal = doc.filename.includes('original');

              return (
                <div key={doc.filename} className={`sample-doc-card ${isTampered ? 'tampered' : isTransfer ? 'transfer' : 'original'}`}>
                  <div className="sample-doc-top">
                    {isTampered ? (
                      <AlertTriangleIcon size={18} className="text-rose" />
                    ) : isOriginal ? (
                      <CheckCircleIcon size={18} className="text-emerald" />
                    ) : (
                      <FileTextIcon size={18} className="text-indigo" />
                    )}
                    <span className="sample-doc-badge">
                      {isTampered ? 'Tampered Record' : isTransfer ? 'Title Transfer' : 'Original Deed'}
                    </span>
                  </div>

                  <div className="sample-doc-name">{doc.filename}</div>
                  <div className="sample-doc-hash">
                    SHA-256: <code>{doc.hash.slice(0, 10)}...{doc.hash.slice(-8)}</code>
                  </div>

                  <div className="sample-doc-actions">
                    <a
                      href={`/api/sample-docs/${doc.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-sample-action outline"
                    >
                      View PDF ↗
                    </a>
                    {onSelectSample && (
                      <button
                        type="button"
                        onClick={() => onSelectSample(doc)}
                        className="btn-sample-action fill"
                      >
                        Use in Form
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
