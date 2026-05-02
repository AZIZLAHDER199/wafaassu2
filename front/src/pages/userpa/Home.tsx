import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const CARDS = [
  {
    icon: '🚛',
    title: 'Registre Intervention',
    desc: 'Créer et gérer les interventions',
    route: '/operation?type=intervention',
    gradient: 'linear-gradient(135deg,#111111 0%,#333333 100%)',
    shadow: 'rgba(0,0,0,.30)',
    border: '#e5e7eb',
  },
  {
    icon: '⛽',
    title: 'Suivi Carburant',
    desc: 'Suivi de la consommation carburant',
    route: '/operation?type=suivi_carburant',
    gradient: 'linear-gradient(135deg,#cc0000 0%,#ef4444 100%)',
    shadow: 'rgba(204,0,0,.28)',
    border: '#fecaca',
  },
  {
    icon: '📚',
    title: 'Historique',
    desc: 'Consulter les opérations passées',
    route: '/userhistory',
    gradient: 'linear-gradient(135deg,#1f1f1f 0%,#cc0000 100%)',
    shadow: 'rgba(204,0,0,.22)',
    border: '#fecaca',
  },
  {
    icon: '📊',
    title: 'Statistiques',
    desc: 'Rapports et analyses',
    route: '/statistics',
    gradient: 'linear-gradient(135deg,#111111 0%,#374151 100%)',
    shadow: 'rgba(0,0,0,.25)',
    border: '#e5e7eb',
  },
  {
    icon: '🧾',
    title: 'Registre Factures',
    desc: 'Consulter et exporter les factures',
    route: '/facture-records',
    gradient: 'linear-gradient(135deg,#cc0000 0%,#991b1b 100%)',
    shadow: 'rgba(204,0,0,.30)',
    border: '#fecaca',
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
    <div style={{ minHeight:'100vh', background:'#fafafa', display:'flex', flexDirection:'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        background:'#111',
        padding:'0 28px',
        height:'64px',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        boxShadow:'0 2px 16px rgba(0,0,0,.4)',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <img src={logo} alt="Logo" style={{height:'44px',objectFit:'contain'}} />
          <div>
            <div style={{fontWeight:800,fontSize:'1rem',color:'#fff',letterSpacing:'.5px'}}>
              TAMANAR ASSISTANCE
            </div>
            <div style={{fontSize:'.65rem',color:'#cc0000',letterSpacing:'2px',fontWeight:600}}>TABLEAU DE BORD</div>
          </div>
        </div>

        {isAuthenticated && (
          <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
            <span style={{
              background:'rgba(204,0,0,.15)',
              color:'#ff6666',
              padding:'4px 14px', borderRadius:'999px',
              fontSize:'.8rem', fontWeight:700,
              border:'1px solid rgba(204,0,0,.3)',
            }}>
              👤 {username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background:'#cc0000', color:'#fff',
                border:'none',
                padding:'7px 18px', borderRadius:'8px',
                fontSize:'.8rem', fontWeight:700, cursor:'pointer',
                letterSpacing:'.5px',
              }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{flex:1, padding:'clamp(20px,4vw,40px) clamp(16px,4vw,36px)', maxWidth:'1100px', margin:'0 auto', width:'100%', boxSizing:'border-box'}}>
        {isAuthenticated && (
          <>
            {/* Welcome banner */}
            <div style={{
              background:'linear-gradient(135deg,#111111 0%,#1f1f1f 60%,#cc0000 100%)',
              borderRadius:'18px',
              padding:'clamp(20px,4vw,36px) clamp(20px,4vw,40px)',
              marginBottom:'32px',
              color:'#fff',
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between',
              boxShadow:'0 8px 32px rgba(0,0,0,.35)',
              gap:'16px',
            }}>
              <div>
                <h1 style={{margin:'0 0 6px',fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:800}}>
                  Bonjour, {username} 👋
                </h1>
                <p style={{margin:0,opacity:.75,fontSize:'.95rem'}}>
                  Bienvenue sur votre tableau de bord — Choisissez une opération
                </p>
              </div>
              <img src={logo} alt="" style={{height:'50px',opacity:.35,objectFit:'contain',flexShrink:0}} />
            </div>

            {/* Action cards */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))',
              gap:'18px',
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
        color:'#9ca3af', padding:'14px',
        borderTop:'1px solid #e5e7eb',
        background:'#111',
        color:'#666',
      }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

/* ── CARD ── */
const ActionCard = ({
  icon, title, desc, gradient, shadow, border, onClick,
}: {
  icon:string; title:string; desc:string;
  gradient:string; shadow:string; border:string; onClick:()=>void;
}) => (
  <button
    onClick={onClick}
    style={{
      background:'#fff',
      border:`1.5px solid ${border}`,
      borderRadius:'16px',
      padding:'22px 20px',
      cursor:'pointer',
      textAlign:'left',
      transition:'all .2s',
      boxShadow:'0 2px 10px rgba(0,0,0,.06)',
      display:'flex',
      flexDirection:'column',
      gap:'12px',
      width:'100%',
    }}
    onMouseEnter={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.transform = 'translateY(-4px)';
      b.style.boxShadow = `0 12px 32px ${shadow}`;
    }}
    onMouseLeave={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.transform = 'translateY(0)';
      b.style.boxShadow = '0 2px 10px rgba(0,0,0,.06)';
    }}
  >
    <div style={{
      width:'50px', height:'50px',
      borderRadius:'13px',
      background: gradient,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'1.5rem',
      boxShadow:`0 4px 12px ${shadow}`,
      flexShrink:0,
    }}>
      {icon}
    </div>
    <div style={{flex:1}}>
      <div style={{fontWeight:700, fontSize:'.95rem', color:'#111', marginBottom:'4px'}}>{title}</div>
      <div style={{fontSize:'.78rem', color:'#6b7280'}}>{desc}</div>
    </div>
    <div style={{
      fontSize:'.75rem', fontWeight:700,
      color:'#cc0000',
      display:'flex', alignItems:'center', gap:'4px',
    }}>
      Accéder →
    </div>
  </button>
);
