import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const CARDS = [
  {
    icon: '🚛',
    title: 'Registre Intervention',
    desc: 'Créer et gérer les interventions',
    route: '/operation?type=intervention',
    accent: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    icon: '⛽',
    title: 'Suivi Carburant',
    desc: 'Suivi de la consommation carburant',
    route: '/operation?type=suivi_carburant',
    accent: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    icon: '📚',
    title: 'Historique',
    desc: 'Consulter les opérations passées',
    route: '/userhistory',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    icon: '📊',
    title: 'Statistiques',
    desc: 'Rapports et analyses',
    route: '/statistics',
    accent: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
  },
  {
    icon: '🧾',
    title: 'Registre Factures',
    desc: 'Consulter et exporter les factures',
    route: '/facture-records',
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
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
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 clamp(16px,4vw,32px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        position: 'sticky', top: 0, zIndex: 50,
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Logo" style={{ height: '42px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#0f172a', letterSpacing: '.4px' }}>
              TAMANAR ASSISTANCE
            </div>
            <div style={{ fontSize: '.62rem', color: '#64748b', letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase' }}>
              Tableau de bord
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: '#f1f5f9', color: '#475569',
              padding: '5px 14px', borderRadius: '999px',
              fontSize: '.78rem', fontWeight: 700,
              border: '1px solid #e2e8f0',
            }}>
              👤 {username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: '#fef2f2', color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '6px 16px', borderRadius: '8px',
                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,36px)', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {isAuthenticated && (
          <>
            {/* Welcome banner */}
            <div style={{
              background: 'linear-gradient(135deg,#1e293b 0%,#334155 60%,#475569 100%)',
              borderRadius: '16px',
              padding: 'clamp(20px,4vw,32px) clamp(20px,4vw,36px)',
              marginBottom: '28px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 28px rgba(15,23,42,.18)',
              gap: '16px',
            }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.3rem,3vw,1.9rem)', fontWeight: 800 }}>
                  Bonjour, {username} 👋
                </h1>
                <p style={{ margin: 0, opacity: .75, fontSize: '.92rem' }}>
                  Bienvenue sur votre tableau de bord
                </p>
              </div>
              <img src={logo} alt="" style={{ height: '52px', opacity: .25, objectFit: 'contain', flexShrink: 0 }} />
            </div>

            {/* Action cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))',
              gap: '16px',
            }}>
              {CARDS.map(card => (
                <ActionCard key={card.title} {...card} onClick={() => navigate(card.route)} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        textAlign: 'center', fontSize: '.72rem',
        color: '#94a3b8', padding: '14px',
        borderTop: '1px solid #e2e8f0',
        background: '#fff',
      }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

/* ── CARD ── */
const ActionCard = ({
  icon, title, desc, accent, bg, border, onClick,
}: {
  icon: string; title: string; desc: string;
  accent: string; bg: string; border: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      background: '#fff',
      border: `1.5px solid ${border}`,
      borderRadius: '14px',
      padding: '22px 20px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all .18s',
      boxShadow: '0 1px 6px rgba(0,0,0,.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
    }}
    onMouseEnter={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.transform = 'translateY(-3px)';
      b.style.boxShadow = `0 8px 24px rgba(0,0,0,.10)`;
      b.style.borderColor = accent;
    }}
    onMouseLeave={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.transform = 'translateY(0)';
      b.style.boxShadow = '0 1px 6px rgba(0,0,0,.06)';
      b.style.borderColor = border;
    }}
  >
    <div style={{
      width: '48px', height: '48px',
      borderRadius: '12px',
      background: bg,
      border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.45rem',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: '.92rem', color: '#0f172a', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '.77rem', color: '#64748b' }}>{desc}</div>
    </div>
    <div style={{
      fontSize: '.74rem', fontWeight: 700,
      color: accent,
      display: 'flex', alignItems: 'center', gap: '4px',
    }}>
      Accéder →
    </div>
  </button>
);
