import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiFileText, FiTruck, FiDollarSign, FiArrowLeft, FiFilter, FiPlus, FiEdit, FiTrash, FiHome, FiLogOut, FiMenu, FiX } from "react-icons/fi";

interface InterventionData {
  id: number;
  date_intervention: string;
  user?: { username: string } | null;
  evenement: string;
  status: string;
  assure?: string;
  immatriculation?: string;
  marque?: string;
  lieu_intervention?: string;
  destination?: string;
  cout_ttc?: number;
  tva?: number;
}

const InterventionRecords: React.FC = () => {
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<InterventionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [interventionsCount, setInterventionsCount] = useState<number>(0);
  const [lastEditDate, setLastEditDate] = useState<string | null>(null);

  useEffect(() => {
    console.log('InterventionRecords: useEffect triggered at', new Date().toLocaleTimeString());
    const token = localStorage.getItem('token');
    console.log('Token found:', token ? 'Yes' : 'No', 'Value:', token);
    if (!token) {
      console.log('No token, redirecting to login');
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }

    const fetchInterventions = async () => {
      console.log('Fetching interventions from:', 'http://localhost:8000/api/get_interventions/');
      setLoading(true);
      setError(null);
      try {
        const url = new URL('http://localhost:8000/api/get_interventions/');
        if (filterStatus) url.searchParams.append('status', filterStatus);
        if (filterDateFrom) url.searchParams.append('date_from', filterDateFrom);
        console.log('Fetch URL:', url.toString());

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.log('Fetch response details:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            body: errorText,
          });
          if (response.status === 401) {
            console.log('401 Unauthorized, attempting to refresh token');
            const newToken = await refreshToken();
            if (newToken) return fetchInterventions();
          } else if (response.status === 404) {
            throw new Error(`Endpoint not found: ${response.url} - ${errorText}`);
          }
          throw new Error(`Failed to fetch interventions: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('Fetched data length:', data.length, 'Data:', data);
        setInterventions(data);
        setInterventionsCount(data.length);
        if (data.length > 0) {
          const sortedData = data.sort((a, b) =>
            new Date(b.date_intervention).getTime() - new Date(a.date_intervention).getTime()
          );
          setLastEditDate(sortedData[0].date_intervention);
        } else {
          setLastEditDate(null);
          console.log('No interventions found in response');
        }
      } catch (error) {
        console.error('Fetch error details:', error);
        setError((error as Error).message || 'Unknown error occurred');
        console.log('Error set to:', (error as Error).message);
      } finally {
        setLoading(false);
        console.log('Loading state set to false, interventions count:', interventions.length);
      }
    };

    fetchInterventions();
  }, [navigate, filterStatus, filterDateFrom]);

  const refreshToken = async (): Promise<string | null> => {
    console.log('Refreshing token at', new Date().toLocaleTimeString());
    const refresh = localStorage.getItem('refresh_token');
    console.log('Refresh token found:', refresh ? 'Yes' : 'No');
    if (!refresh) {
      console.log('No refresh token, redirecting to login');
      alert('No refresh token found. Please log in again.');
      navigate('/login');
      return null;
    }
    try {
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      const data = await response.json();
      console.log('Token refresh response:', data);
      if (response.ok) {
        localStorage.setItem('token', data.access);
        console.log('New token stored:', data.access);
        return data.access;
      } else {
        console.log('Token refresh failed:', data);
        alert('Token refresh failed: ' + JSON.stringify(data));
        navigate('/login');
        return null;
      }
    } catch (error) {
      console.log('Error refreshing token:', error);
      alert('Error refreshing token: ' + error);
      navigate('/login');
      return null;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Supprimer l'intervention ${id}?`)) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/intervention/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Delete fetch response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: errorText,
        });
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) return handleDelete(id);
        }
        throw new Error(`Failed to delete intervention: ${response.status} - ${errorText}`);
      }

      setInterventions(interventions.filter(intervention => intervention.id !== id));
      setInterventionsCount(interventionsCount - 1);
      alert('Intervention supprimée avec succès');
    } catch (error) {
      console.error('Error deleting intervention:', error);
      alert(`Échec de la suppression: ${error}`);
    }
  };

  console.log('Rendering InterventionRecords at', new Date().toLocaleTimeString(), 'State:', { loading, error, interventionsLength: interventions.length });

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-500 text-xl">Chargement des interventions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="bg-red-500/20 backdrop-blur-md p-8 rounded-xl max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Erreur</h2>
          <p className="text-white">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 h-14 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <div className="flex items-center ml-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 mr-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2RjMjYyNiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TA==';
                }}
              />
              <h1 className="text-xl font-bold text-white hidden sm:block">Tamanar Assistance</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/home')}
              className="flex items-center px-3 py-1 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
            >
              <FiHome className="mr-1" />
              <span className="hidden sm:inline">Accueil</span>
            </button>
            <button 
              onClick={() => navigate('/logout')}
              className="flex items-center px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-sm"
            >
              <FiLogOut className="mr-1" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-black border-r border-gray-800 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden flex flex-col`}
        >
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              <Link 
                to="/intervention-records-data" 
                className="flex items-center px-3 py-2 text-gray-300 bg-gray-800 rounded-md transition-colors mb-1"
              >
                <FiFileText className="mr-3 text-red-500" />
                Interventions
              </Link>
              <Link 
                to="/suivi-carburant-records" 
                className="flex items-center px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors mb-1"
              >
                <FiTruck className="mr-3 text-red-500" />
                Suivi Carburant
              </Link>
              <Link 
                to="/facture-records" 
                className="flex items-center px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors mb-1"
              >
                <FiDollarSign className="mr-3 text-red-500" />
                Factures
              </Link>
            </nav>
            
            {/* Stats */}
            <div className="px-4 py-2">
              <h3 className="text-sm font-semibold text-white mb-2 border-b border-gray-800 pb-1">Statistiques</h3>
              
              <div className="space-y-2">
                <div className="bg-gray-900 rounded-md p-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Interventions</p>
                      <p className="text-lg font-bold text-white">{interventionsCount}</p>
                    </div>
                    <div className="bg-red-900 bg-opacity-50 p-1 rounded-md">
                      <FiFileText className="text-red-500" size={16} />
                    </div>
                  </div>
                </div>
              </div>
              
              {lastEditDate && (
                <div className="mt-3 pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-400">Dernière modification</p>
                  <p className="text-sm font-medium text-gray-300">{new Date(lastEditDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-black flex flex-col">
          <div className="bg-gradient-to-r from-red-900 to-black p-3 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Enregistrements d'Intervention</h2>
            <p className="text-gray-400 text-sm">
              Liste des interventions
            </p>
          </div>
          
          {/* Filter Section */}
          <section className="p-4">
            <div className="flex space-x-4 mb-4">
              <select
                value={filterStatus || ""}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
              >
                <option value="">Tous les statuts</option>
                <option value="impayé">Impayé</option>
                <option value="payé">Payé</option>
              </select>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
              />
              <button
                onClick={() => setInterventions([])} // Reset to refetch
                className="flex items-center px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                <FiFilter className="mr-2" /> Filtrer
              </button>
            </div>
          </section>

          {/* Interventions List */}
          <section className="flex-1 overflow-auto p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="p-3 rounded-tl-lg">ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Utilisateur</th>
                        <th className="p-3">Événement</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Assuré</th>
                        <th className="p-3">Immatriculation</th>
                        <th className="p-3">Marque</th>
                        <th className="p-3">Lieu</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Coût TTC</th>
                        <th className="p-3">TVA</th>
                        <th className="p-3 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions.map((intervention, index) => (
                        <tr
                          key={intervention.id}
                          className={`${
                            index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'
                          } hover:bg-gray-700 transition-colors`}
                        >
                          <td className="p-3">{intervention.id}</td>
                          <td className="p-3">{new Date(intervention.date_intervention).toLocaleDateString()}</td>
                          <td className="p-3">{intervention.user?.username || 'N/A'}</td>
                          <td className="p-3">{intervention.evenement}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                intervention.status === 'payé'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {intervention.status}
                            </span>
                          </td>
                          <td className="p-3">{intervention.assure || 'N/A'}</td>
                          <td className="p-3">{intervention.immatriculation || 'N/A'}</td>
                          <td className="p-3">{intervention.marque || 'N/A'}</td>
                          <td className="p-3">{intervention.lieu_intervention || 'N/A'}</td>
                          <td className="p-3">{intervention.destination || 'N/A'}</td>
                          <td className="p-3">{intervention.cout_ttc?.toFixed(2) || '0.00'}</td>
                          <td className="p-3">{intervention.tva?.toFixed(2) || '0.00'}</td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <button
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                                onClick={() => navigate(`/edit-intervention/${intervention.id}`)}
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                                onClick={() => handleDelete(intervention.id)}
                              >
                                <FiTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {interventions.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    Aucune intervention trouvée.
                  </div>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-400">
                    Affichage de {interventions.length} interventions
                  </p>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50" disabled>
                      Précédent
                    </button>
                    <button className="px-4 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50" disabled>
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <div className="bg-black border-t border-gray-800 p-2 text-center text-gray-500 text-xs">
            © {new Date().getFullYear()} Tamanar Assistance. Tous droits réservés.
          </div>
        </main>
      </div>
    </div>
  );
};

export default InterventionRecords;