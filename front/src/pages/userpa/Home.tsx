import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const CARDS = [
  {
    icon: '🚛',
    title: 'Registre Intervention',
    desc: 'Créer et gérer les interventions terrain',
    route: '/operation?type=intervention',
    from: '#7c3aed', to: '#a855f7',
    shadow: 'rgba(124,58,237,.35)',
  },
  {
    icon: '⛽',
    title: 'Suivi Carburant',
    desc: 'Suivi de la consommation carburant',
    route: '/operation?type=suivi_carburant',
    from: '#0369a1', to: '#0ea5e9',
    shadow: 'rgba(3,105,161,.35)',
  },
  {
    icon: '📚',
    title: 'Historique',
    desc: 'Consulter les opérations passées',
    route: '/userhistory',
    from: '#047857', to: '#10b981',
    shadow: 'rgba(4,120,87,.35)',
  },
  {
    icon: '📊',
    title: 'Statistiques',
    desc: 'Rapports, analyses et tableaux de bord',
    route: '/statistics',
    from: '#b45309', to: '#f59e0b',
    shadow: 'rgba(180,83,9,.35)',
  },
  {
    icon: '🧾',
    title: 'Registre Factures',
    desc: 'Consulter et exporter les factures',
    route: '/facture-records',
    from: '#be185d', to: '#ec4899',
    shadow: 'rgba(190,24,93,.35)',
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

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Segoe UI,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        background: 'linear-gradient(135deg,#1a0533 0%,#2d1060 50%,#1e3a5f 100%)',
        padding: '0 clamp(16px,4vw,40px)',
        height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(0,0,0,.3)',
        position: 'sticky', top: 0, zIndex: 50,
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '5px 9px', boxShadow: '0 2px 12px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: '42px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: '.8px', lineHeight: 1.1 }}>TAMANAR ASSISTANCE</div>
            <div style={{ fontSize: '.58rem', color: '#a78bfa', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>Tableau de bord</div>
          </div>
        </div>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '999px', padding: '5px 14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.82rem', fontWeight: 900, color: '#fff' }}>
                {username?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#e2e8f0' }}>{username}</span>
            </div>
            <button onClick={handleLogout}
              style={{ background: 'rgba(239,68,68,.18)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.28)', padding: '7px 16px', borderRadius: '8px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all .18s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.32)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.18)'; }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* ── HERO BANNER ── */}
      {isAuthenticated && (
        <div style={{
          background: 'linear-gradient(135deg,#2d1060 0%,#1e3a5f 60%,#0f172a 100%)',
          padding: 'clamp(30px,5vw,52px) clamp(16px,4vw,40px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: 'rgba(168,85,247,.07)', top: '-100px', right: '10%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(14,165,233,.05)', bottom: '-60px', right: '3%', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', position: 'relative' }}>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: '.72rem', color: '#a78bfa', letterSpacing: '2.5px', fontWeight: 700, textTransform: 'uppercase' }}>{greeting}</p>
              <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-.3px' }}>
                {username} 👋
              </h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '.9rem' }}>Bienvenue dans votre espace de gestion Tamanar Assistance</p>
            </div>
            <img src={logo} alt="" style={{ height: 'clamp(65px,10vw,110px)', objectFit: 'contain', opacity: .2, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* ── CARDS GRID ── */}
      {isAuthenticated && (
        <main style={{
          flex: 1,
          background: 'linear-gradient(180deg,#0f172a 0%,#111827 100%)',
          padding: 'clamp(22px,4vw,40px) clamp(16px,4vw,40px)',
        }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
            <p style={{ margin: '0 0 18px', fontSize: '.68rem', fontWeight: 800, color: '#4b5563', letterSpacing: '2px', textTransform: 'uppercase' }}>Actions rapides</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px' }}>
              {CARDS.map(c => <ActionCard key={c.title} {...c} onClick={() => navigate(c.route)} />)}
            </div>
          </div>
        </main>
      )}

      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b', textAlign: 'center', fontSize: '.7rem', color: '#374151', padding: '14px' }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

/* ── CARD ── */
const ActionCard = ({ icon, title, desc, from, to, shadow, onClick }: {
  icon: string; title: string; desc: string; from: string; to: string; shadow: string; onClick: () => void;
}) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(135deg,${from},${to})` : '#1e293b',
        border: `1.5px solid ${hov ? 'transparent' : '#293548'}`,
        borderRadius: '18px',
        padding: '22px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all .22s ease',
        boxShadow: hov ? `0 16px 40px ${shadow}` : '0 2px 10px rgba(0,0,0,.2)',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column', gap: '14px',
        width: '100%',
      }}
    >
      <div style={{
        width: '50px', height: '50px', borderRadius: '14px',
        background: hov ? 'rgba(255,255,255,.18)' : `linear-gradient(135deg,${from},${to})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
        boxShadow: hov ? 'none' : `0 4px 14px ${shadow}`,
        flexShrink: 0,
        transition: 'all .22s',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '.9rem', color: hov ? '#fff' : '#e2e8f0', marginBottom: '5px', transition: 'color .2s' }}>{title}</div>
        <div style={{ fontSize: '.74rem', color: hov ? 'rgba(255,255,255,.7)' : '#64748b', lineHeight: 1.55, transition: 'color .2s' }}>{desc}</div>
      </div>
      <div style={{ fontSize: '.74rem', fontWeight: 800, color: hov ? 'rgba(255,255,255,.85)' : from, transition: 'color .2s' }}>
        Accéder →
      </div>
    </button>
  );
};
