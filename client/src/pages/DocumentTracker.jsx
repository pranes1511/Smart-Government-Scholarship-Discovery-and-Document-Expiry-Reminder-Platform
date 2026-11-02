import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const DocumentTracker = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Filter state
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD', 'EDIT', 'RENEW'
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Form input state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Income Certificate');
  const [hasExpiry, setHasExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');

  const documentTypes = [
    'Income Certificate',
    'Community Certificate',
    'Nativity Certificate',
    'Disability Certificate',
    'Previous Academic Marksheet',
    'Bonafide Certificate',
    'College Admission Allotment Letter',
    'Fee Structure Breakdown',
    'Bank Account Passbook Copy',
    'Other Student Certificate'
  ];

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await documentAPI.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openAddModal = (prefillName = '') => {
    setModalMode('ADD');
    setSelectedDoc(null);
    setDocName(prefillName || '');
    setDocType(prefillName ? 'Other Student Certificate' : 'Income Certificate');
    setHasExpiry(true);
    setExpiryDate('');
    setShowModal(true);
  };

  const openEditModal = (doc) => {
    setModalMode('EDIT');
    setSelectedDoc(doc);
    setDocName(doc.documentName);
    setDocType(doc.documentType || 'Other Student Certificate');
    setHasExpiry(!!doc.expiryDate);
    setExpiryDate(doc.expiryDate ? doc.expiryDate.split('T')[0] : '');
    setShowModal(true);
  };

  const openRenewModal = (doc) => {
    setModalMode('RENEW');
    setSelectedDoc(doc);
    setDocName(doc.documentName);
    setDocType(doc.documentType || 'Other Student Certificate');
    setHasExpiry(true);
    setExpiryDate('');
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!docName.trim()) {
      alert('Please enter a document name.');
      return;
    }

    try {
      const payload = {
        documentName: docName.trim(),
        documentType: docType,
        expiryDate: hasExpiry && expiryDate ? expiryDate : null
      };

      if (modalMode === 'ADD') {
        await documentAPI.addDocument(payload);
        setActionMsg({ type: 'success', text: `Document "${docName}" saved to tracker.` });
      } else if (modalMode === 'EDIT' || modalMode === 'RENEW') {
        await documentAPI.updateDocument(selectedDoc._id, payload);
        setActionMsg({
          type: 'success',
          text:
            modalMode === 'RENEW'
              ? `Document "${docName}" renewed! Expiry reminders have been rescheduled.`
              : `Document "${docName}" updated successfully.`
        });
      }

      setShowModal(false);
      fetchDocuments();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      alert(err.message || 'Failed to save document.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this document record? Linked reminders will be removed.')) {
      return;
    }

    try {
      await documentAPI.deleteDocument(id);
      setActionMsg({ type: 'success', text: 'Document record deleted.' });
      fetchDocuments();
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (filterStatus === 'All') return true;
    return doc.status === filterStatus;
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Header & Add Button */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-navy mb-1" style={{ color: 'var(--primary-navy)' }}>
              Document Tracker
            </h3>
            <p className="text-muted small mb-0">
              Track certificate validity and get automated renewal alerts.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-navy d-flex align-items-center gap-2 shadow-sm"
            onClick={() => openAddModal()}
          >
            <i className="bi bi-plus-circle"></i>
            <span>Add Document</span>
          </button>
        </div>

        {/* Privacy Notice Banner */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="card-body p-3 d-flex align-items-center gap-3">
            <div className="rounded-circle bg-success bg-opacity-10 text-success p-2">
              <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-bold text-dark small">Zero-Storage Policy</div>
              <div className="text-muted small">
                Only validity dates are tracked. No documents, files, or Aadhaar numbers are stored.
              </div>
            </div>
          </div>
        </div>

        {actionMsg.text && (
          <div className={`alert alert-${actionMsg.type} alert-dismissible fade show mb-4`} role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {actionMsg.text}
            <button type="button" className="btn-close" onClick={() => setActionMsg({ type: '', text: '' })}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {[
            { id: 'All', label: 'All' },
            { id: 'Valid', label: 'Valid' },
            { id: 'Expiring Soon', label: 'Expiring Soon' },
            { id: 'Expired', label: 'Expired' },
            { id: 'No Expiry Date', label: 'No Expiry' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-sm ${filterStatus === tab.id ? 'btn-primary-blue' : 'btn-light border'} fw-medium`}
              onClick={() => setFilterStatus(tab.id)}
            >
              {tab.label} ({tab.id === 'All' ? documents.length : documents.filter((d) => d.status === tab.id).length})
            </button>
          ))}
        </div>

        {/* Document Cards Grid */}
        {loading ? (
          <LoadingSpinner message="Loading your document register..." />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon="bi-file-earmark-lock"
            title="No Documents Registered"
            description="Add your first document (such as Income Certificate or Community Certificate) to receive automatic expiry reminders."
            actionLabel="Add Document"
            onAction={() => openAddModal()}
          />
        ) : (
          <div className="row g-4">
            {filteredDocs.map((doc) => (
              <div key={doc._id} className="col-xl-4 col-md-6">
                <DocumentCard
                  document={doc}
                  onEdit={openEditModal}
                  onRenew={openRenewModal}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add / Edit / Renew Document */}
        {showModal && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0 rounded-4">
                <div className="modal-header bg-navy text-white" style={{ backgroundColor: 'var(--primary-navy)' }}>
                  <h5 className="modal-title fw-bold">
                    {modalMode === 'ADD' && 'Add Document'}
                    {modalMode === 'EDIT' && 'Edit Document'}
                    {modalMode === 'RENEW' && `Renew: ${docName}`}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleModalSubmit}>
                  <div className="modal-body p-4">
                    {modalMode === 'RENEW' && (
                      <div className="alert alert-info small mb-3">
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Updating the expiry date will reset upcoming 30, 15, and 7-day reminders.
                      </div>
                    )}

                    {modalMode !== 'RENEW' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold">Document Type</label>
                          <select
                            className="form-select"
                            value={docType}
                            onChange={(e) => {
                              setDocType(e.target.value);
                              if (!docName || documentTypes.includes(docName)) {
                                setDocName(e.target.value);
                              }
                            }}
                          >
                            {documentTypes.map((dt) => (
                              <option key={dt} value={dt}>
                                {dt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold">
                            Document Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="e.g. Income Certificate"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="mb-3">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="hasExpirySwitch"
                          checked={hasExpiry}
                          onChange={(e) => setHasExpiry(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold small" htmlFor="hasExpirySwitch">
                          Document has an expiry date
                        </label>
                      </div>
                      <div className="text-muted small">
                        Uncheck for permanent certificates (e.g. 10th/12th Marksheet).
                      </div>
                    </div>

                    {hasExpiry && (
                      <div className="mb-3 p-3 bg-light rounded border">
                        <label className="form-label small fw-semibold">
                          Expiry Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          required={hasExpiry}
                        />
                        <div className="form-text small">
                          Reminders will trigger at 30, 15, and 7 days.
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-sm btn-navy">
                      {modalMode === 'RENEW' ? 'Update Expiry' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentTracker;
