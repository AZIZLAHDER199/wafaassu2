import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import logo from './assets/logo.png';

const AddUserForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/add_user/', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setSuccess('Utilisateur ajouté avec succès!');
      setFormData({ username: '', email: '', password: '', age: '' });
      setTimeout(() => navigate('/users'), 2000);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentification échouée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || `Erreur lors de l'ajout de l'utilisateur: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-blue-800 via-indigo-700 to-purple-800">
      {/* Logo and branding section - Left side on desktop, top on mobile */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all duration-300"
          >
            <FaArrowLeft />
            <span>Retour</span>
          </button>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Logo with animation */}
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <img 
              src={logo} 
              alt="Logo" 
              className="relative w-32 h-32 object-contain transform group-hover:scale-110 transition-transform duration-500" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2ZmMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9nbzwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center tracking-tight">
            Ajouter un Nouvel Utilisateur
          </h1>
          
          <p className="text-white/80 text-center max-w-md mb-8">
            Créez un nouveau compte utilisateur en remplissant le formulaire ci-contre avec les informations requises.
          </p>
          
          {/* Features or benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
              <h3 className="text-white font-semibold mb-2">Accès Sécurisé</h3>
              <p className="text-white/80 text-sm">Protection des données et authentification avancée.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
              <h3 className="text-white font-semibold mb-2">Interface Intuitive</h3>
              <p className="text-white/80 text-sm">Navigation simple et expérience utilisateur optimisée.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-auto text-center text-white/60 text-sm">
          © {new Date().getFullYear()} Lahderaziz. Tous droits réservés.
        </div>
      </div>
      
      {/* Form section - Right side on desktop, bottom on mobile */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center p-6 md:p-12 bg-white/10 backdrop-blur-xl">
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border-l-4 border-red-500 text-white animate-fadeIn">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border-l-4 border-green-500 text-white animate-fadeIn">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-300">
                  <FaUser />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Entrez le nom d'utilisateur"
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-300">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Entrez l'adresse email"
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-300">
                  <FaLock />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Entrez le mot de passe"
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="age" className="block text-sm font-medium text-white mb-2">Âge</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-300">
                  <FaCalendarAlt />
                </div>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  placeholder="Entrez l'âge"
                  min="1"
                  max="120"
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement en cours...
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserForm;
