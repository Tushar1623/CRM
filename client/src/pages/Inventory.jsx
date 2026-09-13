import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, CarFront } from 'lucide-react';

function Inventory() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2021');
  const [fuel, setFuel] = useState('Petrol');
  const [transmission, setTransmission] = useState('Manual');
  const [kmDriven, setKmDriven] = useState('35000');
  const [price, setPrice] = useState('750000');
  const [status, setStatus] = useState('Available');

  const fetchVehicles = () => {
    setLoading(true);
    let url = `http://localhost:3000/api/vehicles?status=${statusFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => { 
        setVehicles(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => { 
    fetchVehicles(); 
    const handleUpdate = () => fetchVehicles();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, [search, statusFilter]);

  const resetForm = () => {
    setBrand(''); 
    setModel(''); 
    setYear('2021'); 
    setFuel('Petrol');
    setTransmission('Manual');
    setKmDriven('35000');
    setPrice('750000'); 
    setStatus('Available');
    setIsEditing(false); 
    setEditId(null); 
    setShowForm(false);
  };

  const handleSaveCar = (e) => {
    e.preventDefault();
    const payload = { 
      brand, 
      model, 
      year: Number(year), 
      fuel,
      transmission,
      km_driven: Number(kmDriven),
      selling_price: Number(price), 
      status 
    };
    
    const url = isEditing ? `http://localhost:3000/api/vehicles/${editId}` : 'http://localhost:3000/api/vehicles';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => { 
      resetForm(); 
      fetchVehicles();
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { 
        detail: isEditing ? `${payload.brand} ${payload.model} updated!` : `${payload.brand} ${payload.model} added to stock!` 
      }));
    });
  };

  const handleEditClick = (v) => {
    setIsEditing(true); 
    setEditId(v._id); 
    setShowForm(true);
    setBrand(v.brand); 
    setModel(v.model); 
    setYear(v.year); 
    setPrice(v.selling_price); 
    setFuel(v.fuel || 'Petrol');
    setTransmission(v.transmission || 'Manual');
    setKmDriven(v.km_driven || 30000);
    setStatus(v.status || 'Available');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this vehicle from inventory?')) {
      fetch(`http://localhost:3000/api/vehicles/${id}`, { method: 'DELETE' }).then(() => {
        fetchVehicles();
        window.dispatchEvent(new Event('crm-data-updated'));
        window.dispatchEvent(new CustomEvent('crm-toast', { detail: 'Vehicle removed from inventory.' }));
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return 'badge-success';
      case 'Sold': return 'badge-warning';
      case 'Reserved': return 'badge-primary';
      default: return 'badge-danger';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Vehicle Inventory</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Manage your dealership showroom cars, pricing, and stock status.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Search make, model, stock ID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="premium-input" 
              style={{ width: '250px', paddingLeft: '2.2rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="premium-input" 
            style={{ width: 'auto' }}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </select>

          <button onClick={() => setShowForm(!showForm)} className="premium-btn">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700' }}>
            {isEditing ? 'Edit Vehicle Details' : 'Add Vehicle to Inventory'}
          </h3>
          <form onSubmit={handleSaveCar} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 170px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Brand / Make *</label>
              <input required placeholder="e.g. Hyundai, Honda, Tata" value={brand} onChange={e => setBrand(e.target.value)} className="premium-input" />
            </div>
            <div style={{ flex: '1 1 170px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Model & Variant *</label>
              <input required placeholder="e.g. Creta SX, City VX" value={model} onChange={e => setModel(e.target.value)} className="premium-input" />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Year *</label>
              <input required type="number" placeholder="2021" value={year} onChange={e => setYear(e.target.value)} className="premium-input" />
            </div>
            <div style={{ flex: '1 1 110px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Fuel</label>
              <select value={fuel} onChange={e => setFuel(e.target.value)} className="premium-input">
                <option>Petrol</option>
                <option>Diesel</option>
                <option>CNG</option>
                <option>Electric</option>
              </select>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Transmission</label>
              <select value={transmission} onChange={e => setTransmission(e.target.value)} className="premium-input">
                <option>Manual</option>
                <option>Automatic</option>
              </select>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>KM Driven</label>
              <input type="number" placeholder="35000" value={kmDriven} onChange={e => setKmDriven(e.target.value)} className="premium-input" />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Selling Price (₹) *</label>
              <input required type="number" placeholder="Price in ₹" value={price} onChange={e => setPrice(e.target.value)} className="premium-input" />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Stock Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="premium-input">
                <option>Available</option>
                <option>Reserved</option>
                <option>Sold</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="premium-btn">
                {isEditing ? 'Save Changes' : 'Add Vehicle'}
              </button>
              <button type="button" onClick={resetForm} className="outline-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Specs</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                          <CarFront size={20} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{v.brand} {v.model}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Stock ID: {v.stock_id} • {v.year}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{v.fuel || 'Petrol'} • {v.transmission || 'Manual'}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.km_driven ? `${v.km_driven.toLocaleString()} km` : '35,000 km'}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        ₹{v.selling_price ? v.selling_price.toLocaleString() : 'N/A'}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(v.status)}`}>
                        {v.status || 'Available'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEditClick(v)} className="action-icon-btn" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(v._id)} className="action-icon-btn" style={{ color: 'var(--danger)' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <CarFront size={36} color="var(--text-muted)" />
                        <p style={{ margin: 0, fontWeight: '500' }}>No vehicles in inventory right now.</p>
                        <button onClick={() => setShowForm(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Add First Vehicle
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
    </div>
  );
}

export default Inventory;
