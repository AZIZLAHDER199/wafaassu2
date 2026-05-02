import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, User, Moon, Sun, Bell, Search } from 'lucide-react'; // Icônes suggérées

interface NavbarProps {
  title: string; // Le titre de la page actuelle
  showBackButton?: boolean; // واش نبينو زر "Retour"
  onBackClick?: () => void; // Fonction à appeler quand on clique sur "Retour"
  showDarkModeToggle?: boolean; // واش نبينو زر الوضع الليلي/النهاري
  isDarkMode?: boolean; // واش رانا ف'الوضع الليلي
  onToggleDarkMode?: () => void; // Fonction pour changer le mode
  children?: React.ReactNode; // اقتراحات إضافية (مثل أزرار، بحث، إلخ)
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  showBackButton = true, // Par défaut, on affiche le bouton Retour
  onBackClick,
  showDarkModeToggle = true, // Par défaut, on affiche le toggle du mode sombre
  isDarkMode,
  onToggleDarkMode,
  children, // Pour les éléments additionnels
}) => {
  const navigate = useNavigate();

  // Fonction pour gérer le clic sur le bouton Retour
  const handleBackClick = useCallback(() => {
    if (onBackClick) {
      onBackClick(); // Si une fonction spécifique est passée, on l'appelle
    } else {
      navigate(-1); // Sinon, on revient à la page précédente dans l'historique
    }
  }, [navigate, onBackClick]);

  return (
    <nav className={`w-full p-4 shadow-md z-10 
      ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} 
      flex items-center justify-between transition-colors duration-300`}>
      
      {/* Bouton Retour */}
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className={`p-2 rounded-lg 
              ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} 
              transition-colors duration-200 flex items-center mr-4`}
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Retour</span> {/* Cache le texte sur petits écrans */}
          </button>
        )}
        
        {/* Titre de la page */}
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
          {title}
        </h1>
      </div>

      {/* Boutons d'actions et suggestions */}
      <div className="flex items-center space-x-3">
        {children} {/* هنا فين كتحط الاقتراحات ديالك لي بغيتي تزيدها */}

        {/* Bouton Dark Mode Toggle (اقتراح) */}
        {showDarkModeToggle && (
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg 
              ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} 
              transition-colors duration-200`}
            aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Bouton Paramètres (اقتراح) */}
        {/* <button 
          className={`p-2 rounded-lg 
            ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} 
            transition-colors duration-200`}
          aria-label="Paramètres"
        >
          <Settings className="w-5 h-5" />
        </button> */}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);