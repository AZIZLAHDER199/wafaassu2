import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

interface NavbarProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showDarkModeToggle?: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  showBackButton = true,
  onBackClick,
  children,
}) => {
  const navigate = useNavigate();

  const handleBackClick = useCallback(() => {
    if (onBackClick) onBackClick();
    else navigate(-1);
  }, [navigate, onBackClick]);

  return (
    <nav style={{
      background: 'linear-gradient(135deg,#1a0533 0%,#2d1060 50%,#1e3a5f 100%)',
      padding: '0 clamp(14px,3vw,28px)',
      height: '62px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0,0,0,.25)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '12px',
      fontFamily: 'Segoe UI,system-ui,sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showBackButton && (
          <button onClick={handleBackClick}
            style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
          >
            <ChevronLeft size={15} /> Retour
          </button>
        )}
        <button onClick={() => navigate('/home')}
          style={{ background: 'rgba(168,85,247,.2)', border: '1px solid rgba(168,85,247,.3)', color: '#c4b5fd', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,.2)'; }}
        >
          <Home size={14} /> Accueil
        </button>
      </div>

      <h1 style={{ margin: 0, fontSize: 'clamp(.88rem,2vw,1rem)', fontWeight: 800, color: '#fff', letterSpacing: '.3px', flex: 1, textAlign: 'center' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'max-content' }}>
        {children}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
