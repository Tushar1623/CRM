import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Sparkles } from 'lucide-react';
import api from '../api';
import { useBusiness } from '../context/BusinessContext';

function AddLeadModal({ isOpen, onClose, onLeadCreated }) {
  const { labels, users } = useBusiness();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customItemMode, setCustomItemMode] = useState(false);
  const [interestedItem, setInterestedItem] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [budgetMax, setBudgetMax] = useState('1000000');
  const [source, setSource] = useState('Direct');
  const [priority, setPriority] = useState('Warm');
  const [timeline, setTimeline] = useState('Within 30 Days');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api('/api/items')
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setItems(data);
            setInterestedItem(data[0].name || `${data[0].brand || ''} ${data[0].model || ''}`);
          }
        })
        .catch(err => console.error(err));

      if (users && users.length > 0 && !assignedTo) {
        setAssignedTo(users[0].name);
      }
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const targetItem = customItemMode && customItem.trim() ? customItem.trim() : (interestedItem || 'General Requirement');

    try {
      const data = await api.post('/api/leads', {
        name,
        phone,
        email,
        interested_car: targetItem,
        title: targetItem,
        budget_max: budgetMax,
        source,
        priority,
        buying_timeline: timeline,
        assigned_to: assignedTo || (users[0]?.name || 'Sales Executive')
      });
      
      setName('');
      setPhone('');
      setEmail('');
      setCustomItem('');
      setCustomItemMode(false);
      onClose();

      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.lead || 'Lead'} captured successfully!` }));

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
              <Sparkles size={12} /> NEW {labels.lead?.toUpperCase() || 'LEAD'}
            </span>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Capture New {labels.lead || 'Lead'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Record {labels.customer?.toLowerCase() || 'customer'} details and match requirements.
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
                  {labels.customer || 'Customer'} Name *
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

          {/* Section 2: Requirement */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Interested {labels.item || 'Item'} *
              </label>
              <button 
                type="button" 
                onClick={() => setCustomItemMode(!customItemMode)}
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
                {customItemMode ? `← Pick from ${labels.item_plural || 'catalog'}` : '+ Type custom requirement'}
              </button>
            </div>

            {customItemMode ? (
              <input 
                className="premium-input" 
                placeholder={`Enter requirement or preferred ${labels.item?.toLowerCase() || 'item'}...`}
                value={customItem}
                onChange={e => setCustomItem(e.target.value)}
                autoFocus
              />
            ) : items.length > 0 ? (
              <select 
                className="premium-input" 
                value={interestedItem} 
                onChange={e => setInterestedItem(e.target.value)}
              >
                {items.map(it => (
                  <option key={it._id} value={it.name || `${it.brand || ''} ${it.model || ''}`}>
                    {it.name || `${it.brand || ''} ${it.model || ''}`} {it.price ? `- ₹${it.price.toLocaleString()}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                className="premium-input" 
                placeholder={`e.g. Preferred ${labels.item?.toLowerCase() || 'item'}`}
                value={interestedItem}
                onChange={e => setInterestedItem(e.target.value)}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Target Budget / Value (₹)
                </label>
                <input 
                  type="number" 
                  className="premium-input" 
                  placeholder="e.g. 1000000" 
                  value={budgetMax} 
                  onChange={e => setBudgetMax(e.target.value)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Source Channel
                </label>
                <select className="premium-input" value={source} onChange={e => setSource(e.target.value)}>
                  <option>Walk-in</option>
                  <option>Website Enquiry</option>
                  <option>Phone Call</option>
                  <option>WhatsApp</option>
                  <option>Social Media</option>
                  <option>Referral</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Priority Selector Pills */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Priority / Urgency
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

          {/* Section 4: Timeline & Assigned Agent (Dynamic from DB!) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Timeline
              </label>
              <select className="premium-input" value={timeline} onChange={e => setTimeline(e.target.value)}>
                {timelineOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Assigned Team Member
              </label>
              <select className="premium-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                {users && users.length > 0 ? (
                  users.map(u => (
                    <option key={u._id} value={u.name}>{u.name} ({u.role})</option>
                  ))
                ) : (
                  <option value="Amit Sharma">Amit Sharma (Admin)</option>
                )}
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
              {loading ? 'Saving...' : `+ Create ${labels.lead || 'Lead'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLeadModal;
