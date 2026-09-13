import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, ChevronRight, Search, Phone, MessageCircle } from 'lucide-react';
import AddLeadModal from '../components/AddLeadModal';

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    let url = `http://localhost:3000/api/leads?status=${statusFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => { 
        setLeads(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => { 
    fetchLeads(); 
  }, [search, statusFilter]);

  const calculateAge = (dateString) => {
    if (!dateString) return '0d';
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays}d`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Leads Pipeline</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Track, prioritize, and convert customer purchase enquiries.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Search leads, cars, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="premium-input"
              style={{ width: '240px', paddingLeft: '2.2rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="premium-input"
            style={{ width: 'auto' }}
          >
            <option value="All">All Stages</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Test Drive Scheduled">Test Drive Scheduled</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Booking">Booking</option>
            <option value="Sold / Won">Sold / Won</option>
          </select>

          <button onClick={() => setShowModal(true)} className="premium-btn">
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading leads...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle Requirement</th>
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
                  const phoneClean = cust?.phone ? cust.phone.replace(/[^0-9]/g, '') : '';

                  return (
                    <tr key={l._id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', fontWeight: '600' }}>{cust?.name || 'Unknown'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cust?.phone}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{l.interested_car || 'Open Requirement'}</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Budget: {l.budget_max ? `₹${(l.budget_max / 100000).toFixed(1)}L` : 'Open'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem' }}>{l.assigned_to || 'Amit Sharma'}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-primary">{l.status}</span>
                      </td>
                      <td>
                        <span className={`priority-pill priority-${l.priority ? l.priority.toLowerCase() : 'warm'}`}>
                          {l.priority || 'Warm'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{calculateAge(l.createdAt)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {cust?.phone && (
                            <>
                              <a href={`tel:${cust.phone}`} className="action-icon-btn" title="Call">
                                <Phone size={14} />
                              </a>
                              <a href={`https://wa.me/91${phoneClean}`} target="_blank" rel="noreferrer" className="action-icon-btn whatsapp" title="WhatsApp">
                                <MessageCircle size={14} />
                              </a>
                            </>
                          )}
                          <Link 
                            to={`/leads/${l._id}`} 
                            className="outline-btn" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Open <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No active leads found. Click "+ Add Lead" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddLeadModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onLeadCreated={() => fetchLeads()} 
      />
    </div>
  );
}

export default Leads;
