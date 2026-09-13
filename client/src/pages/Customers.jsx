import { useState, useEffect } from 'react';
import { Users, Phone, Mail, MapPin, Search, Plus, MessageCircle } from 'lucide-react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`http://localhost:3000/api/customers?search=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, phone: newPhone, email: newEmail, city: newCity })
    })
    .then(r => r.json())
    .then(() => {
      setShowAddModal(false);
      setNewName(''); setNewPhone(''); setNewEmail(''); setNewCity('');
      fetchCustomers();
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Customer Directory</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Manage all client records, enquiry histories, and contact points.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="premium-input"
              style={{ width: '260px', paddingLeft: '2.2rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button onClick={() => setShowAddModal(true)} className="premium-btn">
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading customers...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Active Leads</th>
                  <th>Deals</th>
                  <th style={{ textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem', fontWeight: '600' }}>{c.name}</strong>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer ID: {c._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{c.phone}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email || 'No email provided'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} /> {c.city || 'India'}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge badge-primary">{c.leadsCount || 1} Enquiry</span>
                    </td>
                    <td>
                      <span className="status-badge badge-success">{c.dealsCount || 0} Deals</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <a href={`tel:${c.phone}`} className="action-icon-btn" title="Call Customer">
                          <Phone size={14} />
                        </a>
                        <a href={`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="action-icon-btn whatsapp" title="Chat on WhatsApp">
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No customers found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Add Customer</h3>
            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Full Name *</label>
                <input required className="premium-input" placeholder="e.g. Ramesh Kumar" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Phone Number *</label>
                <input required type="tel" className="premium-input" placeholder="10-digit phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email Address</label>
                <input type="email" className="premium-input" placeholder="ramesh@gmail.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>City</label>
                <input className="premium-input" placeholder="e.g. Mumbai, Delhi, Bengaluru" value={newCity} onChange={e => setNewCity(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
