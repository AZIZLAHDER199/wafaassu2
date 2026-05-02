import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Moon, Sun, File, Clipboard, Truck, AlertCircle, FileText, Filter, X, Download, FileSpreadsheet } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface FactureData {
  id: number;
  facture_num: string;
  date: string;
  billing_company?: string;
  user?: { username: string } | null;
  montant_ttc: number;
  billing_company_name_display?: string; // Added for clarity
}

interface InterventionData {
  id: number;
  ref_dossier: string;
  assure: string;
  date_intervention: string;
  evenement: string;
  status: string;
  cout_prestation_ttc: number;
}

interface SuiviCarData {
  id: number;
  vehicule: string;
  date: string;
  prix: number;
  service: string;
  pompiste?: string;
  smitoStation: string; // Changed from 'station' to match backend field
}

interface MonthlyTotal {
  month: string;
  total_prix: number;
}

const DataTable: React.FC<{ columns: string[]; data: any[]; isDarkMode: boolean; renderActions?: (row: any) => React.ReactNode }> = ({ columns, data, isDarkMode, renderActions }) => (
  <div className="overflow-x-auto w-full">
    <table className="w-full text-left min-w-[600px]">
      <thead>
        <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-red-200'}`}>
          {columns.map(col => (
            <th key={col} className={`py-3 px-4 font-medium text-xs uppercase ${isDarkMode ? 'text-gray-400' : 'text-red-600'}`}>
              {col}
            </th>
          ))}
          {renderActions && (
            <th className={`py-3 px-4 font-medium text-xs uppercase text-right ${isDarkMode ? 'text-gray-400' : 'text-red-600'}`}>
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.length ? (
          data.map((row, index) => (
            <tr key={row.id || index} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-red-200 hover:bg-red-50'}`}>
              {columns.map(col => (
                <td key={`${col}-${row.id || index}`} className={`py-3 px-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {col === 'Smito Station' && (!row[col] || row[col] === '') ? 'Aucune station' : row[col] || 'N/A'} {/* Handle empty smitoStation */}
                </td>
              ))}
              {renderActions && (
                <td className="py-3 px-4 text-right">
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + (renderActions ? 1 : 0)} className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-red-600'}`}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const UserHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'factures' | 'interventions' | 'suiviCarburant'>('suiviCarburant');
  const [isDarkMode, setDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    return storedDarkMode ? JSON.parse(storedDarkMode) : false;
  });
  const [downloadingFactureId, setDownloadingFactureId] = useState<number | null>(null);

  const [data, setData] = useState<{
    factures: FactureData[];
    interventions: InterventionData[];
    suiviCarburant: SuiviCarData[];
  }>({
    factures: [],
    interventions: [],
    suiviCarburant: [],
  });

  const [filteredData, setFilteredData] = useState<{
    factures: FactureData[];
    interventions: InterventionData[];
    suiviCarburant: SuiviCarData[];
  }>({
    factures: [],
    interventions: [],
    suiviCarburant: [],
  });

  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);

  const [filters, setFilters] = useState<{
    startDate: string;
    endDate: string;
    reference: string;
    smitoStation: string; // Changed from 'station' to match backend
  }>({
    startDate: '',
    endDate: '',
    reference: '',
    smitoStation: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Liste des stations valides
  const validStations = ['AFRICA', 'TOTAL', 'SHELL', 'PETROM', 'AUCUNE'];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#221F1F';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#FFFFFF';
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token d\'authentification trouvé. Veuillez vous connecter.');

      const [facturesRes, interventionsRes, suiviCarRes, monthlyTotalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/get_factures/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_interventions/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant_stats/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);

      const parsedFactures: FactureData[] = facturesRes.data.map((f: any) => ({
        ...f,
        montant_ttc: parseFloat(f.montant_ttc || 0),
      }));
      const parsedInterventions: InterventionData[] = interventionsRes.data.map((i: any) => ({
        ...i,
        cout_prestation_ttc: parseFloat(i.cout_prestation_ttc || 0),
      }));
      const parsedSuiviCarburant: SuiviCarData[] = suiviCarRes.data.map((s: any) => ({
        id: s.id,
        vehicule: s.vehicule || 'N/A',
        date: s.date || '',
        prix: parseFloat(s.prix || 0),
        service: s.service || 'N/A',
        pompiste: s.pompiste || 'N/A',
        smitoStation: s.smitoStation || 'AUCUNE', // Handle empty or invalid values
      }));

      setData({
        factures: parsedFactures,
        interventions: parsedInterventions,
        suiviCarburant: parsedSuiviCarburant,
      });
      setFilteredData({
        factures: parsedFactures,
        interventions: parsedInterventions,
        suiviCarburant: parsedSuiviCarburant,
      });
      setMonthlyTotals(monthlyTotalsRes.data);
    } catch (err: any) {
      console.error('Fetch Data Error:', err.response?.data || err);
      setError(err.response?.data?.detail || err.message || 'Erreur réseau ou serveur indisponible. Vérifiez votre connexion.');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Updated mock data with valid smitoStation values
    const mockSuiviCarburant: SuiviCarData[] = [
      { id: 10, vehicule: "vehicle289", date: "2025-08-09", prix: 678.00, service: "Carburant", pompiste: "mohammed", smitoStation: "AFRICA" },
      { id: 11, vehicule: "MOD35", date: "2025-08-09", prix: 678.00, service: "Carburant", pompiste: "MOHAM", smitoStation: "TOTAL" },
      { id: 12, vehicule: "ASO546", date: "2025-08-09", prix: 888.00, service: "Carburant", pompiste: "M3TI", smitoStation: "SHELL" },
      { id: 5, vehicule: "DACIA", date: "2025-08-07", prix: 678.00, service: "Vidange", pompiste: "KAMIL", smitoStation: "AUCUNE" },
      { id: 6, vehicule: "ASO546", date: "2025-08-07", prix: 677.00, service: "Carburant", pompiste: "mohammed", smitoStation: "PETROM" },
      { id: 7, vehicule: "gd", date: "2025-08-07", prix: 400.00, service: "Carburant", pompiste: "mohammed", smitoStation: "AFRICA" },
      { id: 8, vehicule: "GHA", date: "2025-08-07", prix: 5664.00, service: "Carburant", pompiste: "MOHAM", smitoStation: "TOTAL" },
      { id: 9, vehicule: "ASO546rrr", date: "2025-08-07", prix: 2788.00, service: "Carburant", pompiste: "mohammed", smitoStation: "SHELL" },
      { id: 3, vehicule: "aziz", date: "2025-08-04", prix: 253.00, service: "Carburant", pompiste: "www", smitoStation: "AUCUNE" },
      { id: 4, vehicule: "ASO546", date: "2025-08-04", prix: 13644.00, service: "Réparation", pompiste: "M3TI", smitoStation: "PETROM" },
    ];

    setData(prev => ({
      ...prev,
      suiviCarburant: mockSuiviCarburant,
    }));
    setFilteredData(prev => ({
      ...prev,
      suiviCarburant: mockSuiviCarburant,
    }));
    fetchData();
  }, [fetchData]);

  const applyClientSideFilters = useCallback(() => {
    let filteredFactures = [...data.factures];
    let filteredInterventions = [...data.interventions];
    let filteredSuiviCarburant = [...data.suiviCarburant];

    const { startDate, endDate, reference, smitoStation } = filters;

    if (startDate) {
      filteredFactures = filteredFactures.filter(f => new Date(f.date) >= new Date(startDate));
      filteredInterventions = filteredInterventions.filter(i => new Date(i.date_intervention) >= new Date(startDate));
      filteredSuiviCarburant = filteredSuiviCarburant.filter(s => new Date(s.date) >= new Date(startDate));
    }
    if (endDate) {
      filteredFactures = filteredFactures.filter(f => new Date(f.date) <= new Date(endDate));
      filteredInterventions = filteredInterventions.filter(i => new Date(i.date_intervention) <= new Date(endDate));
      filteredSuiviCarburant = filteredSuiviCarburant.filter(s => new Date(s.date) <= new Date(endDate));
    }
    if (reference) {
      filteredFactures = filteredFactures.filter(f => f.facture_num?.toLowerCase().includes(reference.toLowerCase()));
      filteredInterventions = filteredInterventions.filter(i => i.ref_dossier?.toLowerCase().includes(reference.toLowerCase()));
      filteredSuiviCarburant = filteredSuiviCarburant.filter(s => s.vehicule?.toLowerCase().includes(reference.toLowerCase()));
    }
    if (smitoStation && activeTab === 'suiviCarburant') {
      filteredSuiviCarburant = filteredSuiviCarburant.filter(s => 
        smitoStation === 'AUCUNE' ? !s.smitoStation || s.smitoStation === 'AUCUNE' : s.smitoStation.toLowerCase().includes(smitoStation.toLowerCase())
      );
    }

    setFilteredData({
      factures: filteredFactures,
      interventions: filteredInterventions,
      suiviCarburant: filteredSuiviCarburant,
    });
  }, [data, filters, activeTab]);

  const applyFilters = useCallback(async () => {
    const { startDate, endDate, reference, smitoStation } = filters;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Aucun token d\'authentification trouvé. Veuillez vous connecter.');
      setLoading(false);
      return;
    }

    try {
      const params = {
        date_from: startDate,
        date_to: endDate,
        ref_dossier: reference,
        smitoStation: smitoStation === 'AUCUNE' ? '' : smitoStation, // Handle AUCUNE as empty string
      };

      const [facturesRes, interventionsRes, suiviCarRes, monthlyTotalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/get_factures/`, { headers: { Authorization: `Bearer ${token}` }, params: { date_from: startDate, date_to: endDate, societe_assistance: reference } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_interventions/`, { headers: { Authorization: `Bearer ${token}` }, params: { date_from: startDate, date_to: endDate, ref_dossier: reference } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant/`, { headers: { Authorization: `Bearer ${token}` }, params }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant_stats/`, { headers: { Authorization: `Bearer ${token}` }, params: { date_from: startDate, date_to: endDate } }).catch(() => ({ data: [] })),
      ]);

      const parsedFactures: FactureData[] = facturesRes.data.map((f: any) => ({
        ...f,
        montant_ttc: parseFloat(f.montant_ttc || 0),
      }));
      const parsedInterventions: InterventionData[] = interventionsRes.data.map((i: any) => ({
        ...i,
        cout_prestation_ttc: parseFloat(i.cout_prestation_ttc || 0),
      }));
      const parsedSuiviCarburant: SuiviCarData[] = suiviCarRes.data.map((s: any) => ({
        id: s.id,
        vehicule: s.vehicule || 'N/A',
        date: s.date || '',
        prix: parseFloat(s.prix || 0),
        service: s.service || 'N/A',
        pompiste: s.pompiste || 'N/A',
        smitoStation: s.smitoStation || 'AUCUNE', // Handle empty or invalid values
      }));

      setFilteredData({
        factures: parsedFactures,
        interventions: parsedInterventions,
        suiviCarburant: parsedSuiviCarburant,
      });
      setMonthlyTotals(monthlyTotalsRes.data);
    } catch (err: any) {
      console.error('Apply Filters Error:', err.response?.data || err);
      setError(err.response?.data?.detail || err.message || 'Erreur réseau ou serveur indisponible. Vérifiez votre connexion.');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFilterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (data.factures.length + data.interventions.length + data.suiviCarburant.length < 100) {
      applyClientSideFilters();
    } else {
      applyFilters();
    }
  }, [applyClientSideFilters, applyFilters, data]);

  const handleClearFilters = useCallback(() => {
    setFilters({ startDate: '', endDate: '', reference: '', smitoStation: '' });
    setFilteredData(data);
    setMonthlyTotals([]);
    fetchData();
  }, [data, fetchData]);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);

  const handleGenerateFacture = useCallback(
    async (interventionId: number) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token d\'authentification trouvé. Veuillez vous connecter.');
        navigate(`/generate-facture/${interventionId}`);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Erreur lors de la génération de la facture.';
        alert(`Erreur: ${errorMessage}`);
        console.error('Generate Facture Error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    },
    [navigate]
  );

  const handleDownloadFacture = useCallback(
    async (factureId: number, factureNum: string) => {
      setDownloadingFactureId(factureId);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token d\'authentification manquant.');

        const response = await axios.get(
          `${API_BASE_URL}/api/download_facture_pdf/${factureId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture_${factureNum.replace('/', '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Erreur lors du téléchargement de la facture.';
        alert(`Erreur: ${errorMessage}`);
        console.error('Download Facture Error:', err.response?.data || err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setDownloadingFactureId(null);
      }
    },
    [navigate]
  );

  const handleExportToExcel = (data: any[], headers: string[], fileName: string) => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.map(h => `"${h}"`).join(';') + '\n'
      + data.map(row => 
        headers.map(h => 
          `"${(row[h] || '').toString().replace(/"/g, '""')}"`
        ).join(';')
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalInterventions = filteredData.interventions.length;
  const totalFactures = filteredData.factures.length;
  const totalSuiviCarburant = filteredData.suiviCarburant.length;
  const totalCoutInterventions = filteredData.interventions.reduce((total, i) => total + (i.cout_prestation_ttc || 0), 0);
  const totalMontantFactures = filteredData.factures.reduce((total, f) => total + (f.montant_ttc || 0), 0);
  const totalPrixSuivi = filteredData.suiviCarburant.reduce((total, s) => total + (s.prix || 0), 0);

  const getTableColumns = (tab: string) => {
    switch (tab) {
      case 'interventions':
        return ['Ref Dossier', 'Assuré', 'Date Intervention', 'Événement', 'Statut', 'Coût TTC'];
      case 'factures':
        return ['N° Facture', 'Date', 'Société', 'Montant TTC'];
      case 'suiviCarburant':
        return ['Véhicule', 'Date', 'Prix', 'Service', 'Pompiste', 'Smito Station']; // Updated column name
      default:
        return [];
    }
  };

  const getTableData = (tab: string) => {
    switch (tab) {
      case 'interventions':
        return filteredData.interventions.map(i => ({
          id: i.id,
          'Ref Dossier': i.ref_dossier || 'N/A',
          Assuré: i.assure || 'N/A',
          'Date Intervention': i.date_intervention ? new Date(i.date_intervention).toLocaleDateString('fr-FR') : 'N/A',
          Événement: i.evenement || 'N/A',
          Statut: i.status || 'N/A',
          'Coût TTC': `${i.cout_prestation_ttc?.toFixed(2) || '0.00'} DH`,
        }));
      case 'factures':
        return filteredData.factures.map(f => ({
          id: f.id,
          'N° Facture': f.facture_num || 'N/A',
          Date: f.date ? new Date(f.date).toLocaleDateString('fr-FR') : 'N/A',
          Société: f.billing_company_name_display || f.billing_company || 'N/A', // Use display name if available
          'Montant TTC': `${f.montant_ttc?.toFixed(2) || '0.00'} DH`,
        }));
      case 'suiviCarburant':
        return filteredData.suiviCarburant.map(s => ({
          id: s.id,
          Véhicule: s.vehicule || 'N/A',
          Date: s.date ? new Date(s.date).toLocaleDateString('fr-FR') : 'N/A',
          Prix: `${s.prix?.toFixed(2) || '0.00'} DH`,
          Service: s.service || 'N/A',
          Pompiste: s.pompiste || 'N/A',
          'Smito Station': s.smitoStation || 'AUCUNE', // Handle empty or invalid values
        }));
      default:
        return [];
    }
  };

  const getMonthlyTotalTableData = (tab: string) => {
    if (tab !== 'suiviCarburant') return [];
    return monthlyTotals.map(t => ({
      Mois: t.month,
      'Total Prix (DH)': `${t.total_prix.toFixed(2)} DH`,
    }));
  };

  const getTableHeaders = (tab: string) => {
    switch (tab) {
      case 'interventions':
        return ['Ref Dossier', 'Assuré', 'Date Intervention', 'Événement', 'Statut', 'Coût TTC'];
      case 'factures':
        return ['N° Facture', 'Date', 'Société', 'Montant TTC'];
      case 'suiviCarburant':
        return ['Véhicule', 'Date', 'Prix', 'Service', 'Pompiste', 'Smito Station']; // Updated column name
      default:
        return [];
    }
  };

  const areFiltersActive = filters.startDate || filters.endDate || filters.reference || filters.smitoStation;

  if (loading) {
    return (
      <div className={`min-h-screen w-screen flex items-center justify-center ${isDarkMode ? 'bg-[#221F1F] text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
          <p className="ml-4 text-lg text-red-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen w-screen flex items-center justify-center ${isDarkMode ? 'bg-[#221F1F] text-white' : 'bg-white text-gray-800'}`}>
        <div className="p-6 bg-red-100 text-red-800 rounded-lg shadow-md flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <p className="text-lg font-medium">{error}</p>
          <button onClick={() => navigate('/login')} className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            Aller à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-screen ${isDarkMode ? 'bg-gradient-to-br from-red-900 to-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300 flex flex-col`}>
      <header className={`w-full px-6 py-4 flex justify-between items-center shadow-md ${isDarkMode ? 'bg-gray-900' : 'bg-white'} flex-shrink-0`}>
        <h1 className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}>
          Votre Historique d'Activités
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-200 ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            title={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
          >
            {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            <ChevronLeft className="h-5 w-5" /> Retour
          </button>
        </div>
      </header>

      <main className="p-6 flex-grow overflow-y-auto">
        <section className={`bg-${isDarkMode ? 'gray-900' : 'white'} p-6 rounded-none shadow-xl space-y-8 h-full`}>
          <form onSubmit={handleFilterSubmit} className={`grid grid-cols-1 md:grid-cols-5 gap-4 p-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg shadow-inner relative`}>
            {areFiltersActive && (
              <span className="absolute top-2 right-2 text-sm text-green-500">Filtres actifs</span>
            )}
            <div className="flex flex-col">
              <label htmlFor="startDate" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Date de début</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:border-gray-500'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Date de fin</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:border-gray-500'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="reference" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Référence</label>
              <input
                id="reference"
                name="reference"
                type="text"
                placeholder={activeTab === 'factures' ? 'Numéro de facture' : activeTab === 'interventions' ? 'Réf. dossier' : 'Véhicule'}
                value={filters.reference}
                onChange={handleFilterChange}
                className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:border-gray-500'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
              />
            </div>
            {activeTab === 'suiviCarburant' && (
              <div className="flex flex-col">
                <label htmlFor="smitoStation" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Smito Station</label>
                <select
                  id="smitoStation"
                  name="smitoStation"
                  value={filters.smitoStation}
                  onChange={handleFilterChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:border-gray-500'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                >
                  <option value="">Toutes les stations</option>
                  {validStations.map(station => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className={`flex items-center gap-2 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-md font-semibold`}
              >
                <Filter className="h-5 w-5" /> Filtrer
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 ${isDarkMode ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} transition font-semibold`}
              >
                <X className="h-5 w-5" /> Effacer
              </button>
            </div>
          </form>

          <div className={`flex flex-wrap gap-4 mb-6 border-b pb-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {['interventions', 'factures', 'suiviCarburant'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab
                    ? 'bg-red-600 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'factures' && <File className="h-5 w-5" />}
                {tab === 'interventions' && <Clipboard className="h-5 w-5" />}
                {tab === 'suiviCarburant' && <Truck className="h-5 w-5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>

          <div className="h-full">
            {activeTab === 'factures' && (
              <>
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vos Factures</h2>
                <DataTable
                  columns={getTableColumns('factures')}
                  data={getTableData('factures')}
                  isDarkMode={isDarkMode}
                  renderActions={(row) => (
                    <button
                      onClick={() => {
                        const factureNum = row['N° Facture'];
                        if (factureNum && factureNum !== 'N/A') {
                          handleDownloadFacture(row.id, factureNum);
                        } else {
                          alert("Numéro de facture non disponible.");
                        }
                      }}
                      disabled={downloadingFactureId === row.id}
                      className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                      title="Télécharger la Facture"
                    >
                      {downloadingFactureId === row.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block" />
                      ) : (
                        <Download className="h-4 w-4 inline-block mr-1" />
                      )}
                      {downloadingFactureId === row.id ? 'Tél.' : 'Télécharger'}
                    </button>
                  )}
                />
                <h2 className={`text-2xl font-bold mt-8 mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total des Factures</h2>
                <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} shadow-md`}>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="font-bold">Nombre total de factures :</span> {totalFactures}
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="font-bold">Montant TTC total :</span> {totalMontantFactures.toFixed(2)} DH
                  </p>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleExportToExcel(getTableData('factures'), getTableHeaders('factures'), 'factures')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}><FileSpreadsheet className="h-5 w-5" /> Exporter</button>
                </div>
              </>
            )}
            {activeTab === 'interventions' && (
              <>
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vos Interventions</h2>
                <DataTable
                  columns={getTableColumns('interventions')}
                  data={getTableData('interventions')}
                  isDarkMode={isDarkMode}
                  renderActions={(row) => (
                    <button
                      onClick={() => handleGenerateFacture(row.id)}
                      className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                      title="Générer Facture"
                    >
                      <FileText className="h-4 w-4 inline-block mr-1" /> Facture
                    </button>
                  )}
                />
                <h2 className={`text-2xl font-bold mt-8 mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total des Interventions</h2>
                <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} shadow-md`}>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="font-bold">Nombre total d'interventions :</span> {totalInterventions}
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="font-bold">Coût total des prestations :</span> {totalCoutInterventions.toFixed(2)} DH
                  </p>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleExportToExcel(getTableData('interventions'), getTableHeaders('interventions'), 'interventions')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}><FileSpreadsheet className="h-5 w-5" /> Exporter</button>
                </div>
              </>
            )}
            {activeTab === 'suiviCarburant' && (
              <>
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Suivi Carburant</h2>
                <DataTable
                  columns={getTableColumns('suiviCarburant')}
                  data={getTableData('suiviCarburant')}
                  isDarkMode={isDarkMode}
                />
                <h2 className={`text-2xl font-bold mt-8 mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Prix par Mois</h2>
                <DataTable
                  columns={['Mois', 'Total Prix (DH)']}
                  data={getMonthlyTotalTableData('suiviCarburant')}
                  isDarkMode={isDarkMode}
                />
                <h2 className={`text-2xl font-bold mt-8 mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total du Suivi Carburant</h2>
                <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} shadow-md`}>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="font-bold">Nombre total de pleins :</span> {totalSuiviCarburant}
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="font-bold">Coût total du carburant :</span> {totalPrixSuivi.toFixed(2)} DH
                  </p>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleExportToExcel(getTableData('suiviCarburant'), getTableHeaders('suiviCarburant'), 'suivi-carburant')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}><FileSpreadsheet className="h-5 w-5" /> Exporter</button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className={`text-center py-6 mt-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
        © 2025 TAMANAR ASSISTANCE. Tous droits réservés.
      </footer>
    </div>
  );
};

export default UserHistoryPage;