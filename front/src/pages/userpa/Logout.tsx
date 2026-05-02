import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('is_admin');
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#f8faff 0%,#f1f5f9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Segoe UI,system-ui,sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(15,23,42,.10)',
        border: '1px solid #e2e8f0',
        padding: '40px 36px',
        width: '100%', maxWidth: '400px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '20px' }}>
          <img src={logo} alt="Logo" style={{ height: '56px', objectFit: 'contain' }} />
        </div>

        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#fff1f2', border: '2px solid #fecdd3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '1.8rem',
        }}>
          🚪
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
          Déconnexion
        </h1>
        <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: '.88rem', lineHeight: 1.6 }}>
          Voulez-vous vraiment terminer votre session ?<br />
          Vous devrez vous reconnecter pour accéder au tableau de bord.
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '24px' }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              flex: 1, padding: '10px 0',
              background: '#f8fafc', color: '#475569',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px', fontSize: '.88rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
          >
            Annuler
          </button>
          <button
            onClick={confirmLogout}
            style={{
              flex: 1, padding: '10px 0',
              background: '#e11d48', color: '#fff',
              border: 'none',
              borderRadius: '10px', fontSize: '.88rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all .15s',
              boxShadow: '0 4px 14px rgba(225,29,72,.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#be123c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
