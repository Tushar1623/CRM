import { useState, useEffect } from 'react';
import { Receipt, CarFront, User, CheckCircle2, AlertCircle, Plus, IndianRupee } from 'lucide-react';

function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // New Deal Form State
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [bookingAmount, setBookingAmount] = useState('25000');
  const [dealStatus, setDealStatus] = useState('Booked');

  const fetchDeals = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/deals')
      .then(res => res.json())
      .then(data => {
        setDeals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customCarName, setCustomCarName] = useState('');

  useEffect(() => {
    fetchDeals();
    fetch('http://localhost:3000/api/vehicles')
      .then(r => r.json())
      .then(v => {
        if (Array.isArray(v)) {
          setVehicles(v);
          if (v.length > 0 && !vehicleId) {
            setVehicleId(v[0]._id);
            if (!sellingPrice) setSellingPrice(v[0].selling_price || '');
          }
        }
      })
      .catch(console.error);

    fetch('http://localhost:3000/api/customers')
      .then(r => r.json())
      .then(c => {
        if (Array.isArray(c)) {
          setCustomers(c);
          if (c.length > 0 && !customerId) setCustomerId(c[0]._id);
        }
      })
      .catch(console.error);

    const handleUpdate = () => fetchDeals();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const handleVehicleChange = (vId) => {
    setVehicleId(vId);
    const chosen = vehicles.find(v => v._id === vId);
    if (chosen && chosen.selling_price) {
      setSellingPrice(chosen.selling_price);
    }
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    const payload = {
      customer_id: customerId || (customers.length > 0 ? customers[0]._id : null),
      vehicle_id: vehicleId || (vehicles.length > 0 ? vehicles[0]._id : null),
      customer_name: customCustomerName,
      customer_phone: customCustomerPhone,
      car_name: customCarName,
      selling_price: sellingPrice,
      booking_amount: bookingAmount,
      deal_status: dealStatus
    };

    fetch('http://localhost:3000/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(deal => {
      setShowModal(false);
      setCustomCustomerName('');
      setCustomCustomerPhone('');
      setCustomCarName('');
      fetchDeals();
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Deal ${deal.deal_number || ''} recorded successfully!` }));
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    fetch(`http://localhost:3000/api/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_status: newStatus })
    }).then(() => {
      fetchDeals();
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Deal status updated to ${newStatus}` }));
    });
  };

  const totalRevenue = deals.reduce((acc, d) => acc + (d.selling_price || 0), 0);
  const totalTokens = deals.reduce((acc, d) => acc + (d.booking_amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Sales & Deals</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Track vehicle reservations, tokens received, and delivered cars.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="premium-btn">
          <Plus size={16} /> New Deal
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Deal Value</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>₹{(totalRevenue / 100000).toFixed(2)}L</h3>
          <small style={{ color: 'var(--text-secondary)' }}>from all active and closed deals</small>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Booking Tokens Held</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#10b981' }}>₹{totalTokens.toLocaleString()}</h3>
          <small style={{ color: 'var(--text-secondary)' }}>advance booking deposits</small>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Cars Delivered</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {deals.filter(d => (d.status || d.deal_status || '').toLowerCase() === 'delivered').length}
          </h3>
          <small style={{ color: 'var(--text-secondary)' }}>completed customer deliveries</small>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading deals...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Selling Price</th>
                  <th>Booking Token</th>
                  <th>Payment Status</th>
                  <th>Deal Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                          <CarFront size={18} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{d.vehicle_id?.brand} {d.vehicle_id?.model}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.vehicle_id?.stock_id || 'STK'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.9rem' }}>{d.customer_id?.name || 'Customer'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.customer_id?.phone}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>₹{d.selling_price ? d.selling_price.toLocaleString() : '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#10b981' }}>₹{d.booking_amount ? d.booking_amount.toLocaleString() : '0'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${d.payment_status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {d.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={(d.status || d.deal_status || 'booked').toLowerCase()}
                        onChange={e => handleUpdateStatus(d._id, e.target.value)}
                        className="premium-input"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="negotiation">Negotiation</option>
                        <option value="booking_pending">Booking Pending</option>
                        <option value="booked">Booked</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {(d.status || d.deal_status || '').toLowerCase() !== 'delivered' && (
                        <button 
                          onClick={() => handleUpdateStatus(d._id, 'delivered')}
                          className="premium-btn" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Receipt size={36} color="var(--text-muted)" />
                        <p style={{ margin: 0, fontWeight: '500' }}>No deals recorded yet.</p>
                        <button onClick={() => setShowModal(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Record First Deal
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
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Record New Deal</h3>
            <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select Vehicle *</label>
                {vehicles.length > 0 ? (
                  <select className="premium-input" value={vehicleId} onChange={e => handleVehicleChange(e.target.value)}>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.stock_id}) - ₹{v.selling_price?.toLocaleString()}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    required 
                    className="premium-input" 
                    placeholder="e.g. Honda City, Hyundai Creta *" 
                    value={customCarName} 
                    onChange={e => setCustomCarName(e.target.value)} 
                  />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select Customer *</label>
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
                      value={customCustomerName} 
                      onChange={e => setCustomCustomerName(e.target.value)} 
                    />
                    <input 
                      required 
                      type="tel"
                      className="premium-input" 
                      placeholder="Phone Number *" 
                      value={customCustomerPhone} 
                      onChange={e => setCustomCustomerPhone(e.target.value)} 
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Final Selling Price (₹) *</label>
                  <input required type="number" className="premium-input" placeholder="e.g. 850000" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Booking Token (₹)</label>
                  <input required type="number" className="premium-input" placeholder="e.g. 25000" value={bookingAmount} onChange={e => setBookingAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Initial Status</label>
                <select className="premium-input" value={dealStatus} onChange={e => setDealStatus(e.target.value)}>
                  <option value="Booked">Booked (Token Received)</option>
                  <option value="Booking Pending">Booking Pending</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;
