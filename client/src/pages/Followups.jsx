import { useState, useEffect } from 'react';
import { Clock, Phone, MessageCircle, CheckCircle, Plus, X } from 'lucide-react';
import api from '../api';

function Followups() {
  const [followups, setFollowups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [type, setType] = useState('Call');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('Amit Sharma');

  const fetchFollowups = () => {
    setLoading(true);
    api(`/api/followups?filter=${filter}`)
      .then(data => {
        setFollowups(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFollowups();
    api('/api/customers')
      .then(c => {
        if (Array.isArray(c)) {
          setCustomers(c);
          if (c.length > 0 && !customerId) setCustomerId(c[0]._id);
        }
      })
      .catch(console.error);
  }, [filter]);

  const handleMarkCompleted = async (id) => {
    try {
      await api.put(`/api/followups/${id}`, { status: 'Completed' });
      fetchFollowups();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Follow-up marked as completed!' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    const scheduledDateTime = new Date(`${date} ${time}`);
    const finalDate = isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime;

    const payload = {
      customer_id: customerId || (customers.length > 0 ? customers[0]._id : null),
      customer_name: customName,
      customer_phone: customPhone,
      type,
      notes: notes || 'Scheduled follow-up',
      assigned_to: assignedTo,
      scheduled_at: finalDate
    };

    try {
      await api.post('/api/followups', payload);
      setShowModal(false);
      setCustomName('');
      setCustomPhone('');
      setNotes('');
      fetchFollowups();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Follow-up scheduled successfully!' }));
    } catch (err) {
      alert('Error scheduling follow-up: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Follow-ups</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Stay on top of scheduled calls, customer test drives, and showroom visits.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-panel)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {['all', 'pending', 'today'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  background: filter === tab ? 'var(--accent-primary)' : 'transparent',
                  color: filter === tab ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'all' ? 'All Follow-ups' : tab}
              </button>
            ))}
          </div>

          <button onClick={() => setShowModal(true)} className="premium-btn">
            <Plus size={16} /> Schedule Follow-up
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading follow-ups...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Scheduled Time</th>
                  <th>Customer</th>
                  <th>Type & Goal</th>
                  <th>Assigned Agent</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map(f => {
                  const lead = f.lead_id;
                  const cust = f.customer_id || lead?.customer_id;
                  const isOverdue = new Date(f.scheduled_at) < new Date() && f.status !== 'Completed';

                  return (
                    <tr key={f._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Clock size={16} color={isOverdue ? 'var(--danger)' : 'var(--text-secondary)'} />
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                              {new Date(f.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>{cust?.name || f.customer_name || 'Customer'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {lead?.interested_car ? `Interested in ${lead.interested_car}` : (cust?.phone || f.customer_phone)}
                        </div>
                      </td>
                      <td>
                        <span className="priority-pill priority-warm" style={{ display: 'inline-block', marginBottom: '0.3rem' }}>
                          {f.type ? f.type.replace(/_/g, ' ').toUpperCase() : 'CALL'}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{f.notes || 'Routine follow-up'}</p>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem' }}>{f.assigned_to?.name || f.assigned_to_name || (typeof f.assigned_to === 'string' ? f.assigned_to : 'Sales Executive')}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${(f.status || '').toLowerCase() === 'completed' ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                          {(f.status || '').toLowerCase() === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {(cust?.phone || f.customer_phone) && (
                            <>
                              <a href={`tel:${cust?.phone || f.customer_phone}`} className="action-icon-btn" title="Call">
                                <Phone size={14} />
                              </a>
                              <a href={`https://wa.me/91${String(cust?.phone || f.customer_phone).replace(/[^0-9]/g, '').slice(-10)}`} target="_blank" rel="noreferrer" className="action-icon-btn whatsapp" title="WhatsApp">
                                <MessageCircle size={14} />
                              </a>
                            </>
                          )}
                          {(f.status || '').toLowerCase() !== 'completed' && (
                            <button onClick={() => handleMarkCompleted(f._id)} className="premium-btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--success)' }}>
                              <CheckCircle size={13} /> Done
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {followups.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={36} color="var(--text-muted)" />
                        <p style={{ margin: 0, fontWeight: '500' }}>No pending follow-ups right now.</p>
                        <button onClick={() => setShowModal(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Schedule New Follow-up
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Schedule Follow-up</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateFollowup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Customer / Lead *</label>
                {customers.length > 0 ? (
                  <select className="premium-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input 
                      required 
                      className="premium-input" 
                      placeholder="Customer Name *" 
                      value={customName} 
                      onChange={e => setCustomName(e.target.value)} 
                    />
                    <input 
                      required 
                      type="tel"
                      className="premium-input" 
                      placeholder="Phone Number *" 
                      value={customPhone} 
                      onChange={e => setCustomPhone(e.target.value)} 
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Activity Type</label>
                  <select className="premium-input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Showroom Visit">Showroom Visit</option>
                    <option value="Test Drive">Test Drive Appointment</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Assign Agent</label>
                  <select className="premium-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                    <option value="Amit Sharma">Amit Sharma</option>
                    <option value="Raj Malhotra">Raj Malhotra</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Date *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="premium-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Time Slot *</label>
                  <input required placeholder="e.g. 11:30 AM" value={time} onChange={e => setTime(e.target.value)} className="premium-input" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Notes / Agenda</label>
                <input 
                  className="premium-input" 
                  placeholder="e.g. Confirm quotation and trade-in inspection" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Save Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Followups;
