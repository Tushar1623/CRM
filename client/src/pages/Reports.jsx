import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Car, CheckCircle } from 'lucide-react';

function Reports() {
  const [stats, setStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = () => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:3000/api/stats').then(r => r.json()),
      fetch('http://localhost:3000/api/deals').then(r => r.json())
    ])
    .then(([statsData, dealsData]) => {
      setStats(statsData);
      setDeals(Array.isArray(dealsData) ? dealsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchReportData();
    const handleUpdate = () => fetchReportData();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const pipeline = stats?.pipelineCounts || {};
  const totalLeads = stats?.totalLeads ?? 0;

  const funnelStages = [
    { name: 'New Inquiries', count: pipeline.New ?? 0, color: '#3b82f6' },
    { name: 'Contacted', count: pipeline.Contacted ?? 0, color: '#6366f1' },
    { name: 'Test Drive Scheduled', count: pipeline['Test drive'] ?? 0, color: '#f59e0b' },
    { name: 'Negotiation', count: pipeline.Negotiation ?? 0, color: '#ec4899' },
    { name: 'Booked / Won', count: (pipeline.Booked ?? 0) + (pipeline.Won ?? 0), color: '#10b981' }
  ];

  const amitDeals = deals.filter(d => (d.deal_status === 'Booked' || d.deal_status === 'Delivered'));
  const amitRevenue = amitDeals.reduce((sum, d) => sum + (d.selling_price || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Dealership Reports & Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Comprehensive breakdown of sales velocity, conversion funnel, and team performance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Sales Realized</p>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            ₹{stats && stats.monthlySales ? (stats.monthlySales / 100000).toFixed(2) : '0.00'}L
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Delivered & Booked vehicle transactions</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Lead-to-Sale Conversion</p>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {stats?.conversionRate || '—'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Industry benchmark: 15–20%</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Available Showroom Fleet</p>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats?.carsAvailable ?? 0} Cars
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ready for immediate test drive & booking</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
        {/* Sales Funnel Breakdown */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700' }}>Sales Funnel Conversion</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {funnelStages.map((stage) => {
              const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
              return (
                <div key={stage.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600' }}>{stage.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{stage.count} leads ({pct}%)</span>
                  </div>
                  <div style={{ height: '10px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(pct > 0 ? 8 : 0, pct)}%`, height: '100%', background: stage.color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Sales Executive Performance */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700' }}>Sales Executive Leaderboard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                  A
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>Amit Sharma</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Senior Sales Executive</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                  ₹{(amitRevenue / 100000).toFixed(1)}L
                </strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{amitDeals.length} Deals Closed</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                  R
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>Raj Malhotra</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sales Executive</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>₹0.0L</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>0 Deals Closed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
