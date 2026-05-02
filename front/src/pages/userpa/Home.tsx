import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (token) {
      setIsAuthenticated(true);
      setUsername(storedUsername || 'Utilisateur');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    navigate('/logout'); // production logout page
  }, [navigate]);

  return (
    <div className="min-h-screen w-screen bg-[#f6f8f6] flex flex-col">

      {/* ===== HEADER ===== */}
      <header className="w-full bg-white border-b border-[#e7f3e7] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Tamanar Assistance" className="h-10" />
          <span className="font-extrabold text-[#0d1b0d] tracking-wide uppercase">
            Tamanar Assistance
          </span>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Se déconnecter
          </button>
        )}
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {isAuthenticated ? (
          <div className="w-full max-w-5xl">

            {/* Welcome */}
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0d1b0d] mb-2">
                Bonjour, <span className="text-[#1a7f37]">{username}</span> 👋
              </h1>
              <p className="text-gray-600">
                Choisissez une opération pour continuer
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">

              <ActionCard
                icon="🚛"
                title="Registre Intervention"
                desc="Créer et gérer les interventions"
                onClick={() => navigate('/operation?type=intervention')}
              />

              <ActionCard
                icon="⛽"
                title="Suivi Carburant"
                desc="Suivi de la consommation"
                onClick={() => navigate('/operation?type=suivi_carburant')}
              />

              <ActionCard
                icon="📚"
                title="Historique"
                desc="Consulter les opérations passées"
                onClick={() => navigate('/userhistory')}
              />

              <ActionCard
                icon="📊"
                title="Statistiques"
                desc="Rapports et analyses"
                onClick={() => navigate('/statistics')}
              />

            </div>
          </div>
        ) : (
          <div className="text-center max-w-xl">
            <img src={logo} alt="Tamanar Assistance" className="w-40 mx-auto mb-8" />
            <h1 className="text-3xl font-extrabold text-[#0d1b0d] mb-4">
              Bienvenue sur Tamanar Assistance
            </h1>
            <p className="text-gray-600 mb-8">
              Vous devez vous connecter pour accéder aux fonctionnalités.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#0d1b0d] text-white font-semibold
                         py-3 px-8 rounded-lg hover:bg-[#1a2e1a]
                         transition shadow-md"
            >
              Se connecter
            </button>
          </div>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="text-center text-xs text-gray-500 py-4 border-t border-[#e7f3e7]">
        © 2025 Tamanar Assistance — Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default Home;

/* ===== CARD COMPONENT ===== */
const ActionCard = ({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="bg-white border border-[#e7f3e7] rounded-lg p-6
               hover:shadow-xl transition-all hover:-translate-y-1
               text-left"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-[#0d1b0d] mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{desc}</p>
  </button>
);
