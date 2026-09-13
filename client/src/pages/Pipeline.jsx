import { useState, useEffect } from 'react';
import { CarFront, User, ChevronRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const stages = [
    'New Lead',
    'Contacted',
    'Test Drive Scheduled',
    'Negotiation',
    'Booking',
    'Sold / Won'
  ];

  const fetchLeads = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/leads')
      .then(res => res.json())
      .then(data => { 
        setLeads(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => { 
    fetchLeads(); 
    const handleUpdate = () => fetchLeads();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const handleStageChange = (id, newStage) => {
    fetch(`http://localhost:3000/api/leads/${id}`, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: newStage })
    }).then(() => {
      fetchLeads();
      window.dispatchEvent(new Event('crm-data-updated'));
      window.dispatchEvent(new CustomEvent('crm-toast', { detail: `Lead moved to ${newStage}` }));
    });
  };

  const handleAdvanceStage = (lead) => {
    const currentIndex = stages.indexOf(lead.status);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      handleStageChange(lead._id, nextStage);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Dealership Sales Pipeline</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Visual board of leads advancing through stages to closing.</p>
        </div>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading Pipeline...</p>
      ) : (
        <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', flex: 1, paddingBottom: '1.5rem' }}>
          {stages.map((stage, stageIdx) => {
            const stageLeads = leads.filter(l => l.status === stage);
            const isWon = stage === 'Sold / Won';
            const hasNextStage = stageIdx < stages.length - 1;
            
            return (
              <div 
                key={stage} 
                className="glass-panel" 
                style={{ 
                  minWidth: '290px', 
                  maxWidth: '310px',
                  padding: '1.1rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  borderTop: isWon ? '3px solid #10b981' : '3px solid var(--accent-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {stage}
                  </h3>
                  <span style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {stageLeads.length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                  {stageLeads.map(l => (
                    <div key={l._id} className="hover-lift" style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <Link to={`/leads/${l._id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
                          {l.customer_id?.name || 'Customer'}
                        </Link>
                        <span className={`priority-pill priority-${l.priority ? l.priority.toLowerCase() : 'warm'}`}>
                          {l.priority}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.85rem' }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CarFront size={13} color="var(--accent-primary)" /> {l.interested_car || 'Vehicle'} 
                          {l.budget_max ? ` • ₹${(l.budget_max / 100000).toFixed(1)}L` : ''}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={13} /> {l.assigned_to_name || l.assigned_to}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select 
                          value={l.status} 
                          onChange={(e) => handleStageChange(l._id, e.target.value)}
                          className="premium-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'var(--bg-panel)', flex: 1 }}
                        >
                          {stages.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="Lost">Lost</option>
                        </select>
                        {hasNextStage && (
                          <button 
                            onClick={() => handleAdvanceStage(l)}
                            className="premium-btn" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                            title={`Advance to ${stages[stageIdx + 1]}`}
                          >
                            Advance →
                          </button>
                        )}
                        <Link to={`/leads/${l._id}`} className="action-icon-btn" title="Open details">
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Pipeline;
