import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, CarFront, IndianRupee, Sparkles } from 'lucide-react';
import api from '../api';

function AddLeadModal({ isOpen, onClose, onLeadCreated }) {
  const [vehicles, setVehicles] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customCarMode, setCustomCarMode] = useState(false);
  const [interestedCar, setInterestedCar] = useState('Hyundai Creta');
  const [customCar, setCustomCar] = useState('');
  const [budgetMax, setBudgetMax] = useState('1000000');
  const [source, setSource] = useState('Walk-in');
  const [priority, setPriority] = useState('Warm');
  const [timeline, setTimeline] = useState('Within 30 Days');
  const [assignedTo, setAssignedTo] = useState('Amit Sharma');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api('/api/vehicles')
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setVehicles(data);
            setInterestedCar(`${data[0].brand} ${data[0].model}`);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const car = customCarMode && customCar.trim() ? customCar.trim() : interestedCar;

    try {
      const data = await api.post('/api/leads', {
        name,
        phone,
        email,
        interested_car: car,
        budget_max: budgetMax,
        source,
        priority,
        buying_timeline: timeline,
        assigned_to: assignedTo
      });
      
      setName('');
      setPhone('');
      setEmail('');
      setCustomCar('');
      setCustomCarMode(false);
      onClose();

      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Lead for ${data.customer_id?.name || 'Customer'} added successfully!` }));

      if (onLeadCreated) onLeadCreated(data);
    } catch (err) {
      alert('Error creating lead: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { label: 'Hot', desc: 'Ready buyer', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    { label: 'Warm', desc: 'Active search', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    { label: 'Cold', desc: 'Exploring', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }
  ];

  const timelineOptions = ['Immediately', 'Within 7 Days', 'Within 30 Days', '1-3 Months'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          padding: '2rem 2.25rem',
          maxWidth: '640px'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              <Sparkles size={12} /> NEW ENQUIRY
            </span>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Capture New Lead
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Record customer details and match them with showroom inventory.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="action-icon-btn" 
            style={{ width: '34px', height: '34px', borderRadius: '10px' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lead Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section 1: Customer Info */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Customer Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required 
                    className="premium-input" 
                    placeholder="e.g. Rahul Sharma" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ paddingLeft: '2.2rem' }}
                  />
                  <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Mobile Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required 
                    type="tel" 
                    className="premium-input" 
                    placeholder="10-digit number" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    style={{ paddingLeft: '2.2rem' }}
                  />
                  <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Email Address (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="premium-input" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={{ paddingLeft: '2.2rem' }}
                />
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Budget Requirements */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CarFront size={14} color="var(--accent-primary)" /> Interested Vehicle *
              </label>
              <button 
                type="button" 
                onClick={() => setCustomCarMode(!customCarMode)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--accent-primary)', 
                  fontSize: '0.78rem', 
                  cursor: 'pointer', 
                  fontWeight: '700',
                  padding: 0
                }}
              >
                {customCarMode ? '← Pick from inventory' : '+ Type custom vehicle'}
              </button>
            </div>

            {customCarMode ? (
              <input 
                className="premium-input" 
                placeholder="e.g. Toyota Fortuner 4x4, Honda City ZX..."
                value={customCar}
                onChange={e => setCustomCar(e.target.value)}
                autoFocus
              />
            ) : (
              <select 
                className="premium-input" 
                value={interestedCar} 
                onChange={e => setInterestedCar(e.target.value)}
              >
                {vehicles.map(v => (
                  <option key={v._id} value={`${v.brand} ${v.model}`}>
                    {v.brand} {v.model} ({v.year}) - ₹{(v.selling_price || v.asking_price)?.toLocaleString()}
                  </option>
                ))}
                <option value="Hyundai Creta">Hyundai Creta</option>
                <option value="Tata Nexon">Tata Nexon</option>
                <option value="Kia Seltos">Kia Seltos</option>
                <option value="Honda City">Honda City</option>
                <option value="Maruti Suzuki Swift">Maruti Suzuki Swift</option>
                <option value="Mahindra Thar">Mahindra Thar</option>
              </select>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Max Budget (₹)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="premium-input" 
                    placeholder="e.g. 1000000" 
                    value={budgetMax} 
                    onChange={e => setBudgetMax(e.target.value)} 
                    style={{ paddingLeft: '2.2rem' }}
                  />
                  <IndianRupee size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Lead Source
                </label>
                <select className="premium-input" value={source} onChange={e => setSource(e.target.value)}>
                  <option>Walk-in</option>
                  <option>Showroom Visit</option>
                  <option>Website Inquiry</option>
                  <option>WhatsApp</option>
                  <option>Phone Call</option>
                  <option>Facebook / Instagram</option>
                  <option>Google Ads</option>
                  <option>Referral</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Priority Selector Pills */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Buyer Urgency / Priority
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {priorityOptions.map(p => {
                const isSelected = priority === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPriority(p.label)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? p.bg : 'var(--bg-dark)',
                      color: isSelected ? p.color : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>{p.label}</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Timeline & Assigned Agent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Buying Timeline
              </label>
              <select className="premium-input" value={timeline} onChange={e => setTimeline(e.target.value)}>
                {timelineOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Assign Sales Executive
              </label>
              <select className="premium-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="Amit Sharma">Amit Sharma</option>
                <option value="Raj Malhotra">Raj Malhotra</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="outline-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="premium-btn"
            >
              {loading ? 'Adding Enquiry...' : '+ Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLeadModal;
