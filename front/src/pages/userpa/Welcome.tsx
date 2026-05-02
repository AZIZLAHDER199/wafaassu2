import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const features = [
  { icon: '🚛', title: 'Interventions',   desc: 'Gestion complète des dossiers terrain' },
  { icon: '⛽', title: 'Carburant',       desc: 'Suivi et contrôle des consommations' },
  { icon: '🧾', title: 'Facturation',     desc: 'Génération et export de factures PDF' },
  { icon: '📊', title: 'Statistiques',    desc: 'Tableaux de bord et rapports avancés' },
];

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home');
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Segoe UI,system-ui,sans-serif', background: 'linear-gradient(160deg,#0f0a1e 0%,#1a0533 40%,#0f172a 100%)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* decorative blobs */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)', top: '-200px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,.1),transparent 70%)', bottom: '-100px', left: '-80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.08),transparent 70%)', top: '40%', left: '20%', pointerEvents: 'none' }} />

      {/* Top bar */}
      <header style={{ padding: '20px clamp(20px,5vw,60px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '4px 7px', boxShadow: '0 2px 12px rgba(0,0,0,.3)' }}>
            <img src={logo} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '.9rem', color: '#fff', letterSpacing: '.5px' }}>TAMANAR ASSISTANCE</span>
        </div>
        <button onClick={() => navigate('/login')}
          style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: '10px', padding: '9px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem', transition: 'all .18s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
        >
          Se connecter
        </button>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px,8vh,80px) clamp(20px,5vw,60px)', textAlign: 'center', position: 'relative', zIndex: 10 }}>

        {/* Logo big */}
        <div style={{ marginBottom: '28px', position: 'relative' }}>
          <div style={{ width: '110px', height: '110px', borderRadius: '28px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 20px 60px rgba(124,58,237,.3), 0 0 0 1px rgba(255,255,255,.1)' }}>
            <img src={logo} alt="Logo" style={{ width: '85px', objectFit: 'contain' }} />
          </div>
          {/* glow ring */}
          <div style={{ position: 'absolute', inset: '-8px', borderRadius: '36px', border: '1px solid rgba(168,85,247,.3)', pointerEvents: 'none' }} />
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124,58,237,.2)', border: '1px solid rgba(168,85,247,.3)', borderRadius: '999px', padding: '5px 16px', marginBottom: '20px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '.76rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '1px', textTransform: 'uppercase' }}>Système de gestion opérationnelle</span>
        </div>

        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem,6vw,3.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px' }}>
          Tamanar<br />
          <span style={{ background: 'linear-gradient(90deg,#a78bfa,#38bdf8,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Assistance</span>
        </h1>

        <p style={{ margin: '0 0 36px', fontSize: 'clamp(.9rem,2vw,1.1rem)', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.7 }}>
          Plateforme complète de gestion de flotte, d'interventions et de facturation pour votre équipe terrain.
        </p>

        <button onClick={() => navigate('/login')}
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px 40px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', letterSpacing: '.3px', boxShadow: '0 8px 32px rgba(124,58,237,.45)', transition: 'all .22s', marginBottom: '60px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(124,58,237,.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,.45)'; }}
        >
          Accéder au tableau de bord →
        </button>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '14px', width: '100%', maxWidth: '780px' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px', padding: '20px 16px', textAlign: 'center', backdropFilter: 'blur(10px)', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,.12)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.08)'; }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#e2e8f0', marginBottom: '4px' }}>{f.title}</div>
              <div style={{ fontSize: '.73rem', color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '18px', fontSize: '.72rem', color: '#374151', position: 'relative', zIndex: 10 }}>
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
};

export default Welcome;
