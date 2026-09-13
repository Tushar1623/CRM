import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, MessageCircle, Calendar, Receipt, ChevronLeft, User, Clock, FileText, CarFront, CheckCircle2 } from 'lucide-react';

function LeadDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const [dealStatus, setDealStatus] = useState('Booked');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const fetchLeadDetails = () => {
    fetch(`http://localhost:3000/api/leads/${id}`)
      .then(res => res.json())
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
    fetch('http://localhost:3000/api/vehicles')
      .then(r => r.json())
      .then(v => {
        if (Array.isArray(v)) {
          setVehicles(v);
          if (v.length > 0) setSelectedVehicle(v[0]._id);
        }
      })
      .catch(console.error);
  }, [id]);

  const handleCreateTestDrive = (e) => {
    e.preventDefault();
    const carName = e.target.carName?.value;
    fetch('http://localhost:3000/api/test-drives', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lead_id: id, 
        customer_id: data.lead.customer_id._id, 
        vehicle_id: selectedVehicle || (vehicles.length > 0 ? vehicles[0]._id : null),
        car_name: carName || data.lead.interested_car,
        date: e.target.date.value, 
        time: e.target.time.value, 
        status: 'Scheduled' 
      })
    }).then(() => { 
      setShowTestDrive(false); 
      fetchLeadDetails(); 
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Test drive scheduled successfully!' }));
    });
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    const carName = e.target.carName?.value;
    fetch('http://localhost:3000/api/deals', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lead_id: id, 
        customer_id: data.lead.customer_id._id, 
        vehicle_id: selectedVehicle || (vehicles.length > 0 ? vehicles[0]._id : null),
        car_name: carName || data.lead.interested_car,
        deal_status: dealStatus, 
        selling_price: e.target.price.value,
        booking_amount: e.target.booking?.value || 25000
      })
    }).then(res => res.json()).then(deal => { 
      setShowDeal(false); 
      fetchLeadDetails(); 
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Deal ${deal.deal_number || ''} recorded successfully!` }));
    });
  };

  const handleStageChange = (newStage) => {
    fetch(`http://localhost:3000/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStage })
    }).then(() => {
      fetchLeadDetails();
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Lead stage updated to ${newStage}` }));
    });
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Lead Profile...</div>;
  if (!data || !data.lead) return <div style={{ padding: '3rem', textAlign: 'center' }}>Lead not found!</div>;

  const { lead, activities, followups, testDrives, deals } = data;
  const cust = lead.customer_id;
  const phoneClean = cust?.phone ? cust.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/leads" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600', fontSize: '0.9rem' }}>
            <ChevronLeft size={18} /> Back to Leads
          </Link>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>Lead Profile</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowTestDrive(true)} className="outline-btn">
            <Calendar size={16} /> Schedule Test Drive
          </button>
          <button onClick={() => setShowDeal(true)} className="premium-btn">
            <Receipt size={16} /> Convert to Deal
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Customer Overview Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700' }}>
                  {cust?.name ? cust.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '700' }}>{cust?.name}</h3>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span>{cust?.phone}</span>
                    <span>{cust?.email || 'No email registered'}</span>
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
                  <option value="Test Drive Scheduled">Test Drive Scheduled</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Booking">Booking</option>
                  <option value="Sold / Won">Sold / Won</option>
                  <option value="Lost">Lost</option>
                </select>
                <span className={`priority-pill priority-${lead.priority.toLowerCase()}`}>{lead.priority}</span>
              </div>
            </div>
            
            {/* Direct Call and WhatsApp Actions */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <a 
                href={cust?.phone ? `tel:${cust.phone}` : '#'} 
                className="premium-btn" 
                style={{ flex: 1, backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textDecoration: 'none' }}
              >
                <Phone size={16} /> Direct Call ({cust?.phone})
              </a>
              <a 
                href={phoneClean ? `https://wa.me/91${phoneClean}` : '#'} 
                target="_blank" 
                rel="noreferrer" 
                className="premium-btn" 
                style={{ flex: 1, backgroundColor: '#10b981', textDecoration: 'none' }}
              >
                <MessageCircle size={16} /> WhatsApp Message
              </a>
            </div>
          </div>

          {/* Vehicle Requirements */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <FileText size={18} color="var(--text-secondary)" /> Customer Requirements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Interested Vehicle</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{lead.interested_car || 'Not specified'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Maximum Budget</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
                  {lead.budget_max ? `₹${lead.budget_max.toLocaleString()}` : 'Open Budget'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Buying Timeline</p>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{lead.buying_timeline}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Assigned Executive</p>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{lead.assigned_to}</p>
              </div>
            </div>
          </div>

          {/* Active Deals for this Lead */}
          {deals && deals.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#10b981' }}>Booked Deals</h3>
              {deals.map(d => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <strong>{d.vehicle_id?.brand} {d.vehicle_id?.model}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price: ₹{d.selling_price?.toLocaleString()} • Token: ₹{d.booking_amount?.toLocaleString()}</div>
                  </div>
                  <span className="status-badge badge-success">{d.deal_status}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Column: Scheduled Follow-ups & Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700' }}>Scheduled Follow-ups</h3>
            {(!followups || followups.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No follow-ups scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {followups.map(f => (
                  <div key={f._id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span className="priority-pill priority-warm">{f.type}</span>
                      <small style={{ color: 'var(--text-secondary)' }}>{new Date(f.scheduled_at).toLocaleDateString()}</small>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{f.notes || 'Routine follow-up call'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700' }}>Lead Audit History</h3>
            {(!activities || activities.length === 0) ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No activity logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activities.map(a => (
                  <div key={a._id || a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '0.2rem', color: 'var(--accent-primary)' }}><Clock size={14} /></div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>{a.description || a.subject}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.user || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Test Drive Modal */}
      {showTestDrive && (
        <div className="modal-overlay" onClick={() => setShowTestDrive(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Schedule Customer Test Drive</h3>
            <form onSubmit={handleCreateTestDrive} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select Test Drive Vehicle *</label>
                {vehicles.length > 0 ? (
                  <select className="premium-input" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.year}) - {v.status}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    name="carName" 
                    className="premium-input" 
                    defaultValue={lead.interested_car || 'Hyundai Creta'} 
                    placeholder="Enter vehicle model" 
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowTestDrive(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Schedule Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Modal */}
      {showDeal && (
        <div className="modal-overlay" onClick={() => setShowDeal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Convert Lead to Deal</h3>
            <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Vehicle to Book *</label>
                {vehicles.length > 0 ? (
                  <select className="premium-input" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.brand} {v.model} - ₹{v.selling_price?.toLocaleString()}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    name="carName" 
                    className="premium-input" 
                    defaultValue={lead.interested_car || 'Hyundai Creta'} 
                    placeholder="Enter vehicle model" 
                  />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Agreed Selling Price (₹) *</label>
                  <input required name="price" type="number" defaultValue={lead.budget_max || 850000} className="premium-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Booking Deposit (₹)</label>
                  <input name="booking" type="number" defaultValue="25000" className="premium-input" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Deal Status</label>
                <select className="premium-input" value={dealStatus} onChange={e => setDealStatus(e.target.value)}>
                  <option value="Booked">Booked (Token Received, Reserve Car)</option>
                  <option value="Booking Pending">Booking Pending</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Delivered">Delivered (Full Payment Received)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowDeal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Confirm Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadDetail;
