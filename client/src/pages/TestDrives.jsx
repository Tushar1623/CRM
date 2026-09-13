import { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';
import { useBusiness } from '../context/BusinessContext';

function TestDrives() {
  const { labels, users } = useBusiness();
  const [appointments, setAppointments] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [itemId, setItemId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('02:00 PM');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [customItemName, setCustomItemName] = useState('');

  const fetchAppointments = () => {
    setLoading(true);
    api('/api/appointments')
      .then(data => { 
        setAppointments(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => { 
    fetchAppointments();
    api('/api/items')
      .then(v => {
        if (Array.isArray(v)) {
          setItems(v);
          if (v.length > 0 && !itemId) setItemId(v[0]._id);
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

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    
    const payload = {
      customer_id: customerId || (customers.length > 0 ? customers[0]._id : null),
      item_id: itemId || (items.length > 0 ? items[0]._id : null),
      vehicle_id: itemId || (items.length > 0 ? items[0]._id : null),
      customer_name: customCustomerName,
      customer_phone: customCustomerPhone,
      item_name: customItemName,
      car_name: customItemName,
      date,
      time,
      status: 'Scheduled',
      type: labels.appointment || 'Appointment'
    };

    try {
      await api.post('/api/appointments', payload);
      setShowModal(false);
      setCustomCustomerName('');
      setCustomCustomerPhone('');
      setCustomItemName('');
      fetchAppointments();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.appointment || 'Appointment'} scheduled successfully!` }));
    } catch (err) {
      alert('Error scheduling: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/api/appointments/${id}`, { status: newStatus });
      fetchAppointments();
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Marked as ${newStatus}` }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>{labels.appointment_plural || 'Appointments'} Schedule</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Track all {labels.customer?.toLowerCase() || 'customer'} appointments, consultations, and trial visits.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="premium-btn">
          <Plus size={16} /> Schedule {labels.appointment || 'Appointment'}
        </button>
      </div>
      
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading {labels.appointment_plural?.toLowerCase() || 'appointments'}...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Appointment Time</th>
                  <th>{labels.customer || 'Customer'}</th>
                  <th>{labels.item || 'Item / Details'}</th>
                  <th>Executive</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(td => (
                  <tr key={td._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Clock size={16} color="var(--accent-primary)" />
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{new Date(td.date || td.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{td.time}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>{td.customer_id?.name || td.customer_name || 'Client'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{td.customer_id?.phone || td.customer_phone}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{td.item_id?.name || `${td.item_id?.brand || ''} ${td.item_id?.model || ''}` || td.car_name || td.item_name}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{td.item_id?.code || td.item_id?.stock_id || ''}</div>
                    </td>
                    <td>{td.employee_id?.name || td.employee_name || 'Sales Executive'}</td>
                    <td>
                      <span className={`status-badge ${(td.status || '').toLowerCase() === 'completed' ? 'badge-success' : (td.status || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                        {td.status ? td.status.toUpperCase() : 'SCHEDULED'}
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
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={36} color="var(--text-muted)" />
                        <p style={{ margin: 0, fontWeight: '500' }}>No {labels.appointment_plural?.toLowerCase() || 'appointments'} scheduled yet.</p>
                        <button onClick={() => setShowModal(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Book {labels.appointment || 'Appointment'}
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
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: '700' }}>Schedule {labels.appointment || 'Appointment'}</h3>
            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Target {labels.item || 'Item'} *</label>
                {items.length > 0 ? (
                  <select className="premium-input" value={itemId} onChange={e => setItemId(e.target.value)}>
                    {items.map(v => (
                      <option key={v._id} value={v._id}>{v.name || `${v.brand || ''} ${v.model || ''}`} ({v.code || v.stock_id})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    required 
                    className="premium-input" 
                    placeholder={`e.g. Preferred ${labels.item || 'Item'} *`}
                    value={customItemName} 
                    onChange={e => setCustomItemName(e.target.value)} 
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
