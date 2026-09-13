import { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';

function TestDrives() {
  const [testDrives, setTestDrives] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('02:00 PM');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customCarName, setCustomCarName] = useState('');

  const fetchTestDrives = () => {
    setLoading(true);
    api('/api/test-drives')
      .then(data => { 
        setTestDrives(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => { 
    fetchTestDrives();
    api('/api/vehicles')
      .then(v => {
        if (Array.isArray(v)) {
          setVehicles(v);
          if (v.length > 0 && !vehicleId) setVehicleId(v[0]._id);
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

  const handleCreateTestDrive = async (e) => {
    e.preventDefault();
    
    const payload = {
      customer_id: customerId || (customers.length > 0 ? customers[0]._id : null),
      vehicle_id: vehicleId || (vehicles.length > 0 ? vehicles[0]._id : null),
      customer_name: customCustomerName,
      customer_phone: customCustomerPhone,
      car_name: customCarName,
      date,
      time,
      status: 'Scheduled'
    };

    try {
      await api.post('/api/test-drives', payload);
      setShowModal(false);
      setCustomCustomerName('');
      setCustomCustomerPhone('');
      setCustomCarName('');
      fetchTestDrives();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Test drive scheduled successfully!' }));
    } catch (err) {
      alert('Error scheduling test drive: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/api/test-drives/${id}`, { status: newStatus });
      fetchTestDrives();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Test drive marked as ${newStatus}` }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Test Drive Schedule</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Track all customer showroom appointments and trial runs.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="premium-btn">
          <Plus size={16} /> Schedule Test Drive
        </button>
      </div>
      
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading test drives...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Appointment Time</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Executive</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testDrives.map(td => (
                  <tr key={td._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Clock size={16} color="var(--accent-primary)" />
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{new Date(td.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{td.time}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>{td.customer_id?.name || td.customer_name || 'Customer'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{td.customer_id?.phone || td.customer_phone}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{td.vehicle_id?.brand} {td.vehicle_id?.model || td.car_name}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{td.vehicle_id?.stock_id || 'STK'}</div>
                    </td>
                    <td>{td.employee_id?.name || td.employee_name || 'Sales Executive'}</td>
                    <td>
                      <span className={`status-badge ${(td.status || '').toLowerCase() === 'completed' ? 'badge-success' : (td.status || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                        {td.status ? td.status.replace(/_/g, ' ').toUpperCase() : 'SCHEDULED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {(td.status || '').toLowerCase() === 'scheduled' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(td._id, 'completed')}
                              className="premium-btn" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                            >
                              <CheckCircle size={13} /> Complete
                            </button>
                            <button 
                              onClick={() => handleStatusChange(td._id, 'cancelled')}
                              className="outline-btn" 
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {testDrives.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={36} color="var(--text-muted)" />
                        <p style={{ margin: 0, fontWeight: '500' }}>No test drives scheduled yet.</p>
                        <button onClick={() => setShowModal(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Book Appointment
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
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Schedule Test Drive</h3>
            <form onSubmit={handleCreateTestDrive} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select Vehicle *</label>
                {vehicles.length > 0 ? (
                  <select className="premium-input" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.brand} {v.model} ({v.stock_id})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    required 
                    className="premium-input" 
                    placeholder="e.g. Hyundai Creta, Honda City *" 
                    value={customCarName} 
                    onChange={e => setCustomCarName(e.target.value)} 
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Date *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="premium-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Time Slot *</label>
                  <input required placeholder="e.g. 03:00 PM" value={time} onChange={e => setTime(e.target.value)} className="premium-input" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="outline-btn">Cancel</button>
                <button type="submit" className="premium-btn">Schedule Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestDrives;
