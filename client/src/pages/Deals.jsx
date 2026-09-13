import { useState, useEffect } from 'react';
import { Receipt, Plus } from 'lucide-react';
import api from '../api';
import { useBusiness } from '../context/BusinessContext';

function Deals() {
  const { labels } = useBusiness();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // New Deal Form State
  const [customerId, setCustomerId] = useState('');
  const [itemId, setItemId] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [bookingAmount, setBookingAmount] = useState('25000');
  const [dealStatus, setDealStatus] = useState('Booked');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customItemName, setCustomItemName] = useState('');

  const fetchDeals = () => {
    setLoading(true);
    api('/api/deals')
      .then(data => {
        setDeals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDeals();
    api('/api/items')
      .then(v => {
        if (Array.isArray(v)) {
          setItems(v);
          if (v.length > 0 && !itemId) {
            setItemId(v[0]._id);
            if (!sellingPrice) setSellingPrice(v[0].price || v[0].selling_price || '');
          }
        }
      })
      .catch(console.error);

    api('/api/customers')
      .then(c => {
        if (Array.isArray(c)) {
          setCustomers(c);
          if (c.length > 0 && !customerId) setCustomerId(c[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  const handleItemChange = (vId) => {
    setItemId(vId);
    const chosen = items.find(v => v._id === vId);
    if (chosen && (chosen.price || chosen.selling_price)) {
      setSellingPrice(chosen.price || chosen.selling_price);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    const payload = {
      customer_id: customerId || (customers.length > 0 ? customers[0]._id : null),
      item_id: itemId || (items.length > 0 ? items[0]._id : null),
      vehicle_id: itemId || (items.length > 0 ? items[0]._id : null),
      customer_name: customCustomerName,
      customer_phone: customCustomerPhone,
      item_name: customItemName,
      car_name: customItemName,
      selling_price: Number(sellingPrice),
      booking_amount: Number(bookingAmount),
      deal_status: dealStatus
    };

    try {
      const deal = await api.post('/api/deals', payload);
      setShowModal(false);
      setCustomCustomerName('');
      setCustomCustomerPhone('');
      setCustomItemName('');
      fetchDeals();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.deal || 'Deal'} ${deal.deal_number || ''} recorded successfully!` }));
    } catch (err) {
      alert('Error creating deal: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/deals/${id}`, { deal_status: newStatus });
      fetchDeals();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Status updated to ${newStatus}` }));
    } catch (err) {
      alert('Error updating deal: ' + err.message);
    }
  };

  const totalRevenue = deals.reduce((acc, d) => acc + (d.selling_price || 0), 0);
  const totalTokens = deals.reduce((acc, d) => acc + (d.booking_amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>{labels.deal || 'Deals & Bookings'}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Track closed sales, advance deposits, and completed delivery contracts.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="premium-btn">
          <Plus size={16} /> New {labels.deal || 'Deal'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Value</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>₹{(totalRevenue / 100000).toFixed(2)}L</h3>
          <small style={{ color: 'var(--text-secondary)' }}>from all active & closed deals</small>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Advance Deposits</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#10b981' }}>₹{totalTokens.toLocaleString()}</h3>
          <small style={{ color: 'var(--text-secondary)' }}>tokens & advance held</small>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Completed</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {deals.filter(d => ['delivered', 'won', 'completed'].includes((d.status || d.deal_status || '').toLowerCase())).length}
          </h3>
          <small style={{ color: 'var(--text-secondary)' }}>closed sales contracts</small>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading {labels.deal?.toLowerCase() || 'deals'}...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>{labels.item || 'Item'}</th>
                  <th>{labels.customer || 'Customer'}</th>
                  <th>Total Value</th>
                  <th>Deposit / Token</th>
                  <th>Payment</th>
                  <th>Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(d => (
                  <tr key={d._id}>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>{d.item_id?.name || `${d.item_id?.brand || ''} ${d.item_id?.model || ''}` || d.car_name || d.item_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.item_id?.code || d.item_id?.stock_id || 'ID'}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.9rem' }}>{d.customer_id?.name || d.customer_name || 'Client'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.customer_id?.phone || d.customer_phone}</div>
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
                        <option value="booked">Booked</option>
                        <option value="completed">Completed / Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!['delivered', 'won', 'completed'].includes((d.status || d.deal_status || '').toLowerCase()) && (
                        <button 
                          onClick={() => handleUpdateStatus(d._id, 'completed')}
                          className="premium-btn" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                        >
                          Mark Completed
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
                        <p style={{ margin: 0, fontWeight: '500' }}>No {labels.deal?.toLowerCase() || 'deals'} recorded yet.</p>
                        <button onClick={() => setShowModal(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Record First {labels.deal || 'Deal'}
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
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Record New {labels.deal || 'Deal'}</h3>
            <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Target {labels.item || 'Item'} *</label>
                {items.length > 0 ? (
                  <select className="premium-input" value={itemId} onChange={e => handleItemChange(e.target.value)}>
                    {items.map(v => (
                      <option key={v._id} value={v._id}>{v.name || `${v.brand || ''} ${v.model || ''}`} - ₹{(v.price || v.selling_price || 0).toLocaleString()}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    required 
                    className="premium-input" 
                    placeholder={`e.g. Target ${labels.item || 'Item'} *`} 
                    value={customItemName} 
                    onChange={e => setCustomItemName(e.target.value)} 
                  />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select {labels.customer || 'Customer'} *</label>
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
                      placeholder={`${labels.customer || 'Customer'} Name *`} 
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Final Selling Value (₹) *</label>
                  <input required type="number" className="premium-input" placeholder="e.g. 850000" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Initial Deposit / Token (₹)</label>
                  <input required type="number" className="premium-input" placeholder="e.g. 25000" value={bookingAmount} onChange={e => setBookingAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Initial Status</label>
                <select className="premium-input" value={dealStatus} onChange={e => setDealStatus(e.target.value)}>
                  <option value="Booked">Booked (Token Received)</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Completed">Completed / Delivered</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Create {labels.deal || 'Deal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deals;
