import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import api from '../api';
import { useBusiness } from '../context/BusinessContext';

function Inventory() {
  const { labels, business } = useBusiness();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Available');
  const [description, setDescription] = useState('');

  // Automotive specifics (if used_car)
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2022');
  const [fuel, setFuel] = useState('Petrol');
  const [transmission, setTransmission] = useState('Manual');
  const [kmDriven, setKmDriven] = useState('30000');

  const isAutomotive = business.business_type === 'used_car';

  const fetchItems = () => {
    setLoading(true);
    let url = `/api/items?status=${statusFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    api(url)
      .then(data => { 
        setItems(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => { 
    fetchItems(); 
  }, [search, statusFilter, business.business_type]);

  const resetForm = () => {
    setName('');
    setCategory('');
    setPrice('');
    setStatus('Available');
    setDescription('');
    setBrand(''); 
    setModel(''); 
    setYear('2022'); 
    setFuel('Petrol');
    setTransmission('Manual');
    setKmDriven('30000');
    setIsEditing(false); 
    setEditId(null); 
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalName = isAutomotive ? `${brand} ${model}`.trim() : name;
    const payload = { 
      name: finalName,
      category: category || (isAutomotive ? 'Used Car' : 'General'),
      price: Number(price),
      selling_price: Number(price),
      status,
      description,
      brand,
      model,
      year: Number(year),
      fuel,
      transmission,
      km_driven: Number(kmDriven)
    };

    try {
      if (isEditing) {
        await api.put(`/api/items/${editId}`, payload);
      } else {
        await api.post('/api/items', payload);
      }
      resetForm(); 
      fetchItems();
      window.dispatchEvent(new CustomEvent('crm-toast', { 
        detail: isEditing ? `${finalName} updated!` : `${finalName} added to catalog!` 
      }));
    } catch (err) {
      alert('Error saving item: ' + err.message);
    }
  };

  const handleEditClick = (it) => {
    setIsEditing(true); 
    setEditId(it._id); 
    setShowForm(true);
    setName(it.name || '');
    setCategory(it.category || '');
    setPrice(it.price || it.selling_price || '');
    setStatus(it.status || 'Available');
    setDescription(it.description || '');
    setBrand(it.brand || ''); 
    setModel(it.model || ''); 
    setYear(it.year || 2022); 
    setFuel(it.fuel || 'Petrol');
    setTransmission(it.transmission || 'Manual');
    setKmDriven(it.km_driven || 30000);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${labels.item?.toLowerCase() || 'item'}?`)) {
      try {
        await api.delete(`/api/items/${id}`);
        fetchItems();
        window.dispatchEvent(new CustomEvent('crm-toast', { detail: `${labels.item || 'Item'} deleted.` }));
      } catch (err) {
        alert('Error deleting: ' + err.message);
      }
    }
  };

  const getStatusBadge = (s) => {
    const st = (s || '').toLowerCase();
    switch (st) {
      case 'available': return 'badge-success';
      case 'sold': return 'badge-warning';
      case 'reserved':
      case 'booked': return 'badge-primary';
      default: return 'badge-warning';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>{labels.item_plural || 'Inventory & Catalog'}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Manage {labels.item_plural?.toLowerCase() || 'inventory'}, pricing, and current status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder={`Search ${labels.item_plural?.toLowerCase() || 'items'}...`}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="premium-input" 
              style={{ width: '240px', paddingLeft: '2.2rem' }}
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
            <Plus size={16} /> Add {labels.item || 'Item'}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700' }}>
            {isEditing ? `Edit ${labels.item || 'Item'}` : `Add New ${labels.item || 'Item'}`}
          </h3>
          <form onSubmit={handleSave} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {isAutomotive ? (
              <>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Brand / Make *</label>
                  <input required placeholder="e.g. Hyundai, Honda" value={brand} onChange={e => setBrand(e.target.value)} className="premium-input" />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Model & Variant *</label>
                  <input required placeholder="e.g. Creta SX, City ZX" value={model} onChange={e => setModel(e.target.value)} className="premium-input" />
                </div>
                <div style={{ flex: '1 1 90px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Year</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} className="premium-input" />
                </div>
                <div style={{ flex: '1 1 110px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Fuel</label>
                  <select value={fuel} onChange={e => setFuel(e.target.value)} className="premium-input">
                    <option>Petrol</option><option>Diesel</option><option>CNG</option><option>Electric</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 110px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Transmission</label>
                  <select value={transmission} onChange={e => setTransmission(e.target.value)} className="premium-input">
                    <option>Manual</option><option>Automatic</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: '2 1 240px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{labels.item || 'Item'} Title / Name *</label>
                  <input required placeholder={`e.g. Luxury 3BHK Apartment, React & Node Mastery, SEO Package...`} value={name} onChange={e => setName(e.target.value)} className="premium-input" />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Category / Type</label>
                  <input placeholder="e.g. Residential, Certification, Service" value={category} onChange={e => setCategory(e.target.value)} className="premium-input" />
                </div>
              </>
            )}

            <div style={{ flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Price / Value (₹) *</label>
              <input required type="number" placeholder="Price in ₹" value={price} onChange={e => setPrice(e.target.value)} className="premium-input" />
            </div>

            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="premium-input">
                <option>Available</option>
                <option>Reserved</option>
                <option>Sold</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="premium-btn">
                {isEditing ? 'Save Changes' : `Add ${labels.item || 'Item'}`}
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
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading {labels.item_plural?.toLowerCase() || 'catalog'}...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>{labels.item || 'Item'}</th>
                  <th>Specs / Details</th>
                  <th>Price / Value</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                          <Package size={20} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>{it.name || `${it.brand || ''} ${it.model || ''}`}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: {it.code || it.stock_id || 'ID'} {it.year ? `• ${it.year}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{it.category || (it.fuel ? `${it.fuel} • ${it.transmission}` : 'Standard')}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{it.km_driven ? `${it.km_driven.toLocaleString()} km` : (it.description || '')}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        ₹{(it.price || it.selling_price) ? (it.price || it.selling_price).toLocaleString() : 'N/A'}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(it.status)}`}>
                        {(it.status || 'Available').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEditClick(it)} className="action-icon-btn" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(it._id)} className="action-icon-btn" style={{ color: 'var(--danger)' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Package size={36} color="var(--text-muted)" />
                        <p style={{ margin: 0, fontWeight: '500' }}>No {labels.item_plural?.toLowerCase() || 'items'} in catalog right now.</p>
                        <button onClick={() => setShowForm(true)} className="premium-btn" style={{ marginTop: '0.5rem' }}>
                          <Plus size={15} /> Add First {labels.item || 'Item'}
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
