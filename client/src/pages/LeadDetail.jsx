import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, MessageCircle, Calendar, Receipt, ChevronLeft, Clock, FileText, CheckSquare, CheckCircle2, X } from 'lucide-react';
import api from '../api';
import { useBusiness } from '../context/BusinessContext';

function LeadDetail() {
  const { id } = useParams();
  const { labels, users } = useBusiness();
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAppointment, setShowAppointment] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const [showDeal, setShowDeal] = useState(false);

  // Form states
  const [dealStatus, setDealStatus] = useState('Booked');
  const [selectedItem, setSelectedItem] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [followupTime, setFollowupTime] = useState('11:00 AM');
  const [followupNotes, setFollowupNotes] = useState('');

  const fetchLeadDetails = () => {
    api(`/api/leads/${id}`)
      .then(result => { 
        setData(result); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => {
    fetchLeadDetails();
    api('/api/items')
      .then(v => {
        if (Array.isArray(v)) {
          setItems(v);
          if (v.length > 0) setSelectedItem(v[0]._id);
        }
      })
      .catch(console.error);
  }, [id]);

  const handleStageChange = async (newStage) => {
    try {
      await api.put(`/api/leads/${id}`, { status: newStage });
      fetchLeadDetails();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.lead || 'Lead'} stage updated to ${newStage}` }));
    } catch (err) {
      alert('Error updating stage: ' + err.message);
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    try {
      const scheduledDateTime = new Date(`${followupDate} ${followupTime}`);
      await api.post('/api/followups', {
        lead_id: id,
        customer_id: data.lead.customer_id?._id || data.lead.customer_id,
        type: followupType,
        notes: followupNotes || 'Follow-up with client',
        scheduled_at: isNaN(scheduledDateTime.getTime()) ? new Date() : scheduledDateTime,
        assigned_to: data.lead.assigned_to
      });
      setShowFollowup(false);
      setFollowupNotes('');
      fetchLeadDetails();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Follow-up scheduled!' }));
    } catch (err) {
      alert('Error scheduling follow-up: ' + err.message);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const itemName = e.target.itemName?.value;
    try {
      await api.post('/api/appointments', {
        lead_id: id,
        customer_id: data.lead.customer_id?._id || data.lead.customer_id,
        item_id: selectedItem || (items.length > 0 ? items[0]._id : null),
        vehicle_id: selectedItem || (items.length > 0 ? items[0]._id : null),
        item_name: itemName || data.lead.interested_car || data.lead.title,
        car_name: itemName || data.lead.interested_car || data.lead.title,
        date: e.target.date.value,
        time: e.target.time.value,
        location: e.target.location?.value || 'Office / Showroom',
        status: 'Scheduled',
        type: labels.appointment || 'Appointment'
      });
      setShowAppointment(false);
      fetchLeadDetails();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.appointment || 'Appointment'} scheduled!` }));
    } catch (err) {
      alert('Error scheduling appointment: ' + err.message);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    const itemName = e.target.itemName?.value;
    try {
      const deal = await api.post('/api/deals', {
        lead_id: id,
        customer_id: data.lead.customer_id?._id || data.lead.customer_id,
        item_id: selectedItem || (items.length > 0 ? items[0]._id : null),
        vehicle_id: selectedItem || (items.length > 0 ? items[0]._id : null),
        item_name: itemName || data.lead.interested_car || data.lead.title,
        car_name: itemName || data.lead.interested_car || data.lead.title,
        deal_status: dealStatus,
        selling_price: Number(e.target.price.value),
        booking_amount: Number(e.target.booking?.value || 25000)
      });
      setShowDeal(false);
      fetchLeadDetails();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.deal || 'Deal'} ${deal.deal_number || ''} recorded successfully!` }));
    } catch (err) {
      alert('Error creating deal: ' + err.message);
    }
  };

  const handleCompleteFollowup = async (followupId) => {
    try {
      await api.put(`/api/followups/${followupId}`, { status: 'Completed' });
      fetchLeadDetails();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Follow-up marked completed!' }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading {labels.lead || 'Lead'} Profile...</div>;
  if (!data || !data.lead) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{labels.lead || 'Lead'} not found!</div>;

  const { lead, activities, followups, testDrives, deals } = data;
  const cust = lead.customer_id;
  const phoneClean = (cust?.phone || lead.customer_phone) ? String(cust?.phone || lead.customer_phone).replace(/[^0-9]/g, '').slice(-10) : '';

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/leads" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.9rem' }}>
            <ChevronLeft size={18} /> Back to {labels.lead ? `${labels.lead}s` : 'Leads'}
          </Link>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>{labels.lead || 'Lead'} #{lead.lead_number || ''}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowFollowup(true)} className="outline-btn">
            <CheckSquare size={16} /> Schedule Follow-up
          </button>
          <button onClick={() => setShowAppointment(true)} className="outline-btn">
            <Calendar size={16} /> Book {labels.appointment || 'Appointment'}
          </button>
          <button onClick={() => setShowDeal(true)} className="premium-btn">
            <Receipt size={16} /> Create {labels.deal || 'Deal'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Customer Details & Requirements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Customer Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700' }}>
                  {cust?.name ? cust.name.charAt(0).toUpperCase() : (lead.customer_name ? lead.customer_name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '700' }}>{cust?.name || lead.customer_name || 'Prospect'}</h3>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span>{cust?.phone || lead.customer_phone}</span>
                    <span>{cust?.email || lead.customer_email || 'No email registered'}</span>
                    {cust?.city && <span>• {cust.city}</span>}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select 
                  value={lead.status} 
                  onChange={e => handleStageChange(e.target.value)}
                  className="premium-input"
                  style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: '600' }}
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Appointment Scheduled">Appointment Scheduled</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Booked">Booked</option>
                  <option value="Closed / Won">Closed / Won</option>
                  <option value="Lost">Lost</option>
                </select>
                <span className={`priority-pill priority-${(lead.priority || 'warm').toLowerCase()}`}>{lead.priority || 'Warm'}</span>
              </div>
            </div>
            
            {/* Quick Contact Actions */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <a 
                href={(cust?.phone || lead.customer_phone) ? `tel:${cust?.phone || lead.customer_phone}` : '#'} 
                className="premium-btn" 
                style={{ flex: 1, backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textDecoration: 'none', justifyContent: 'center' }}
              >
                <Phone size={16} /> Call {cust?.phone || lead.customer_phone}
              </a>
              <a 
                href={phoneClean ? `https://wa.me/91${phoneClean}` : '#'} 
                target="_blank" 
                rel="noreferrer" 
                className="premium-btn" 
                style={{ flex: 1, backgroundColor: '#10b981', textDecoration: 'none', justifyContent: 'center' }}
              >
                <MessageCircle size={16} /> WhatsApp Message
              </a>
            </div>
          </div>

          {/* Requirements Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <FileText size={18} color="var(--text-secondary)" /> Enquiry & Requirements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Interested {labels.item || 'Item'}</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{lead.interested_car || lead.title || 'Not specified'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Budget / Target Value</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
                  {lead.budget_max ? `₹${Number(lead.budget_max).toLocaleString()}` : 'Flexible Budget'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Channel Source</p>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{lead.source || 'Direct'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Assigned Executive</p>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{lead.assigned_to?.name || lead.assigned_to_name || 'Sales Executive'}</p>
              </div>
            </div>
          </div>

          {/* Deals Associated with this Lead */}
          {deals && deals.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#10b981' }}>{labels.deal ? `${labels.deal}s` : 'Deals & Bookings'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {deals.map(d => (
                  <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{d.item_id?.name || `${d.item_id?.brand || ''} ${d.item_id?.model || ''}` || d.car_name || d.item_name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Value: ₹{d.selling_price?.toLocaleString()} • Deposit: ₹{d.booking_amount?.toLocaleString()}
                      </div>
                    </div>
                    <span className="status-badge badge-success">{d.deal_status || d.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments for this Lead */}
          {testDrives && testDrives.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700' }}>{labels.appointment_plural || 'Appointments'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {testDrives.map(td => (
                  <div key={td._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>{td.item_id?.name || td.item_name || td.car_name || 'Appointment'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {new Date(td.date || td.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {td.time}
                      </div>
                    </div>
                    <span className={`status-badge ${(td.status || '').toLowerCase() === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                      {td.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Scheduled Follow-ups & Activity Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Scheduled Follow-ups Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Scheduled Follow-ups</h3>
              <button onClick={() => setShowFollowup(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>
                + Add
              </button>
            </div>
            {(!followups || followups.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No follow-ups scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followups.map(f => (
                  <div key={f._id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="priority-pill priority-warm">{f.type}</span>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {new Date(f.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>{f.notes || 'Routine follow-up'}</p>
                    {f.status !== 'Completed' ? (
                      <button onClick={() => handleCompleteFollowup(f._id)} className="premium-btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'var(--success)' }}>
                        <CheckCircle2 size={12} /> Mark Done
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>✓ Completed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700' }}>Activity Audit Trail</h3>
            {(!activities || activities.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No activities logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activities.map(a => (
                  <div key={a._id || a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '0.2rem', color: 'var(--accent-primary)' }}><Clock size={14} /></div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>{a.description || a.title || a.subject}</p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'} • {a.user || 'System'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      {showFollowup && (
        <div className="modal-overlay" onClick={() => setShowFollowup(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Schedule Follow-up</h3>
              <button onClick={() => setShowFollowup(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFollowup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Channel *</label>
                <select className="premium-input" value={followupType} onChange={e => setFollowupType(e.target.value)}>
                  <option value="Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting / Visit</option>
                  <option value="Email">Email</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Date *</label>
                  <input required type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="premium-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Time Slot *</label>
                  <input required placeholder="e.g. 11:30 AM" value={followupTime} onChange={e => setFollowupTime(e.target.value)} className="premium-input" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Notes / Action Item</label>
                <input 
                  className="premium-input" 
                  placeholder="e.g. Follow up regarding proposal"
                  value={followupNotes}
                  onChange={e => setFollowupNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowFollowup(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointment && (
        <div className="modal-overlay" onClick={() => setShowAppointment(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Schedule {labels.appointment || 'Appointment'}</h3>
              <button onClick={() => setShowAppointment(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select {labels.item || 'Item'} *</label>
                {items.length > 0 ? (
                  <select className="premium-input" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                    {items.map(v => (
                      <option key={v._id} value={v._id}>{v.name || `${v.brand || ''} ${v.model || ''}`} ({v.code || v.stock_id}) - {v.status}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    name="itemName" 
                    className="premium-input" 
                    defaultValue={lead.interested_car || lead.title} 
                    placeholder={`Enter ${labels.item?.toLowerCase() || 'item'}`} 
                  />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Date *</label>
                  <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="premium-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Time Slot *</label>
                  <input required name="time" placeholder="e.g. 11:30 AM" defaultValue="11:30 AM" className="premium-input" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Location</label>
                <input name="location" defaultValue="Office / Showroom" className="premium-input" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAppointment(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Modal */}
      {showDeal && (
        <div className="modal-overlay" onClick={() => setShowDeal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Convert to {labels.deal || 'Deal'}</h3>
              <button onClick={() => setShowDeal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Target {labels.item || 'Item'} *</label>
                {items.length > 0 ? (
                  <select className="premium-input" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                    {items.map(v => (
                      <option key={v._id} value={v._id}>{v.name || `${v.brand || ''} ${v.model || ''}`} - ₹{(v.price || v.selling_price || 0).toLocaleString()}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    name="itemName" 
                    className="premium-input" 
                    defaultValue={lead.interested_car || lead.title} 
                    placeholder={`Enter ${labels.item?.toLowerCase() || 'item'}`} 
                  />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Agreed Value / Price (₹) *</label>
                  <input required name="price" type="number" defaultValue={lead.budget_max || 850000} className="premium-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Initial Token / Deposit (₹)</label>
                  <input name="booking" type="number" defaultValue="25000" className="premium-input" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Initial Status</label>
                <select className="premium-input" value={dealStatus} onChange={e => setDealStatus(e.target.value)}>
                  <option value="Booked">Booked (Deposit Received)</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Completed">Completed / Delivered</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowDeal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Confirm {labels.deal || 'Deal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadDetail;
