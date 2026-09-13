import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, MessageCircle, LayoutList, Kanban, ChevronRight } from 'lucide-react';
import AddLeadModal from '../components/AddLeadModal';
import api from '../api';
import { useBusiness } from '../context/BusinessContext';

const STAGES = [
  { key: 'new', label: 'New Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'test_drive', label: 'Appointment / Visit' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'booked', label: 'Booking' },
  { key: 'won', label: 'Closed / Won' }
];

function Leads() {
  const { labels } = useBusiness();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [showModal, setShowModal] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = `/api/leads?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await api(url);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  const handleStageChange = async (id, newStageKey) => {
    try {
      await api(`/api/leads/${id}`, {
        method: 'PUT',
        body: { status: newStageKey }
      });
      fetchLeads();
      const stageName = STAGES.find(s => s.key === newStageKey)?.label || newStageKey;
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.lead || 'Lead'} moved to ${stageName}` }));
    } catch (err) {
      console.error('Failed to change stage:', err);
    }
  };

  const handleAdvanceStage = (lead) => {
    const currentIndex = STAGES.findIndex(s => s.key === lead.status || s.label === lead.status);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      handleStageChange(lead._id, nextStage.key);
    }
  };

  const calculateAge = (dateString) => {
    if (!dateString) return '0d';
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}d`;
  };

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
            {labels.lead ? `${labels.lead}s` : 'Leads'} & Sales Pipeline
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Track, manage, and advance customer buying opportunities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* List / Board Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-panel)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <LayoutList size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: viewMode === 'board' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'board' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Kanban size={14} /> Board
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input 
              placeholder={`Search ${labels.lead?.toLowerCase() || 'leads'}, ${labels.item?.toLowerCase() || 'items'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="premium-input"
              style={{ width: '220px', paddingLeft: '2.2rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {viewMode === 'list' && (
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="premium-input"
              style={{ width: 'auto' }}
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              <option value="lost">Lost</option>
            </select>
          )}

          <button onClick={() => setShowModal(true)} className="premium-btn">
            <Plus size={16} /> Add {labels.lead || 'Lead'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading {labels.lead?.toLowerCase() || 'leads'}...</p>
      ) : viewMode === 'list' ? (
        /* ================= LIST VIEW ================= */
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>{labels.customer || 'Customer'}</th>
                  <th>Requirement ({labels.item || 'Item'})</th>
                  <th>Assigned Agent</th>
                  <th>Stage</th>
                  <th>Priority</th>
                  <th>Age</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(l => {
                  const cust = l.customer_id;
                  const phoneClean = (cust?.phone || l.customer_phone) ? String(cust?.phone || l.customer_phone).replace(/[^0-9]/g, '').slice(-10) : '';
                  const stageObj = STAGES.find(s => s.key === l.status?.toLowerCase()) || { label: l.status || 'New Lead' };

                  return (
                    <tr key={l._id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', fontWeight: '600' }}>{cust?.name || l.customer_name || 'Client'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cust?.phone || l.customer_phone}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{l.interested_car || l.title || 'Requirement'}</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Budget: {l.budget_max ? `₹${(l.budget_max / 100000).toFixed(1)}L` : 'Open'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem' }}>{l.assigned_to?.name || l.assigned_to_name || 'Executive'}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-primary">{stageObj.label}</span>
                      </td>
                      <td>
                        <span className={`priority-pill priority-${l.priority ? l.priority.toLowerCase() : 'warm'}`}>
                          {l.priority ? l.priority.toUpperCase() : 'WARM'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{calculateAge(l.createdAt)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {phoneClean && (
                            <>
                              <a href={`tel:${phoneClean}`} className="action-icon-btn" title="Call">
                                <Phone size={14} />
                              </a>
                              <a href={`https://wa.me/91${phoneClean}`} target="_blank" rel="noreferrer" className="action-icon-btn whatsapp" title="WhatsApp">
                                <MessageCircle size={14} />
                              </a>
                            </>
                          )}
                          <Link to={`/leads/${l._id}`} className="action-icon-btn" title="View details">
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No records found. Click "+ Add {labels.lead || 'Lead'}" to record an enquiry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= BOARD / KANBAN VIEW ================= */
        <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1.5rem' }}>
          {STAGES.map((stageObj, stageIdx) => {
            const stageLeads = leads.filter(l => l.status === stageObj.key || l.status === stageObj.label || (stageObj.key === 'test_drive' && (l.status === 'Test Drive Scheduled' || l.status === 'Appointment Scheduled')));
            const isWon = stageObj.key === 'won';
            const hasNextStage = stageIdx < STAGES.length - 1;

            return (
              <div 
                key={stageObj.key}
                className="glass-panel" 
                style={{ 
                  minWidth: '290px', 
                  maxWidth: '310px',
                  padding: '1.1rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  borderTop: isWon ? '3px solid #10b981' : '3px solid var(--accent-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {stageObj.label}
                  </h3>
                  <span style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {stageLeads.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '180px' }}>
                  {stageLeads.map(l => (
                    <div key={l._id} className="hover-lift" style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <Link to={`/leads/${l._id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
                          {l.customer_id?.name || l.customer_name || 'Prospect'}
                        </Link>
                        <span className={`priority-pill priority-${l.priority ? l.priority.toLowerCase() : 'warm'}`}>
                          {l.priority ? l.priority.toUpperCase() : 'WARM'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.85rem' }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {l.interested_car || l.title || 'Requirement'} 
                          {l.budget_max ? ` • ₹${(l.budget_max / 100000).toFixed(1)}L` : ''}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Agent: {l.assigned_to?.name || l.assigned_to_name || 'Sales Executive'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select 
                          value={l.status} 
                          onChange={(e) => handleStageChange(l._id, e.target.value)}
                          className="premium-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'var(--bg-panel)', flex: 1 }}
                        >
                          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          <option value="lost">Lost</option>
                        </select>
                        {hasNextStage && (
                          <button 
                            onClick={() => handleAdvanceStage(l)}
                            className="premium-btn" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                            title={`Advance to ${STAGES[stageIdx + 1]?.label}`}
                          >
                            Advance →
                          </button>
                        )}
                        <Link to={`/leads/${l._id}`} className="action-icon-btn" title="Open details">
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                      No {labels.lead?.toLowerCase() || 'leads'} in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      <AddLeadModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onLeadCreated={() => fetchLeads()} 
      />
    </div>
  );
}

export default Leads;
