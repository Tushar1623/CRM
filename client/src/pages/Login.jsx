import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CarFront, Lock, Mail } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('admin@motorwise.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError('Could not connect to server.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>M</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Motorwise CRM</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Sign in to manage your dealership</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="var(--text-secondary)" style={styles.inputIcon} />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="premium-input" 
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          
          <div>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="var(--text-secondary)" style={styles.inputIcon} />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="premium-input" 
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button type="submit" className="premium-btn" style={styles.loginBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <button 
              type="button" 
              onClick={() => { setEmail('admin@motorwise.com'); setPassword('password123'); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
            >
              Fill Demo Admin Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-dark)',
    padding: '1rem'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem 2rem',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-lg)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logoIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'var(--accent-primary)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1.6rem',
    margin: '0 auto 1rem auto',
    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.4rem',
    fontWeight: '600'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem'
  },
  loginBtn: {
    width: '100%',
    padding: '0.8rem',
    marginTop: '0.5rem',
    fontSize: '1rem',
    justifyContent: 'center'
  },
  error: {
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger)',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
    textAlign: 'center',
    border: '1px solid rgba(239, 68, 68, 0.4)'
  }
};

export default Login;
