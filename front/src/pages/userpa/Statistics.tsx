import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, TrendingUp, BarChart2, Fuel, Layers, Building2, MapPin, Truck, DollarSign, RefreshCw, Calendar } from 'lucide-react';
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

const makeOpts = () => ({
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { font: { size: 11 }, color: '#64748b', boxWidth: 12, padding: 16 } },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#cbd5e1', padding: 10, cornerRadius: 8, displayColors: false },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { display: false } },
    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } }, border: { display: false } },
  },
});

const PIE_OPTS = {
  responsive: true,
  plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 }, color: '#64748b', boxWidth: 12, padding: 14 } } },
};

/* ── Stat summary card ── */
const KpiCard = ({ label, value, icon, gradient, shadow }: { label: string; value: string | number; icon: string; gradient: string; shadow: string }) => (
  <div style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 14px rgba(0,0,0,.07)', border: '1px solid #e8ecf4', display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 160px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: `0 4px 12px ${shadow}`, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  </div>
);

/* ── Chart card ── */
const ChartCard = ({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) => (
  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8ecf4', boxShadow: '0 2px 14px rgba(0,0,0,.06)', overflow: 'hidden' }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: `4px solid ${color}` }}>
      {icon}
      <span style={{ fontWeight: 800, fontSize: '.88rem', color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ padding: '18px' }}>{children}</div>
  </div>
);

const SectionLabel = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '28px 0 14px' }}>
    <div style={{ width: '5px', height: '22px', background: color, borderRadius: '4px' }} />
    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-.2px' }}>{children}</h2>
  </div>
);

