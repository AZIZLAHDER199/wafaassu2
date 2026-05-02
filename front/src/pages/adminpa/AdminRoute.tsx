import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Composant de Route Protégée pour les Utilisateurs Non-Administrateurs (ex: /home).
 *
 * Ce composant vérifie si l'utilisateur est connecté et s'il n'a PAS le rôle 'admin'.
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion (/login).
 * Si l'utilisateur est connecté et est un administrateur, il est redirigé vers le tableau de bord admin (/admin).
 * Si l'utilisateur est connecté et n'est pas administrateur, le contenu enfant (la page /home) est affiché.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Le composant ou l'élément à rendre si l'utilisateur est autorisé.
 * @returns {React.ReactElement} Le composant enfant ou une redirection.
 */
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Récupère le token d'authentification depuis le localStorage.
  const token = localStorage.getItem('token');

  // Récupère le rôle de l'utilisateur depuis le localStorage.
  // Il est important d'utiliser la même clé ('userRole') que dans AdminRoute et LoginPage.
  const userRole = localStorage.getItem('userRole');

  console.log('UserRoute - Vérification d\`accès...');
  console.log('UserRoute - Token trouvé:', token ? 'Oui' : 'Non');
  console.log('UserRoute - Rôle trouvé:', userRole);

  // --- Première vérification : L'utilisateur est-il connecté ? ---
  if (!token) {
    console.log('UserRoute - Redirection vers /login (aucun token)');
    // Redirige vers la page de connexion.
    return <Navigate to="/login" replace />;
  }

  // --- Deuxième vérification : L'utilisateur connecté est-il un administrateur ? ---
  // Si l'utilisateur a le rôle 'admin', il ne doit pas accéder à cette route (ex: /home).
  if (userRole === 'admin') {
    console.log('UserRoute - Redirection vers /admin (utilisateur est admin)');
    // Redirige l'administrateur vers son tableau de bord.
    return <Navigate to="/admin" replace />;
  }

  // --- Accès autorisé pour les utilisateurs non-administrateurs ---
  // Si on arrive ici, c'est que le token existe ET que userRole n'est PAS 'admin'.
  console.log('UserRoute - Accès autorisé pour l\`utilisateur non-admin.');
  // Rend le contenu protégé (le composant enfant passé en props, ex: la page /home).
  return <>{children}</>;
};

export default UserRoute;

