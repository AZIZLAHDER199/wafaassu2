import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const CARDS = [
  {
    icon: '🚛',
    title: 'Registre Intervention',
    desc: 'Créer et gérer les interventions',
    route: '/operation?type=intervention',
    gradient: 'linear-gradient(135deg,#1e40af 0%,#3b82f6 100%)',
    shadow: 'rgba(30,64,175,.25)',
  },
  {
    icon: '⛽',
    title: 'Suivi Carburant',
    desc: 'Suivi de la consommation carburant',
    route: '/operation?type=suivi_carburant',
    gradient: 'linear-gradient(135deg,#ea580c 0%,#f97316 100%)',
    shadow: 'rgba(234,88,12,.25)',
  },
  {
    icon: '📚',
    title: 'Historique',
    desc: 'Consulter les opérations passées',
    route: '/userhistory',
    gradient: 'linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%)',
    shadow: 'rgba(124,58,237,.25)',
  },
  {
    icon: '📊',
    title: 'Statistiques',
    desc: 'Rapports et analyses',
    route: '/statistics',
    gradient: 'linear-gradient(135deg,#059669 0%,#10b981 100%)',
    shadow: 'rgba(5,150,105,.25)',
  },
  {
    icon: '🧾',
    title: 'Registre Factures',
    desc: 'Consulter et exporter les factures',
    route: '/facture-records',
    gradient: 'linear-gradient(135deg,#0891b2 0%,#38bdf8 100%)',
    shadow: 'rgba(8,145,178,.25)',
  },
  {
    icon: '🏢',
    title: 'Sélection Société',
    desc: 'Choisir la société d\'assistance',
    route: '/company-selection',
    gradient: 'linear-gradient(135deg,#b45309 0%,#f59e0b 100%)',
    shadow: 'rgba(180,83,9,.25)',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername]               = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('username');
    if (token) { setIsAuthenticated(true); setUsername(stored || 'Utilisateur'); }
    else navigate('/login');
  }, [navigate]);

  const handleLogout = useCallback(() => navigate('/logout'), [navigate]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        background:'#fff',
        borderBottom:'2px solid #c7d2fe',
        padding:'0 28px',
        height:'64px',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        boxShadow:'0 2px 12px rgba(30,64,175,.08)',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <img src={logo} alt="Logo" style={{height:'42px',borderRadius:'8px'}} />
          <div>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#1e3a8a',letterSpacing:'.5px'}}>
              TAMANAR ASSISTANCE
            </div>
            <div style={{fontSize:'.7rem',color:'#64748b',letterSpacing:'1px'}}>TABLEAU DE BORD</div>
          </div>
        </div>

        {isAuthenticated && (
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <span style={{
              background:'#eff6ff', color:'#1e40af',
              padding:'4px 14px', borderRadius:'999px',
              fontSize:'.8rem', fontWeight:700,
            }}>
              👤 {username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background:'#fef2f2', color:'#b91c1c',
                border:'1px solid #fecaca',
                padding:'6px 16px', borderRadius:'8px',
                fontSize:'.8rem', fontWeight:600, cursor:'pointer',
              }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{flex:1, padding:'36px 32px', maxWidth:'1100px', margin:'0 auto', width:'100%'}}>
        {isAuthenticated && (
          <>
            {/* Welcome banner */}
            <div style={{
              background:'linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#3b82f6 100%)',
              borderRadius:'18px',
              padding:'32px 36px',
              marginBottom:'36px',
              color:'#fff',
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between',
              boxShadow:'0 8px 32px rgba(30,64,175,.3)',
            }}>
              <div>
                <h1 style={{margin:'0 0 6px',fontSize:'1.9rem',fontWeight:800}}>
                  Bonjour, {username} 👋
                </h1>
                <p style={{margin:0,opacity:.8,fontSize:'.95rem'}}>
                  Bienvenue sur votre tableau de bord — Choisissez une opération
                </p>
              </div>
              <div style={{fontSize:'3.5rem',opacity:.25}}>🏢</div>
            </div>

            {/* Action cards */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))',
              gap:'20px',
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
        textAlign:'center', fontSize:'.72rem',
        color:'#94a3b8', padding:'14px',
        borderTop:'1px solid #e0e7ff',
        background:'#fff',
      }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

/* ── CARD ── */
const ActionCard = ({
  icon, title, desc, gradient, shadow, onClick,
}: {
  icon:string; title:string; desc:string;
  gradient:string; shadow:string; onClick:()=>void;
}) => (
  <button
    onClick={onClick}
    style={{
      background:'#fff',
      border:'1.5px solid #e0e7ff',
      borderRadius:'16px',
      padding:'24px 22px',
      cursor:'pointer',
      textAlign:'left',
      transition:'all .2s',
      boxShadow:'0 2px 12px rgba(30,64,175,.07)',
      display:'flex',
      flexDirection:'column',
      gap:'12px',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 32px ${shadow}`;
      (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(30,64,175,.07)';
      (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e7ff';
    }}
  >
    <div style={{
      width:'52px', height:'52px',
      borderRadius:'14px',
      background: gradient,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'1.6rem',
      boxShadow:`0 4px 12px ${shadow}`,
    }}>
      {icon}
    </div>
    <div>
      <div style={{fontWeight:700, fontSize:'1rem', color:'#0f172a', marginBottom:'4px'}}>{title}</div>
      <div style={{fontSize:'.8rem', color:'#64748b'}}>{desc}</div>
    </div>
    <div style={{
      marginTop:'auto',
      fontSize:'.75rem', fontWeight:600,
      color:'#3b82f6',
      display:'flex', alignItems:'center', gap:'4px',
    }}>
      Accéder →
    </div>
  </button>
);
