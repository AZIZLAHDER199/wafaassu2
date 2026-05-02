import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const NAV = [
  { icon: '🚛', label: 'Interventions',    route: '/operation?type=intervention',    color: '#6366f1' },
  { icon: '⛽', label: 'Suivi Carburant',  route: '/operation?type=suivi_carburant', color: '#0ea5e9' },
  { icon: '📚', label: 'Historique',       route: '/userhistory',                    color: '#10b981' },
  { icon: '📊', label: 'Statistiques',     route: '/statistics',                     color: '#f59e0b' },
  { icon: '🧾', label: 'Factures',         route: '/facture-records',                color: '#ec4899' },
];

const QUICK = [
  { icon: '🚛', label: 'Nouvelle intervention', route: '/operation?type=intervention',    bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe' },
  { icon: '⛽', label: 'Suivi carburant',        route: '/operation?type=suivi_carburant', bg: '#e0f2fe', color: '#0ea5e9', border: '#bae6fd' },
  { icon: '📚', label: 'Voir historique',        route: '/userhistory',                    bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' },
  { icon: '🧾', label: 'Registre factures',      route: '/facture-records',                bg: '#fdf2f8', color: '#ec4899', border: '#fbcfe8' },
];

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('username');
    if (token) { setIsAuthenticated(true); setUsername(stored || 'Utilisateur'); }
    else navigate('/login');
  }, [navigate]);

  const handleLogout = useCallback(() => navigate('/logout'), [navigate]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8faff', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* ── OVERLAY (mobile) ── */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40 }} />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: sideOpen ? 'translateX(0)' : undefined,
        transition: 'transform .25s',
        boxShadow: '4px 0 24px rgba(0,0,0,.18)',
      }}
        className="sidebar-desktop"
      >
        {/* Logo block */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '5px 7px', display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="Logo" style={{ height: '34px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '.82rem', color: '#fff', letterSpacing: '.6px' }}>TAMANAR</div>
              <div style={{ fontWeight: 700, fontSize: '.7rem', color: '#6366f1', letterSpacing: '.8px' }}>ASSISTANCE</div>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div style={{ padding: '18px 18px 8px', fontSize: '.64rem', fontWeight: 700, color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Navigation
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 10px', overflow: 'auto' }}>
          {NAV.map(n => (
            <button key={n.label} onClick={() => navigate(n.route)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '10px', marginBottom: '3px', textAlign: 'left', transition: 'all .15s' }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,.07)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; }}
            >
              <span style={{ width: '34px', height: '34px', borderRadius: '9px', background: n.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: `1px solid ${n.color}30`, flexShrink: 0 }}>
                {n.icon}
              </span>
              <span style={{ fontSize: '.86rem', fontWeight: 600, color: '#cbd5e1' }}>{n.label}</span>
            </button>
          ))}
        </nav>

        {/* User block */}
        <div style={{ padding: '14px 14px 20px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.9rem', color: '#fff', flexShrink: 0 }}>
              {username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
              <div style={{ fontSize: '.68rem', color: '#64748b' }}>Utilisateur</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '9px', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '9px', color: '#fca5a5', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.12)'; }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '240px', minHeight: '100vh' }} className="main-offset">

        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e8ecf4', padding: '0 clamp(16px,3vw,28px)', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 8px rgba(0,0,0,.05)', gap: '12px' }}>
          {/* Mobile menu toggle */}
          <button onClick={() => setSideOpen(s => !s)} className="sidebar-toggle" style={{ display: 'none', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.1rem', color: '#475569' }}>
            ☰
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#0f172a' }}>Tableau de bord</div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>{dateStr}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8faff', border: '1px solid #e8ecf4', borderRadius: '10px', padding: '6px 14px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.78rem', color: '#fff' }}>
              {username?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#334155' }}>{username}</span>
          </div>
        </header>

        <main style={{ flex: 1, padding: 'clamp(20px,3vw,32px) clamp(16px,3vw,28px)' }}>

          {/* Welcome row */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(1.2rem,3vw,1.7rem)', fontWeight: 900, color: '#0f172a' }}>
              {greeting}, {username} 👋
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '.9rem' }}>Voici votre espace de gestion Tamanar Assistance.</p>
          </div>

          {/* Quick actions grid */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Actions rapides</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px' }}>
              {QUICK.map(q => (
                <button key={q.label} onClick={() => navigate(q.route)}
                  style={{ background: '#fff', border: `1.5px solid ${q.border}`, borderRadius: '14px', padding: '20px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all .18s', boxShadow: '0 1px 8px rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(-3px)'; b.style.boxShadow = `0 8px 24px ${q.color}28`; }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(0)'; b.style.boxShadow = '0 1px 8px rgba(0,0,0,.05)'; }}
                >
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: q.bg, border: `1px solid ${q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
                    {q.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.86rem', color: '#0f172a' }}>{q.label}</div>
                    <div style={{ fontSize: '.74rem', fontWeight: 700, color: q.color, marginTop: '2px' }}>Ouvrir →</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer style={{ textAlign: 'center', fontSize: '.7rem', color: '#94a3b8', padding: '12px', borderTop: '1px solid #e8ecf4', background: '#fff' }}>
          © 2025 Tamanar Assistance — Powered by Lahderaziz
        </footer>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { transform: translateX(0) !important; }
          .sidebar-toggle  { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { transform: translateX(-100%); }
          .sidebar-desktop.open { transform: translateX(0); }
          .sidebar-toggle  { display: flex !important; }
          .main-offset     { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
