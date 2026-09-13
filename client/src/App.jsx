import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Users, CarFront, Search, ChevronDown, Plus, LogOut, 
  Calendar, CheckSquare, Receipt, CheckCircle, Building2, Briefcase, GraduationCap 
} from 'lucide-react';
import { useContext, useState, useEffect, useRef } from 'react';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import TestDrives from './pages/TestDrives';
import Followups from './pages/Followups';
import Deals from './pages/Deals';
import AddLeadModal from './components/AddLeadModal';
import api from './api';
import './index.css';

// Toast Notification Helper
export const showToast = (message) => {
  window.dispatchEvent(new CustomEvent('crm-toast', { detail: message }));
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Motorwise CRM...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    const handleToast = (e) => {
      setToastMessage(e.detail);
      setTimeout(() => setToastMessage(null), 3500);
    };
    window.addEventListener('crm-toast', handleToast);
    return () => window.removeEventListener('crm-toast', handleToast);
  }, []);

  return (
    <AuthProvider>
      <BusinessProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout openAddLead={() => setIsAddLeadOpen(true)} />
                <AddLeadModal 
                  isOpen={isAddLeadOpen} 
                  onClose={() => setIsAddLeadOpen(false)} 
                  onLeadCreated={() => {
                    showToast('Lead captured successfully!');
                    window.dispatchEvent(new Event('lead-created'));
                  }} 
                />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div style={styles.toast}>
            <CheckCircle size={16} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </BusinessProvider>
    </AuthProvider>
  );
}

