import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  const confirmLogout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('is_admin');

    navigate('/login');
  };

  return (
    <div className="min-h-screen w-screen bg-[#f6f8f6] flex items-center justify-center px-4">
      <div className="bg-white border border-[#e7f3e7] shadow-xl rounded-lg p-8 w-full max-w-md">

        <h1 className="text-2xl font-extrabold text-[#0d1b0d] mb-4">
          Déconnexion
        </h1>

        <p className="text-gray-600 mb-8">
          Voulez-vous vraiment vous déconnecter de votre session ?
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>

          <button
            onClick={confirmLogout}
            className="px-5 py-2 bg-[#0d1b0d] text-white font-semibold
                       rounded hover:bg-[#1a2e1a]"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
