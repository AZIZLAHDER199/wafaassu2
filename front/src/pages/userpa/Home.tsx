import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const CARDS = [
  {
    icon: '🚛',
    title: 'Registre Intervention',
    desc: 'Créer et gérer les interventions',
    route: '/operation?type=intervention',
    gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
    shadow: 'rgba(99,102,241,.4)',
  },
  {
    icon: '⛽',
    title: 'Suivi Carburant',
    desc: 'Suivi de la consommation carburant',
    route: '/operation?type=suivi_carburant',
    gradient: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
    shadow: 'rgba(14,165,233,.4)',
  },
  {
    icon: '📚',
    title: 'Historique',
    desc: 'Consulter les opérations passées',
    route: '/userhistory',
    gradient: 'linear-gradient(135deg,#10b981,#34d399)',
    shadow: 'rgba(16,185,129,.4)',
  },
  {
    icon: '📊',
    title: 'Statistiques',
    desc: 'Rapports et analyses',
    route: '/statistics',
    gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    shadow: 'rgba(245,158,11,.4)',
  },
  {
    icon: '🧾',
    title: 'Registre Factures',
    desc: 'Consulter et exporter les factures',
    route: '/facture-records',
    gradient: 'linear-gradient(135deg,#ec4899,#f472b6)',
    shadow: 'rgba(236,72,153,.4)',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('username');
    if (token) { setIsAuthenticated(true); setUsername(stored || 'Utilisateur'); }
    else navigate('/login');
  }, [navigate]);

  const handleLogout = useCallback(() => navigate('/logout'), [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1e3a5f 100%)',
        padding: '0 clamp(16px,4vw,36px)',
        height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(0,0,0,.25)',
        position: 'sticky', top: 0, zIndex: 50, gap: '12px',
      }}>
        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '5px 8px', boxShadow: '0 2px 10px rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: '.8px' }}>TAMANAR ASSISTANCE</div>
            <div style={{ fontSize: '.6rem', color: '#94a3b8', letterSpacing: '2px', fontWeight: 600, textTransform: 'uppercase' }}>Tableau de bord</div>
          </div>
        </div>

        {/* User actions */}
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px', padding: '5px 14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 800, color: '#fff' }}>
                {username?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#e2e8f0' }}>{username}</span>
            </div>
            <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.3)', padding: '7px 16px', borderRadius: '8px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.2)'; }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* ── HERO BANNER ── */}
      {isAuthenticated && (
        <div style={{
          background: 'linear-gradient(135deg,#1e293b 0%,#1e3a5f 50%,#312e81 100%)',
          padding: 'clamp(28px,5vw,48px) clamp(16px,4vw,36px)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99,102,241,.08)', top: '-80px', right: '15%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(14,165,233,.06)', bottom: '-60px', right: '5%', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', position: 'relative' }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '.75rem', color: '#94a3b8', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>Bienvenue</p>
              <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem,4vw,2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-.3px' }}>
                {username} 👋
              </h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '.92rem' }}>Choisissez une opération pour commencer</p>
            </div>
            {/* Big logo in hero */}
            <img src={logo} alt="" style={{ height: 'clamp(60px,10vw,100px)', objectFit: 'contain', opacity: .35, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* ── CARDS ── */}
      {isAuthenticated && (
        <main style={{ flex: 1, padding: 'clamp(20px,4vw,36px) clamp(16px,4vw,36px)', maxWidth: '1180px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Actions rapides</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '18px' }}>
            {CARDS.map(c => <ActionCard key={c.title} {...c} onClick={() => navigate(c.route)} />)}
          </div>
        </main>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ textAlign: 'center', fontSize: '.72rem', color: '#94a3b8', padding: '14px', borderTop: '1px solid #e2e8f0', background: '#fff', marginTop: 'auto' }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

/* ── CARD ── */
const ActionCard = ({ icon, title, desc, gradient, shadow, onClick }: {
  icon: string; title: string; desc: string; gradient: string; shadow: string; onClick: () => void;
}) => (
  <button onClick={onClick}
    style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: '18px', padding: '24px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s', boxShadow: '0 2px 12px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}
    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(-5px)'; b.style.boxShadow = `0 14px 36px ${shadow}`; b.style.borderColor = 'transparent'; }}
    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(0)'; b.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'; b.style.borderColor = '#e8ecf4'; }}
  >
    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: `0 6px 16px ${shadow}`, flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 800, fontSize: '.92rem', color: '#0f172a', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '.76rem', color: '#94a3b8', lineHeight: 1.5 }}>{desc}</div>
    </div>
    <div style={{ fontSize: '.74rem', fontWeight: 800, background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px' }}>
      Accéder →
    </div>
  </button>
);
