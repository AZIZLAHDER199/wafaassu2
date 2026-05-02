import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const API_BASE_URL = 'http://127.0.0.1:8000';

interface StatsData {
  interventions: { month: string; total: number }[];
  factures: { month: string; total: number }[];
  carburant: { month: string; total: number }[];
  interventionTypes: { evenement: string; total: number }[];
  insuranceCompanies: { billing_company: string; total: number }[];
  topLocations: { assure: string; total: number }[];
  fleetConsumption: { vehicule: string; total: number }[];
  profitLoss: { month: string; profit_loss: number }[];
}

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    return storedDarkMode ? JSON.parse(storedDarkMode) : false;
  });
  const [statsData, setStatsData] = useState<StatsData>({
    interventions: [],
    factures: [],
    carburant: [],
    interventionTypes: [],
    insuranceCompanies: [],
    topLocations: [],
    fleetConsumption: [],
    profitLoss: [],
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token d\'authentification trouvé.');

      const params = {};
      if (startDate) params['date_from'] = startDate.toISOString().split('T')[0];
      if (endDate) params['date_to'] = endDate.toISOString().split('T')[0];

      const [
        interventionsRes, facturesRes, carburantRes, interventionTypesRes,
        insuranceRes, locationsRes, fleetRes, profitLossRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/interventions/monthly/`, { headers: { Authorization: `Bearer ${token}` }, params }),
        axios.get(`${API_BASE_URL}/api/dashboard/factures/monthly/`, { headers: { Authorization: `Bearer ${token}` }, params }),
        axios.get(`${API_BASE_URL}/api/dashboard/carburant/monthly/`, { headers: { Authorization: `Bearer ${token}` }, params }),
        axios.get(`${API_BASE_URL}/api/dashboard/intervention_types/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/insurance_companies/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/top_locations/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/fleet_consumption/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/profit_loss/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setStatsData({
        interventions: interventionsRes.data,
        factures: facturesRes.data,
        carburant: carburantRes.data,
        interventionTypes: interventionTypesRes.data,
        insuranceCompanies: insuranceRes.data,
        topLocations: locationsRes.data,
        fleetConsumption: fleetRes.data,
        profitLoss: profitLossRes.data,
      });
    } catch (err: any) {
      console.error('Fetch Stats Error:', err.response?.data || err);
      setError(err.response?.data?.detail || err.message || 'Erreur réseau ou serveur indisponible.');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [navigate, startDate, endDate]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Chart Data
  const interventionChartData = {
    labels: statsData.interventions.map(i => i.month),
    datasets: [{ label: 'Nombre de Tdakhlat', data: statsData.interventions.map(i => i.total), borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true }],
  };

  const factureChartData = {
    labels: statsData.factures.map(f => f.month),
    datasets: [{ label: 'Montant Total (DH)', data: statsData.factures.map(f => f.total), backgroundColor: 'rgba(255, 99, 132, 0.6)' }],
  };

  const carburantChartData = {
    labels: statsData.carburant.map(c => c.month),
    datasets: [{ label: 'Coût Total (DH)', data: statsData.carburant.map(c => c.total), backgroundColor: 'rgba(54, 162, 235, 0.6)' }],
  };

  const interventionTypeChartData = {
    labels: statsData.interventionTypes.map(t => t.evenement),
    datasets: [{ label: 'Nbre Tdakhlat', data: statsData.interventionTypes.map(t => t.total), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }],
  };

  const insuranceChartData = {
    labels: statsData.insuranceCompanies.map(i => i.billing_company || 'Inconnu'),
    datasets: [{ label: 'Nbre Tdakhlat', data: statsData.insuranceCompanies.map(i => i.total), backgroundColor: 'rgba(75, 192, 192, 0.6)' }],
  };

  const profitLossChartData = {
    labels: statsData.profitLoss.map(p => p.month),
    datasets: [{
      label: 'Profit/Loss (DH)',
      data: statsData.profitLoss.map(p => p.profit_loss),
      backgroundColor: statsData.profitLoss.map(p => p.profit_loss >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
    }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, color: isDarkMode ? '#ffffff' : '#000000' } } };

  if (loading) {
    return (
      <div className={`min-h-screen w-screen flex items-center justify-center ${isDarkMode ? 'bg-[#221F1F] text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
          <p className="ml-4 text-lg text-red-600">Chargement des statistiques...</p>
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
          Statistiques
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleDarkMode} className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
            <ChevronLeft className="h-5 w-5" /> Retour
          </button>
        </div>
      </header>

      <main className="p-6 flex-grow overflow-y-auto">
        <section className={`bg-${isDarkMode ? 'gray-900' : 'white'} p-6 rounded-none shadow-xl space-y-8 h-full`}>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <DatePicker selected={startDate} onChange={(date: Date) => setStartDate(date)} placeholderText="Date de début" className="p-2 border rounded" />
            <DatePicker selected={endDate} onChange={(date: Date) => setEndDate(date)} placeholderText="Date de fin" className="p-2 border rounded" />
          </div>

          {/* Vue d'ensemble */}
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vue d'ensemble</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de Tdakhlat</h3>
              <Line data={interventionChartData} options={chartOptions} />
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Montant Total Factures</h3>
              <Bar data={factureChartData} options={chartOptions} />
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Coût Total Carburant</h3>
              <Bar data={carburantChartData} options={chartOptions} />
            </div>
          </div>

          {/* Analyse */}
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analyse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Types de Tdakhlat</h3>
              <Pie data={interventionTypeChartData} options={{ ...chartOptions, plugins: { legend: { position: 'right' } } }} />
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Sherkat Tamin</h3>
              <Bar data={insuranceChartData} options={chartOptions} />
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Top Lieux</h3>
              <ul className={`list-disc pl-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {statsData.topLocations.map(loc => (
                  <li key={loc.assure}>{loc.assure}: {loc.total}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fleet Management */}
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gest. Asatol</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Conso. Carburant/Siyara</h3>
              <table className="w-full text-left">
                <thead><tr><th className="p-2 border">Véhicule</th><th className="p-2 border">Total (DH)</th></tr></thead>
                <tbody>
                  {statsData.fleetConsumption.map(fc => (
                    <tr key={fc.vehicule}><td className="p-2 border">{fc.vehicule}</td><td className="p-2 border">{fc.total}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Profit/Loss</h3>
              <Bar data={profitLossChartData} options={chartOptions} />
            </div>
          </div>
        </section>
      </main>

      <footer className={`text-center py-6 mt-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        © 2025 TAMANAR ASSISTANCE. Tous droits réservés.
      </footer>
    </div>
  );
};

export default Statistics;