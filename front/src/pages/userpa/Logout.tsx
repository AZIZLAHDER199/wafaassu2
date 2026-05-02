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
      background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 50%,#312e81 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Segoe UI,system-ui,sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative blobs */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99,102,241,.07)', top: '-120px', right: '-80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(236,72,153,.05)', bottom: '-80px', left: '-60px', pointerEvents: 'none' }} />

      <div style={{
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 24px 64px rgba(0,0,0,.35)',
        padding: 'clamp(32px,5vw,48px) clamp(28px,5vw,44px)',
        width: '100%', maxWidth: '420px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: '40px', right: '40px', height: '4px', background: 'linear-gradient(90deg,#6366f1,#ec4899)', borderRadius: '0 0 8px 8px' }} />

        {/* Logo */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
        </div>

        {/* Warning icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem' }}>
          🚪
        </div>

        <h1 style={{ margin: '0 0 10px', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-.2px' }}>
          Déconnexion
        </h1>
        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '.88rem', lineHeight: 1.65 }}>
          Voulez-vous vraiment terminer votre session ?<br />
          <span style={{ color: '#94a3b8', fontSize: '.82rem' }}>Vous devrez vous reconnecter pour accéder au tableau de bord.</span>
        </p>

        <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)', marginBottom: '24px' }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ flex: 1, padding: '12px 0', background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', transition: 'all .18s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            Annuler
          </button>
          <button
            onClick={confirmLogout}
            style={{ flex: 1, padding: '12px 0', background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '.9rem', fontWeight: 800, cursor: 'pointer', transition: 'all .18s', boxShadow: '0 6px 20px rgba(220,38,38,.35)', letterSpacing: '.3px' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(220,38,38,.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,.35)'; }}
          >
            Se déconnecter
          </button>
        </div>

        <p style={{ margin: '20px 0 0', fontSize: '.72rem', color: '#94a3b8' }}>
          © 2025 Tamanar Assistance
        </p>
      </div>
    </div>
  );
};

export default Logout;
