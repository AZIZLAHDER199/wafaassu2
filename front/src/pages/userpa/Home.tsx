import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const CARDS = [
  { icon: '🚛', title: 'Registre Intervention', desc: 'Créer et gérer les interventions',        route: '/operation?type=intervention',    accent: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { icon: '⛽', title: 'Suivi Carburant',       desc: 'Suivi de la consommation carburant',     route: '/operation?type=suivi_carburant', accent: '#0ea5e9', bg: '#e0f2fe', border: '#bae6fd' },
  { icon: '📚', title: 'Historique',            desc: 'Consulter les opérations passées',        route: '/userhistory',                    accent: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { icon: '📊', title: 'Statistiques',          desc: 'Rapports et analyses',                   route: '/statistics',                     accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { icon: '🧾', title: 'Registre Factures',     desc: 'Consulter et exporter les factures',     route: '/facture-records',                accent: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8faff 0%,#f1f5f9 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 clamp(16px,4vw,32px)',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 10px rgba(0,0,0,.06)',
        position: 'sticky', top: 0, zIndex: 50, gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Logo" style={{ height: '42px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#0f172a', letterSpacing: '.3px' }}>TAMANAR ASSISTANCE</div>
            <div style={{ fontSize: '.62rem', color: '#94a3b8', letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase' }}>Tableau de bord</div>
          </div>
        </div>
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#f8fafc', color: '#475569', padding: '5px 14px', borderRadius: '999px', fontSize: '.78rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>
              👤 {username}
            </span>
            <button onClick={handleLogout} style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '6px 16px', borderRadius: '8px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, padding: 'clamp(24px,4vw,44px) clamp(16px,4vw,36px)', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {isAuthenticated && (
          <>
            {/* Banner */}
            <div style={{
              background: 'linear-gradient(135deg,#1e293b 0%,#334155 50%,#4f6272 100%)',
              borderRadius: '20px', padding: 'clamp(22px,4vw,36px) clamp(22px,4vw,40px)',
              marginBottom: '30px', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 10px 36px rgba(15,23,42,.16)', gap: '16px',
            }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '.82rem', opacity: .6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Bienvenue</p>
                <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.3rem,3vw,1.9rem)', fontWeight: 800 }}>{username} 👋</h1>
                <p style={{ margin: 0, opacity: .65, fontSize: '.88rem' }}>Choisissez une opération pour commencer</p>
              </div>
              <img src={logo} alt="" style={{ height: '56px', opacity: .18, objectFit: 'contain', flexShrink: 0 }} />
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
              {CARDS.map(card => <ActionCard key={card.title} {...card} onClick={() => navigate(card.route)} />)}
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', fontSize: '.72rem', color: '#94a3b8', padding: '14px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

const ActionCard = ({ icon, title, desc, accent, bg, border, onClick }: {
  icon: string; title: string; desc: string; accent: string; bg: string; border: string; onClick: () => void;
}) => (
  <button onClick={onClick}
    style={{ background: '#fff', border: `1.5px solid ${border}`, borderRadius: '16px', padding: '22px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all .18s', boxShadow: '0 1px 6px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}
    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(-4px)'; b.style.boxShadow = `0 10px 28px ${accent}28`; b.style.borderColor = accent; }}
    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(0)'; b.style.boxShadow = '0 1px 6px rgba(0,0,0,.05)'; b.style.borderColor = border; }}
  >
    <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#0f172a', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '.76rem', color: '#94a3b8' }}>{desc}</div>
    </div>
    <div style={{ fontSize: '.73rem', fontWeight: 700, color: accent, display: 'flex', alignItems: 'center', gap: '4px' }}>Accéder →</div>
  </button>
);
