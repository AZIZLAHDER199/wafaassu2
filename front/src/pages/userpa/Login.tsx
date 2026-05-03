import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiLock, FiAlertCircle, FiLogIn } from 'react-icons/fi';
import './Login.css';
import logo from './assets/logo.png';

const API_BASE_URL = '';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string>('');
  const [loading, setLoading]   = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/apilogin/`, { username, password });
      const { access, is_admin, username: loggedInUsername } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('isAdmin', is_admin ? 'true' : 'false');
      localStorage.setItem('username', loggedInUsername);
      navigate('/home');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Identifiants incorrects.';
      setErrorKey(k => k + 1);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo-wrap">
          <img src={logo} alt="Tamanar Assistance" className="login-logo" />
        </div>

        <h2 className="login-title">Bienvenue</h2>
        <p className="login-subtitle">Connectez-vous pour accéder au tableau de bord</p>
        <hr className="login-divider" />

        <form onSubmit={handleLogin} noValidate>
          {error && (
            <div key={errorKey} className="login-error">
              <FiAlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="login-label">Nom d'utilisateur</label>
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Entrez votre nom d'utilisateur"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="login-label">Mot de passe</label>
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                type="password"
                className="input-field"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />
                Connexion en cours…
              </>
            ) : (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                <FiLogIn /> SE CONNECTER
              </span>
            )}
          </button>
        </form>

        <p className="login-note">Accès réservé au personnel autorisé — © 2025 Tamanar Assistance</p>
      </div>
    </div>
  );
}
