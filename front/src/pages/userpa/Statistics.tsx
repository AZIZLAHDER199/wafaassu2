import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, TrendingUp, BarChart2, Fuel, Layers, Building2, MapPin, Truck, DollarSign, RefreshCw } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import logo from './assets/logo.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const API_BASE_URL = '';

interface StatsData {
  interventions:     { month: string; total: number }[];
  factures:          { month: string; total: number }[];
  carburant:         { month: string; total: number }[];
  interventionTypes: { evenement: string; total: number }[];
  insuranceCompanies:{ billing_company: string; total: number }[];
  topLocations:      { assure: string; total: number }[];
  fleetConsumption:  { vehicule: string; total: number }[];
  profitLoss:        { month: string; profit_loss: number }[];
}

const CHART_OPTS = (title: string) => ({
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { font: { size: 11 }, color: '#475569', boxWidth: 12 } },
    title: { display: false },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#cbd5e1', padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
  },
});

const PIE_OPTS = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { font: { size: 11 }, color: '#475569', boxWidth: 12 } },
  },
};

const ChartCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon}
      <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ padding: '16px' }}>{children}</div>
  </div>
);

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<StatsData>({ interventions: [], factures: [], carburant: [], interventionTypes: [], insuranceCompanies: [], topLocations: [], fleetConsumption: [], profitLoss: [] });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate]     = useState<Date | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Non authentifié.');
      const params: Record<string, string> = {};
      if (startDate) params['date_from'] = startDate.toISOString().split('T')[0];
      if (endDate)   params['date_to']   = endDate.toISOString().split('T')[0];

      const [iR, fR, cR, itR, insR, locR, flR, plR] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/interventions/monthly/`,  { headers: { Authorization: `Bearer ${token}` }, params }),
        axios.get(`${API_BASE_URL}/api/dashboard/factures/monthly/`,       { headers: { Authorization: `Bearer ${token}` }, params }),
        axios.get(`${API_BASE_URL}/api/dashboard/carburant/monthly/`,      { headers: { Authorization: `Bearer ${token}` }, params }),
        axios.get(`${API_BASE_URL}/api/dashboard/intervention_types/`,     { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/insurance_companies/`,    { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/top_locations/`,          { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/fleet_consumption/`,      { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/dashboard/profit_loss/`,            { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStatsData({ interventions: iR.data, factures: fR.data, carburant: cR.data, interventionTypes: itR.data, insuranceCompanies: insR.data, topLocations: locR.data, fleetConsumption: flR.data, profitLoss: plR.data });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur réseau.');
      if (err.response?.status === 401) navigate('/login');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [startDate, endDate]);

  // ── chart datasets ──
  const interventionChartData = {
    labels: statsData.interventions.map(i => i.month),
    datasets: [{ label: 'Interventions', data: statsData.interventions.map(i => i.total), borderColor: '#6366f1', backgroundColor: '#6366f115', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#6366f1' }],
  };
  const factureChartData = {
    labels: statsData.factures.map(f => f.month),
    datasets: [{ label: 'Montant (DH)', data: statsData.factures.map(f => f.total), backgroundColor: '#ec489990', borderRadius: 6 }],
  };
  const carburantChartData = {
    labels: statsData.carburant.map(c => c.month),
    datasets: [{ label: 'Coût (DH)', data: statsData.carburant.map(c => c.total), backgroundColor: '#0ea5e990', borderRadius: 6 }],
  };
  const interventionTypeChartData = {
    labels: statsData.interventionTypes.map(t => t.evenement),
    datasets: [{ data: statsData.interventionTypes.map(t => t.total), backgroundColor: ['#6366f1','#ec4899','#f59e0b','#10b981','#0ea5e9','#8b5cf6'] }],
  };
  const insuranceChartData = {
    labels: statsData.insuranceCompanies.map(i => i.billing_company || 'Inconnu'),
    datasets: [{ label: 'Dossiers', data: statsData.insuranceCompanies.map(i => i.total), backgroundColor: '#10b98190', borderRadius: 6 }],
  };
  const profitLossChartData = {
    labels: statsData.profitLoss.map(p => p.month),
    datasets: [{ label: 'Profit/Loss (DH)', data: statsData.profitLoss.map(p => p.profit_loss), backgroundColor: statsData.profitLoss.map(p => p.profit_loss >= 0 ? '#10b98190' : '#ef444490'), borderRadius: 6 }],
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8faff 0%,#f1f5f9 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 clamp(16px,4vw,28px)', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,.05)', position: 'sticky', top: 0, zIndex: 50, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem' }}>
            <ChevronLeft size={15} /> Retour
          </button>
          <img src={logo} alt="" style={{ height: '36px', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '.96rem' }}>Statistiques</span>
        </div>
        <button onClick={fetchStats} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.8rem' }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </header>

      <main style={{ flex: 1, padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,28px)', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Date filters */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.4px' }}>Période :</span>
          <DatePicker
            selected={startDate}
            onChange={(d: Date | null) => setStartDate(d)}
            placeholderText="Date de début"
            dateFormat="dd/MM/yyyy"
            className="stat-dp"
          />
          <span style={{ color: '#cbd5e1', fontWeight: 700 }}>→</span>
          <DatePicker
            selected={endDate}
            onChange={(d: Date | null) => setEndDate(d)}
            placeholderText="Date de fin"
            dateFormat="dd/MM/yyyy"
            className="stat-dp"
          />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(null); setEndDate(null); }} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
              Effacer
            </button>
          )}
        </div>
        <style>{`.stat-dp{border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.84rem;color:#0f172a;background:#f8fafc;outline:none;cursor:pointer}.stat-dp:focus{border-color:#6366f1}`}</style>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: '#64748b' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Chargement des statistiques…
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '14px 18px', color: '#e11d48', fontSize: '.88rem', marginBottom: '16px', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Section: Vue d'ensemble */}
            <SectionTitle>Vue d'ensemble</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '16px', marginBottom: '24px' }}>
              <ChartCard title="Nombre d'interventions / mois" icon={<TrendingUp size={15} color="#6366f1" />}>
                <Line data={interventionChartData} options={CHART_OPTS('Interventions')} />
              </ChartCard>
              <ChartCard title="Montant total factures / mois" icon={<BarChart2 size={15} color="#ec4899" />}>
                <Bar data={factureChartData} options={CHART_OPTS('Factures')} />
              </ChartCard>
              <ChartCard title="Coût carburant / mois" icon={<Fuel size={15} color="#0ea5e9" />}>
                <Bar data={carburantChartData} options={CHART_OPTS('Carburant')} />
              </ChartCard>
            </div>

            {/* Section: Analyse */}
            <SectionTitle>Analyse</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '16px', marginBottom: '24px' }}>
              <ChartCard title="Types d'interventions" icon={<Layers size={15} color="#f59e0b" />}>
                {statsData.interventionTypes.length ? <Pie data={interventionTypeChartData} options={PIE_OPTS} /> : <Empty />}
              </ChartCard>
              <ChartCard title="Sociétés d'assurance" icon={<Building2 size={15} color="#10b981" />}>
                {statsData.insuranceCompanies.length ? <Bar data={insuranceChartData} options={CHART_OPTS('Assurance')} /> : <Empty />}
              </ChartCard>
              <ChartCard title="Top lieux d'intervention" icon={<MapPin size={15} color="#8b5cf6" />}>
                {statsData.topLocations.length ? (
                  <ul style={{ margin: 0, padding: '0 0 0 16px', listStyle: 'none' }}>
                    {statsData.topLocations.map((loc, i) => (
                      <li key={loc.assure} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < statsData.topLocations.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '.85rem', color: '#334155' }}>
                        <span>{loc.assure}</span>
                        <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{loc.total}</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty />}
              </ChartCard>
            </div>

            {/* Section: Flotte */}
            <SectionTitle>Gestion flotte</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '16px' }}>
              <ChartCard title="Consommation carburant / véhicule" icon={<Truck size={15} color="#0ea5e9" />}>
                {statsData.fleetConsumption.length ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '.73rem', textTransform: 'uppercase' }}>Véhicule</th>
                          <th style={{ padding: '9px 12px', textAlign: 'right', color: '#64748b', fontWeight: 700, fontSize: '.73rem', textTransform: 'uppercase' }}>Total (DH)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.fleetConsumption.map((fc, i) => (
                          <tr key={fc.vehicule} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#334155' }}>{fc.vehicule}</td>
                            <td style={{ padding: '8px 12px', color: '#0ea5e9', fontWeight: 700, textAlign: 'right' }}>{Number(fc.total).toLocaleString('fr-FR')} DH</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty />}
              </ChartCard>
              <ChartCard title="Profit / Perte mensuel" icon={<DollarSign size={15} color="#10b981" />}>
                {statsData.profitLoss.length ? <Bar data={profitLossChartData} options={CHART_OPTS('Profit')} /> : <Empty />}
              </ChartCard>
            </div>
          </>
        )}
      </main>

      <footer style={{ textAlign: 'center', fontSize: '.72rem', color: '#94a3b8', padding: '14px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
        © 2025 Tamanar Assistance — Tous droits réservés
      </footer>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
    <div style={{ width: '4px', height: '20px', background: '#6366f1', borderRadius: '4px' }} />
    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{children}</h2>
  </div>
);

const Empty = () => (
  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '.84rem', padding: '24px 0', margin: 0 }}>Aucune donnée disponible</p>
);

export default Statistics;
