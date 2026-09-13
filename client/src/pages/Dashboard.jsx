import { useState, useEffect, useContext } from 'react';
import { Phone, Calendar, Clock, ChevronRight, MessageCircle, TrendingUp, IndianRupee, Car, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Dashboard({ onOpenAddLead }) {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [actions, setActions] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchDashboardData = () => {
    fetch('http://localhost:3000/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    fetch('http://localhost:3000/api/activities')
      .then(res => res.json())
      .then(data => setActivities(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch('http://localhost:3000/api/actions/today')
      .then(res => res.json())
      .then(data => setActions(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch('http://localhost:3000/api/test-drives')
      .then(res => res.json())
      .then(data => setTestDrives(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh when any lead, car, or deal is created/updated anywhere in the app
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const pipeline = stats?.pipelineCounts || {
    New: 0, Contacted: 0, Interested: 0, 'Test drive': 0, Negotiation: 0, Booked: 0, Won: 0
  };
  const totalLeadsCount = stats?.totalLeads || 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WELCOME</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
            Here's your sales pulse.
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            {totalLeadsCount > 0 ? `Welcome back, ${user?.name?.split(' ')[0] || 'Amit'}. Here is your dealership status.` : 'Your CRM is ready for its first customer enquiry.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/reports" className="outline-btn">
            View report <span>→</span>
          </Link>
          <button onClick={onOpenAddLead} className="premium-btn">
            + Add Lead
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <MetricCard 
          icon="◎" 
          iconColor="blue" 
          title="Total Leads" 
          value={stats ? stats.totalLeads : 0} 
          subtitle={stats?.totalLeads > 0 ? `${stats.totalLeads} active leads` : 'No leads yet'} 
        />
        <MetricCard 
          icon="◷" 
          iconColor="amber" 
          title="Follow-ups Today" 
          value={stats ? stats.followupsToday : 0} 
          subtitle={stats?.followupsToday > 0 ? `${stats.followupsToday} calls/visits due` : 'Nothing due today'} 
        />
        <MetricCard 
          icon="▣" 
          iconColor="orange" 
          title="Test Drives Today" 
          value={stats ? stats.testDrivesToday : 0} 
          subtitle={stats?.testDrivesToday > 0 ? `${stats.testDrivesToday} scheduled` : 'Nothing scheduled'} 
        />
        <MetricCard 
          icon="₹" 
          iconColor="green" 
          title="Monthly Sales" 
          value={stats && stats.monthlySales > 0 ? `₹${(stats.monthlySales / 100000).toFixed(2)}L` : '₹0'} 
          subtitle={stats && stats.monthlySales > 0 ? 'Delivered & booked' : 'No sales recorded'} 
        />
      </div>

      {/* Main Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Today's Actions & Scheduled Drives */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Today's Actions */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAY</p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Follow-ups <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{actions.length}</span></h3>
              </div>
              <Link to="/follow-ups" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                View all →
              </Link>
            </div>
            
            {actions.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0 0 0.4rem 0', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Nothing due today</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Your CRM is ready for its first customer enquiry.</p>
                <button onClick={onOpenAddLead} className="outline-btn" style={{ marginTop: '1rem' }}>
                  + Create First Lead
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {actions.map((act) => (
                  <div key={act.id} className="hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', width: '70px', fontWeight: '600' }}>{act.time}</span>
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block' }}>{act.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{act.action} • {act.car}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`priority-pill priority-${act.priority.toLowerCase()}`}>{act.priority}</span>
                      {act.phone && (
                        <>
                          <a href={`tel:${act.phone}`} className="action-icon-btn" title="Call">
                            <Phone size={13} />
                          </a>
                          <a href={`https://wa.me/91${act.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="action-icon-btn whatsapp" title="WhatsApp">
                            <MessageCircle size={13} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Scheduled Test Drives */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SCHEDULE</p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Upcoming Test Drives</h3>
              </div>
              <Link to="/test-drives" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                Calendar →
              </Link>
            </div>

            {testDrives.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>NO APPOINTMENTS</strong>
                <span style={{ fontSize: '0.85rem' }}>Schedule a test drive from a lead or the calendar.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {testDrives.slice(0, 3).map(td => (
                  <div key={td._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{td.customer_id?.name || 'Customer'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {td.vehicle_id?.brand} {td.vehicle_id?.model} • {td.time}
                      </div>
                    </div>
                    <span className={`status-badge ${td.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>
                      {td.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Pipeline Overview & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Dynamic Pipeline Overview */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>PIPELINE</p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Sales Pipeline</h3>
              </div>
              <Link to="/pipeline" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                View board →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <PipelineBar label="New" count={pipeline.New || 0} total={totalLeadsCount} color="#3b82f6" />
              <PipelineBar label="Contacted" count={pipeline.Contacted || 0} total={totalLeadsCount} color="#6366f1" />
              <PipelineBar label="Interested" count={pipeline.Interested || 0} total={totalLeadsCount} color="#06b6d4" />
              <PipelineBar label="Test drive" count={pipeline['Test drive'] || 0} total={totalLeadsCount} color="#f59e0b" />
              <PipelineBar label="Negotiation" count={pipeline.Negotiation || 0} total={totalLeadsCount} color="#ec4899" />
              <PipelineBar label="Won" count={pipeline.Won || 0} total={totalLeadsCount} color="#10b981" />
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Conversion rate</span>
                <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>from all leads this month</small>
              </div>
              <strong style={{ fontSize: '1.2rem', color: totalLeadsCount > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                {stats?.conversionRate || '—'}
              </strong>
            </div>
          </div>

          {/* Real Recent Activities */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1rem 0' }}>Recent Activity</h3>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>No activity yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activities.slice(0, 5).map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                      <Clock size={14} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '500' }}>{act.subject}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.date} • {act.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
}

const MetricCard = ({ icon, iconColor, title, value, subtitle }) => {
  const colorMap = {
    blue: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
    orange: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
    green: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
  };
  const theme = colorMap[iconColor] || colorMap.blue;

  return (
    <div className="glass-panel hover-lift" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 'bold' }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.25rem 0', fontWeight: '600' }}>
          {title}
        </h4>
        <p style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {value}
        </p>
        <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{subtitle}</small>
      </div>
    </div>
  );
};

const PipelineBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
        <span>{label}</span>
        <strong style={{ fontWeight: '600' }}>{count}</strong>
      </div>
      <div className="pipe-bar-track">
        <div className="pipe-bar-fill" style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%`, background: color }} />
      </div>
    </div>
  );
};

export default Dashboard;