const Empty = () => <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '.84rem', padding: '30px 0', margin: 0 }}>Aucune donnée disponible</p>;

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

  const interventionChartData = {
    labels: statsData.interventions.map(i => i.month),
    datasets: [{ label: 'Interventions', data: statsData.interventions.map(i => i.total), borderColor: '#6366f1', backgroundColor: '#6366f118', fill: true, tension: .4, pointRadius: 5, pointBackgroundColor: '#6366f1', pointBorderColor: '#fff', pointBorderWidth: 2 }],
  };
  const factureChartData = {
    labels: statsData.factures.map(f => f.month),
    datasets: [{ label: 'Montant (DH)', data: statsData.factures.map(f => f.total), backgroundColor: '#ec489990', borderRadius: 8 }],
  };
  const carburantChartData = {
    labels: statsData.carburant.map(c => c.month),
    datasets: [{ label: 'Coût (DH)', data: statsData.carburant.map(c => c.total), backgroundColor: '#0ea5e990', borderRadius: 8 }],
  };
  const interventionTypeChartData = {
    labels: statsData.interventionTypes.map(t => t.evenement),
    datasets: [{ data: statsData.interventionTypes.map(t => t.total), backgroundColor: ['#6366f1','#ec4899','#f59e0b','#10b981','#0ea5e9','#8b5cf6'], borderWidth: 0 }],
  };
  const insuranceChartData = {
    labels: statsData.insuranceCompanies.map(i => i.billing_company || 'Inconnu'),
    datasets: [{ label: 'Dossiers', data: statsData.insuranceCompanies.map(i => i.total), backgroundColor: '#10b98190', borderRadius: 8 }],
  };
  const profitLossChartData = {
    labels: statsData.profitLoss.map(p => p.month),
    datasets: [{ label: 'Profit/Loss (DH)', data: statsData.profitLoss.map(p => p.profit_loss), backgroundColor: statsData.profitLoss.map(p => p.profit_loss >= 0 ? '#10b98190' : '#ef444490'), borderRadius: 8 }],
  };

  const totalInterventions = statsData.interventions.reduce((a, i) => a + i.total, 0);
  const totalFactures = statsData.factures.reduce((a, f) => a + f.total, 0);
  const totalCarburant = statsData.carburant.reduce((a, c) => a + c.total, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1e3a5f 100%)', padding: '0 clamp(16px,4vw,36px)', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 24px rgba(0,0,0,.25)', position: 'sticky', top: 0, zIndex: 50, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem' }}>
            <ChevronLeft size={15} /> Retour
          </button>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '4px 7px', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="" style={{ height: '36px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '.92rem', color: '#fff', letterSpacing: '.5px' }}>TAMANAR ASSISTANCE</div>
            <div style={{ fontSize: '.58rem', color: '#94a3b8', letterSpacing: '2px', fontWeight: 600 }}>STATISTIQUES</div>
          </div>
        </div>
        <button onClick={fetchStats} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.8rem', fontWeight: 600 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </header>

      <main style={{ flex: 1, padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,28px)', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Date filters */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8ecf4', padding: '14px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', fontWeight: 700, fontSize: '.8rem' }}>
            <Calendar size={14} /> Période
          </div>
          <DatePicker selected={startDate} onChange={(d: Date | null) => setStartDate(d)} placeholderText="Date de début" dateFormat="dd/MM/yyyy" className="stat-dp" />
          <span style={{ color: '#cbd5e1', fontWeight: 700 }}>→</span>
          <DatePicker selected={endDate} onChange={(d: Date | null) => setEndDate(d)} placeholderText="Date de fin" dateFormat="dd/MM/yyyy" className="stat-dp" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(null); setEndDate(null); }} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>Effacer</button>
          )}
        </div>
        <style>{`.stat-dp{border:1.5px solid #e2e8f0;border-radius:9px;padding:7px 12px;font-size:.84rem;color:#0f172a;background:#f8faff;outline:none;cursor:pointer;font-family:inherit}.stat-dp:focus{border-color:#6366f1;box-shadow:0 0 0 3px #6366f118}`}</style>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '14px', color: '#64748b', fontSize: '.9rem' }}>
            <div style={{ width: '38px', height: '38px', border: '3px solid #e8ecf4', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Chargement des statistiques…
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '14px 18px', color: '#e11d48', fontSize: '.88rem', marginBottom: '16px', fontWeight: 600 }}>⚠ {error}</div>
        )}

        {!loading && !error && (
          <>
            {/* KPI row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '4px' }}>
              <KpiCard label="Interventions"  value={totalInterventions} icon="🚛" gradient="linear-gradient(135deg,#6366f1,#818cf8)" shadow="rgba(99,102,241,.3)" />
              <KpiCard label="Total Factures" value={`${totalFactures.toLocaleString('fr-FR')} DH`} icon="🧾" gradient="linear-gradient(135deg,#ec4899,#f472b6)" shadow="rgba(236,72,153,.3)" />
              <KpiCard label="Coût Carburant" value={`${totalCarburant.toLocaleString('fr-FR')} DH`} icon="⛽" gradient="linear-gradient(135deg,#0ea5e9,#38bdf8)" shadow="rgba(14,165,233,.3)" />
            </div>

            {/* Vue d'ensemble */}
            <SectionLabel color="#6366f1">Vue d'ensemble</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px', marginBottom: '8px' }}>
              <ChartCard title="Interventions / mois" icon={<TrendingUp size={14} color="#6366f1" />} color="#6366f1">
                {statsData.interventions.length ? <Line data={interventionChartData} options={makeOpts()} /> : <Empty />}
              </ChartCard>
              <ChartCard title="Montant factures / mois" icon={<BarChart2 size={14} color="#ec4899" />} color="#ec4899">
                {statsData.factures.length ? <Bar data={factureChartData} options={makeOpts()} /> : <Empty />}
              </ChartCard>
              <ChartCard title="Coût carburant / mois" icon={<Fuel size={14} color="#0ea5e9" />} color="#0ea5e9">
                {statsData.carburant.length ? <Bar data={carburantChartData} options={makeOpts()} /> : <Empty />}
              </ChartCard>
            </div>

            {/* Analyse */}
            <SectionLabel color="#f59e0b">Analyse</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px', marginBottom: '8px' }}>
              <ChartCard title="Types d'interventions" icon={<Layers size={14} color="#f59e0b" />} color="#f59e0b">
                {statsData.interventionTypes.length ? <Pie data={interventionTypeChartData} options={PIE_OPTS} /> : <Empty />}
              </ChartCard>
              <ChartCard title="Sociétés d'assurance" icon={<Building2 size={14} color="#10b981" />} color="#10b981">
                {statsData.insuranceCompanies.length ? <Bar data={insuranceChartData} options={makeOpts()} /> : <Empty />}
              </ChartCard>
              <ChartCard title="Top lieux d'intervention" icon={<MapPin size={14} color="#8b5cf6" />} color="#8b5cf6">
                {statsData.topLocations.length ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {statsData.topLocations.map((loc, i) => (
                      <li key={loc.assure} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < statsData.topLocations.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '.85rem' }}>
                        <span style={{ color: '#334155' }}>{loc.assure}</span>
                        <span style={{ fontWeight: 800, color: '#8b5cf6', background: '#f5f3ff', padding: '2px 10px', borderRadius: '999px', fontSize: '.75rem' }}>{loc.total}</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty />}
              </ChartCard>
            </div>

            {/* Flotte */}
            <SectionLabel color="#0ea5e9">Gestion flotte</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px' }}>
              <ChartCard title="Consommation / véhicule" icon={<Truck size={14} color="#0ea5e9" />} color="#0ea5e9">
                {statsData.fleetConsumption.length ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8faff' }}>
                        <th style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '.72rem', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf4' }}>Véhicule</th>
                        <th style={{ padding: '9px 12px', textAlign: 'right', color: '#64748b', fontWeight: 700, fontSize: '.72rem', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf4' }}>Total (DH)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.fleetConsumption.map((fc, i) => (
                        <tr key={fc.vehicule} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>{fc.vehicule}</td>
                          <td style={{ padding: '8px 12px', color: '#0ea5e9', fontWeight: 700, textAlign: 'right' }}>{Number(fc.total).toLocaleString('fr-FR')} DH</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <Empty />}
              </ChartCard>
              <ChartCard title="Profit / Perte mensuel" icon={<DollarSign size={14} color="#10b981" />} color="#10b981">
                {statsData.profitLoss.length ? <Bar data={profitLossChartData} options={makeOpts()} /> : <Empty />}
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

export default Statistics;