function MainLayout({ openAddLead }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header openAddLead={openAddLead} />
        <div style={styles.contentArea}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 2rem' }}>
            <Routes>
              <Route path="/" element={<Dashboard onOpenAddLead={openAddLead} />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/follow-ups" element={<Followups />} />
              <Route path="/test-drives" element={<TestDrives />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ openAddLead }) {
  const { user, logout } = useContext(AuthContext);
  const { business, switchTemplate, templates, labels } = useBusiness();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const businessRef = useRef(null);
  const navigate = useNavigate();

  // Click outside to dismiss search results, business menu, and user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (businessRef.current && !businessRef.current.contains(e.target)) {
        setShowBusinessMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      api(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(data => setSearchResults(data))
        .catch(console.error);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const templateIcons = {
    used_car: '🚗',
    real_estate: '🏢',
    education: '🎓',
    service: '💼',
    general_sales: '📈'
  };

  return (
    <header style={styles.header}>
      {/* Live Search Bar */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <div style={styles.searchBar}>
          <Search size={17} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder={`Search ${labels.customer?.toLowerCase() || 'contact'}, phone, ${labels.item?.toLowerCase() || 'item'}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput} 
          />
        </div>

        {/* Live Search Dropdown Results */}
        {searchResults && (
          <div className="glass-panel" style={styles.searchResultsDropdown}>
            {searchResults.leads?.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>{labels.lead || 'Leads'}</p>
                {searchResults.leads.map(l => (
                  <div 
                    key={l._id} 
                    onClick={() => { setSearchQuery(''); setSearchResults(null); navigate(`/leads/${l._id}`); }}
                    style={styles.searchItem}
                  >
                    <strong>{l.customer_id?.name || l.customer_name}</strong> • {l.interested_car || l.title} ({l.status})
                  </div>
                ))}
              </div>
            )}

            {(searchResults.items?.length > 0 || searchResults.vehicles?.length > 0) && (
              <div style={{ padding: '0.75rem 1rem' }}>
                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>{labels.item_plural || 'Inventory'}</p>
                {(searchResults.items || searchResults.vehicles).map(v => (
                  <div 
                    key={v._id} 
                    onClick={() => { setSearchQuery(''); setSearchResults(null); navigate('/inventory'); }}
                    style={styles.searchItem}
                  >
                    <strong>{v.name || `${v.brand || ''} ${v.model || ''}`}</strong> • {v.code || v.stock_id} (₹{(v.price || v.selling_price || 0).toLocaleString()})
                  </div>
                ))}
              </div>
            )}

            {searchResults.leads?.length === 0 && (!searchResults.items || searchResults.items.length === 0) && (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No records match "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={styles.headerActions}>
        {/* Industry Template Switcher */}
        <div ref={businessRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            className="outline-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: '700', borderRadius: '8px' }}
            title="Switch Business Type"
          >
            <span>{templateIcons[business.business_type] || '🚗'}</span>
            <span>{business.name || 'Business Template'}</span>
            <ChevronDown size={14} />
          </button>

          {showBusinessMenu && (
            <div className="glass-panel" style={styles.templateMenu}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SELECT BUSINESS TEMPLATE
                </p>
                <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Dynamically transforms terminology & modules</small>
              </div>
              <div style={{ padding: '0.4rem' }}>
                {Object.entries(templates).map(([key, tmpl]) => {
                  const isSelected = business.business_type === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        switchTemplate(key);
                        setShowBusinessMenu(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem',
                        fontWeight: isSelected ? '700' : '500',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span>{templateIcons[key] || '📋'}</span>
                        <span>{tmpl.name}</span>
                      </span>
                      {isSelected && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Global Add Lead Modal Trigger */}
        <button onClick={openAddLead} className="premium-btn">
          <Plus size={16} /> Add {labels.lead || 'Lead'}
        </button>
        
        {/* User Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div style={styles.userProfile} onClick={() => setShowDropdown(!showDropdown)}>
            <div style={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name || 'Amit Sharma'}</span>
              <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role || 'Admin'}</small>
            </div>
            <ChevronDown size={14} color="var(--text-secondary)" />
          </div>

          {showDropdown && (
            <div className="glass-panel" style={styles.dropdown}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>{user?.name}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
              <button onClick={logout} style={styles.dropdownItem}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const location = useLocation();
  const { business, labels, modules } = useBusiness();
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return styles.activeNavItem;
    if (path !== '/' && location.pathname.startsWith(path)) return styles.activeNavItem;
    return {};
  };

  const businessTypeBadge = {
    used_car: 'USED CARS',
    real_estate: 'REAL ESTATE',
    education: 'ACADEMICS',
    service: 'SERVICES',
    general_sales: 'B2B SALES'
  }[business.business_type] || 'BUSINESS CRM';

  return (
    <aside style={styles.sidebar}>
      {/* Brand logo */}
      <div style={styles.logoArea}>
        <div style={styles.logoIcon}>
          {business.business_type === 'real_estate' ? <Building2 size={20} /> :
           business.business_type === 'education' ? <GraduationCap size={20} /> :
           business.business_type === 'service' ? <Briefcase size={20} /> : 'M'}
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
            {business.name || 'Motorwise CRM'}
          </h2>
          <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            {businessTypeBadge}
          </div>
        </div>
      </div>

      <nav style={styles.nav}>
        <div style={styles.navSection}>OVERVIEW</div>
        <Link to="/" style={{ ...styles.navItem, ...isActive('/') }}>
          <LayoutGrid size={17} /> Dashboard
        </Link>
        
        <div style={styles.navSection}>SALES & PIPELINE</div>
        <Link to="/leads" style={{ ...styles.navItem, ...isActive('/leads') }}>
          <Users size={17} /> {labels.lead ? `${labels.lead}s` : 'Leads'}
        </Link>
        <Link to="/follow-ups" style={{ ...styles.navItem, ...isActive('/follow-ups') }}>
          <CheckSquare size={17} /> Follow-ups
        </Link>
        
        {modules.appointments !== false && (
          <Link to="/test-drives" style={{ ...styles.navItem, ...isActive('/test-drives') }}>
            <Calendar size={17} /> {labels.appointment_plural || 'Appointments'}
          </Link>
        )}
        
        <div style={styles.navSection}>CATALOG & SALES</div>
        {modules.inventory !== false && (
          <Link to="/inventory" style={{ ...styles.navItem, ...isActive('/inventory') }}>
            <CarFront size={17} /> {labels.item_plural || 'Inventory'}
          </Link>
        )}
        
        {modules.deals !== false && (
          <Link to="/deals" style={{ ...styles.navItem, ...isActive('/deals') }}>
            <Receipt size={17} /> {labels.deal || 'Deals & Bookings'}
          </Link>
        )}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: { 
    width: '260px', 
    backgroundColor: 'var(--sidebar-bg)', 
    display: 'flex', 
    flexDirection: 'column', 
    borderRight: '1px solid var(--border-color)', 
    zIndex: 10,
    overflowY: 'auto'
  },
  logoArea: { 
    padding: '1.25rem 1.25rem', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.85rem', 
    borderBottom: '1px solid var(--border-color)' 
  },
  logoIcon: { 
    width: '38px', 
    height: '38px', 
    borderRadius: '8px', 
    background: 'var(--accent-brand)', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '800', 
    fontSize: '1.2rem',
    flexShrink: 0
  },
  nav: { 
    padding: '1.25rem 0.85rem', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.2rem' 
  },
  navSection: { 
    fontSize: '0.7rem', 
    fontWeight: '700', 
    color: 'var(--text-muted)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.08em', 
    marginTop: '1.2rem', 
    marginBottom: '0.4rem', 
    paddingLeft: '0.75rem' 
  },
  navItem: { 
    padding: '0.6rem 0.85rem', 
    borderRadius: '8px', 
    color: 'var(--text-secondary)', 
    textDecoration: 'none', 
    transition: 'all 0.15s ease', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    fontWeight: '600', 
    fontSize: '0.88rem' 
  },
  activeNavItem: { 
    backgroundColor: 'rgba(59, 130, 246, 0.15)', 
    color: 'var(--accent-primary)' 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '1rem 2rem', 
    borderBottom: '1px solid var(--border-color)', 
    backgroundColor: 'var(--bg-panel)' 
  },
  searchBar: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.6rem', 
    backgroundColor: 'var(--bg-dark)', 
    padding: '0.55rem 1rem', 
    borderRadius: '8px', 
    border: '1px solid var(--border-color)', 
    width: '380px' 
  },
  searchInput: { 
    border: 'none', 
    backgroundColor: 'transparent', 
    color: 'var(--text-primary)', 
    outline: 'none', 
    width: '100%', 
    fontSize: '0.88rem', 
    fontFamily: 'var(--font-main)' 
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    width: '420px',
    zIndex: 100,
    maxHeight: '380px',
    overflowY: 'auto'
  },
  searchItem: {
    padding: '0.5rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.84rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'background 0.15s ease',
    marginTop: '0.2rem'
  },
  headerActions: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1.25rem' 
  },
  templateMenu: {
    position: 'absolute',
    top: '110%',
    right: 0,
    width: '280px',
    zIndex: 50,
    boxShadow: 'var(--shadow-lg)'
  },
  userProfile: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.65rem', 
    cursor: 'pointer', 
    paddingLeft: '1.25rem', 
    borderLeft: '1px solid var(--border-color)' 
  },
  avatar: { 
    width: '34px', 
    height: '34px', 
    borderRadius: '50%', 
    background: 'var(--accent-primary)', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '700', 
    fontSize: '0.9rem' 
  },
  dropdown: { 
    position: 'absolute', 
    top: '100%', 
    right: 0, 
    marginTop: '0.5rem', 
    width: '220px', 
    zIndex: 50 
  },
  dropdownItem: { 
    width: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    padding: '0.75rem 1rem', 
    background: 'none', 
    border: 'none', 
    color: 'var(--danger)', 
    cursor: 'pointer', 
    textAlign: 'left', 
    fontSize: '0.88rem', 
    fontWeight: '600' 
  },
  contentArea: { 
    flex: 1, 
    overflowY: 'auto', 
    paddingTop: '2rem', 
    paddingBottom: '2.5rem' 
  },
  toast: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
    color: 'var(--text-primary)',
    padding: '0.8rem 1.25rem',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    fontSize: '0.88rem',
    fontWeight: '600',
    zIndex: 9999,
    animation: 'slideIn 0.25s ease'
  }
};

export default App;
