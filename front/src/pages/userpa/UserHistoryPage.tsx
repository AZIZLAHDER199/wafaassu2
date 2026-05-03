import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  ChevronLeft, File, Clipboard, Truck, AlertCircle,
  FileText, Filter, X, Download, FileSpreadsheet, RefreshCw,
} from 'lucide-react';
import logo from './assets/logo.png';

const API_BASE_URL = '';

interface FactureData {
  id: number; facture_num: string; date: string;
  billing_company?: string; billing_company_name_display?: string;
  montant_ttc: number;
  user?: string | null;
}
interface InterventionData {
  id: number; ref_dossier: string; assure: string;
  date_intervention: string; evenement: string;
  status: string; cout_prestation_ttc: number;
  user?: string | null;
}
interface SuiviCarData {
  id: number; vehicule: string; date: string;
  prix: number; service: string; pompiste?: string; smitoStation: string;
  user?: string | null;
}
interface MonthlyTotal { month: string; total_prix: number; }

type Tab = 'factures' | 'interventions' | 'suiviCarburant';

const fmt = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`;

/* ── Responsive table ── */
const DataTable: React.FC<{
  columns: string[];
  data: any[];
  renderActions?: (row: any) => React.ReactNode;
}> = ({ columns, data, renderActions }) => (
  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px', fontSize: '.84rem' }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {columns.map(col => (
            <th key={col} style={{ padding: '11px 14px', color: '#475569', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', fontSize: '.73rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>
              {col}
            </th>
          ))}
          {renderActions && (
            <th style={{ padding: '11px 14px', color: '#475569', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: '.73rem', textTransform: 'uppercase' }}>
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.length ? data.map((row, i) => (
          <tr key={row.id ?? i}
            style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', transition: 'background .12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fff'}
          >
            {columns.map(col => (
              <td key={`${col}-${i}`} style={{ padding: '10px 14px', color: '#1e293b' }}>
                {col === 'Statut' ? (
                  <span style={{
                    background: row[col] === 'payé' ? '#dcfce7' : '#fef9c3',
                    color:      row[col] === 'payé' ? '#166534' : '#854d0e',
                    padding: '2px 10px', borderRadius: '999px', fontSize: '.73rem', fontWeight: 700,
                  }}>
                    {row[col] || 'N/A'}
                  </span>
                ) : row[col] || 'N/A'}
              </td>
            ))}
            {renderActions && (
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{renderActions(row)}</td>
            )}
          </tr>
        )) : (
          <tr>
            <td colSpan={columns.length + (renderActions ? 1 : 0)}
              style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '.88rem' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/* ── Stat card ── */
const StatBadge = ({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) => (
  <div style={{
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '16px 20px',
    boxShadow: '0 1px 6px rgba(0,0,0,.05)',
    borderLeft: `4px solid ${accent}`,
    minWidth: '140px', flex: '1 1 140px',
  }}>
    <div style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
    {sub && <div style={{ fontSize: '.74rem', color: accent, fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════ */
const UserHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('interventions');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [data, setData] = useState<{ factures: FactureData[]; interventions: InterventionData[]; suiviCarburant: SuiviCarData[] }>
    ({ factures: [], interventions: [], suiviCarburant: [] });

  const [filteredData, setFilteredData] = useState(data);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', reference: '', smitoStation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const validStations = ['AFRICA', 'TOTAL', 'SHELL', 'PETROM', 'AUCUNE'];

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Non authentifié.');
      const [fR, iR, sR, mR] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/get_factures/`,              { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_interventions/`,         { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant/`,       { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant_stats/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      const factures: FactureData[] = fR.data.map((f: any) => ({ ...f, montant_ttc: parseFloat(f.montant_ttc || 0) }));
      const interventions: InterventionData[] = iR.data.map((i: any) => ({ ...i, cout_prestation_ttc: parseFloat(i.cout_prestation_ttc || 0) }));
      const suiviCarburant: SuiviCarData[] = sR.data.map((s: any) => ({
        id: s.id, vehicule: s.vehicule || 'N/A', date: s.date || '',
        prix: parseFloat(s.prix || 0), service: s.service || 'N/A',
        pompiste: s.pompiste || 'N/A', smitoStation: s.smitoStation || 'AUCUNE',
      }));
      const d = { factures, interventions, suiviCarburant };
      setData(d); setFilteredData(d);
      setMonthlyTotals(mR.data);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
      if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyFilters = useCallback(() => {
    const { startDate, endDate, reference, smitoStation } = filters;
    let f = [...data.factures];
    let i = [...data.interventions];
    let s = [...data.suiviCarburant];
    if (startDate) {
      f = f.filter(x => new Date(x.date) >= new Date(startDate));
      i = i.filter(x => new Date(x.date_intervention) >= new Date(startDate));
      s = s.filter(x => new Date(x.date) >= new Date(startDate));
    }
    if (endDate) {
      f = f.filter(x => new Date(x.date) <= new Date(endDate));
      i = i.filter(x => new Date(x.date_intervention) <= new Date(endDate));
      s = s.filter(x => new Date(x.date) <= new Date(endDate));
    }
    if (reference) {
      f = f.filter(x => x.facture_num?.toLowerCase().includes(reference.toLowerCase()));
      i = i.filter(x => x.ref_dossier?.toLowerCase().includes(reference.toLowerCase()));
      s = s.filter(x => x.vehicule?.toLowerCase().includes(reference.toLowerCase()));
    }
    if (smitoStation && activeTab === 'suiviCarburant') {
      s = s.filter(x => smitoStation === 'AUCUNE'
        ? (!x.smitoStation || x.smitoStation === 'AUCUNE')
        : x.smitoStation?.toLowerCase().includes(smitoStation.toLowerCase()));
    }
    setFilteredData({ factures: f, interventions: i, suiviCarburant: s });
  }, [data, filters, activeTab]);

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', reference: '', smitoStation: '' });
    setFilteredData(data);
  };

  const handleDownload = useCallback(async (factureId: number, factureNum: string) => {
    setDownloadingId(factureId);
    try {
      const token = localStorage.getItem('token')!;
      const res = await axios.get(`${API_BASE_URL}/api/download_facture_pdf/${factureId}/`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url; link.download = `facture_${factureNum.replace('/', '_')}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(url);
    } catch (e: any) { alert('Erreur: ' + (e.message || 'Téléchargement échoué')); }
    finally { setDownloadingId(null); }
  }, []);

  const exportExcel = (rows: any[], headers: string[], name: string) => {
    if (!rows.length) { alert('Aucune donnée à exporter.'); return; }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Tamanar_${name}_backup_${dateStr}.xlsx`;

    const cleanRows = rows.map(r => {
      const obj: Record<string, string | number> = {};
      headers.forEach(h => { obj[h] = (r[h] ?? '').toString(); });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(cleanRows, { header: headers });

    const colWidths = headers.map(h => ({
      wch: Math.max(h.length + 4, ...cleanRows.map(r => (r[h] ?? '').toString().length + 2)),
    }));
    ws['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: '2D1060' } }, font2: { color: { rgb: 'FFFFFF' } } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));

    const meta = XLSX.utils.aoa_to_sheet([
      ['Exporté par', 'Tamanar Assistance'],
      ['Date export', dateStr],
      ['Type', name],
      ['Enregistrements', cleanRows.length],
    ]);
    XLSX.utils.book_append_sheet(wb, meta, 'Infos');

    XLSX.writeFile(wb, filename);
  };

  const tableConfig = {
    factures: {
      cols: ['N° Facture', 'Date', 'Société', 'Montant TTC', 'Ajouté par'],
      rows: filteredData.factures.map(f => ({
        id: f.id,
        'N° Facture': f.facture_num || 'N/A',
        Date: f.date ? new Date(f.date).toLocaleDateString('fr-FR') : 'N/A',
        Société: f.billing_company_name_display || f.billing_company || 'N/A',
        'Montant TTC': fmt(f.montant_ttc),
        'Ajouté par': f.user?.username || '—',
      })),
    },
    interventions: {
      cols: ['Ref Dossier', 'Assuré', 'Date', 'Événement', 'Statut', 'Coût TTC', 'Ajouté par'],
      rows: filteredData.interventions.map(i => ({
        id: i.id,
        'Ref Dossier': i.ref_dossier || 'N/A',
        Assuré: i.assure || 'N/A',
        Date: i.date_intervention ? new Date(i.date_intervention).toLocaleDateString('fr-FR') : 'N/A',
        Événement: i.evenement || 'N/A',
        Statut: i.status || 'N/A',
        'Coût TTC': fmt(i.cout_prestation_ttc || 0),
        'Ajouté par': i.user?.username || '—',
      })),
    },
    suiviCarburant: {
      cols: ['Véhicule', 'Date', 'Prix', 'Service', 'Pompiste', 'Station', 'Ajouté par'],
      rows: filteredData.suiviCarburant.map(s => ({
        id: s.id,
        Véhicule: s.vehicule,
        Date: s.date ? new Date(s.date).toLocaleDateString('fr-FR') : 'N/A',
        Prix: fmt(s.prix),
        Service: s.service,
        Pompiste: s.pompiste || 'N/A',
        Station: s.smitoStation || 'AUCUNE',
        'Ajouté par': s.user?.username || '—',
      })),
    },
  };

  const totals = {
    factures:       { count: filteredData.factures.length,       sum: filteredData.factures.reduce((a, f) => a + f.montant_ttc, 0) },
    interventions:  { count: filteredData.interventions.length,  sum: filteredData.interventions.reduce((a, i) => a + (i.cout_prestation_ttc || 0), 0) },
    suiviCarburant: { count: filteredData.suiviCarburant.length, sum: filteredData.suiviCarburant.reduce((a, s) => a + s.prix, 0) },
  };

  const areFiltersActive = filters.startDate || filters.endDate || filters.reference || filters.smitoStation;

  const tabConfig: Record<Tab, { icon: React.ReactNode; label: string; accent: string }> = {
    interventions:  { icon: <Clipboard size={14}/>, label: 'Interventions',   accent: '#2563eb' },
    factures:       { icon: <File size={14}/>,      label: 'Factures',        accent: '#7c3aed' },
    suiviCarburant: { icon: <Truck size={14}/>,     label: 'Carburant',       accent: '#16a34a' },
  };

  const activeAccent = tabConfig[activeTab].accent;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', gap: '14px' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#475569', fontWeight: 600, fontSize: '.9rem' }}>Chargement de l'historique…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '36px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
        <p style={{ color: '#374151', fontWeight: 600, marginBottom: '16px' }}>{error}</p>
        <button onClick={fetchData} style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '.86rem' }}>
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background: 'linear-gradient(135deg,#1a0533 0%,#2d1060 50%,#1e3a5f 100%)', padding: '0 clamp(16px,4vw,28px)', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,.25)', position: 'sticky', top: 0, zIndex: 50, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap' }}>
            <ChevronLeft size={15} /> Retour
          </button>
          <button onClick={() => navigate('/home')} style={{ background: 'rgba(168,85,247,.2)', border: '1px solid rgba(168,85,247,.3)', color: '#c4b5fd', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap' }}>
            🏠 Accueil
          </button>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: '30px', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 'clamp(.85rem,2vw,.98rem)', whiteSpace: 'nowrap' }}>
            Historique d'activités
          </span>
        </div>
        <button onClick={fetchData} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.8rem', whiteSpace: 'nowrap' }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </header>

      <main style={{ flex: 1, padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,28px)', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
          <StatBadge label="Interventions"   value={totals.interventions.count}  sub={fmt(totals.interventions.sum)}  accent="#2563eb" />
          <StatBadge label="Factures"        value={totals.factures.count}       sub={fmt(totals.factures.sum)}       accent="#7c3aed" />
          <StatBadge label="Suivi Carburant" value={totals.suiviCarburant.count} sub={fmt(totals.suiviCarburant.sum)} accent="#16a34a" />
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
          {(Object.keys(tabConfig) as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '8px',
                border: activeTab === tab ? `1.5px solid ${tabConfig[tab].accent}` : '1.5px solid #e2e8f0',
                cursor: 'pointer', fontWeight: 700, fontSize: '.83rem',
                background: activeTab === tab ? tabConfig[tab].accent : '#fff',
                color:      activeTab === tab ? '#fff' : '#64748b',
                transition: 'all .15s',
                boxShadow: activeTab === tab ? `0 2px 10px ${tabConfig[tab].accent}33` : 'none',
              }}
            >
              {tabConfig[tab].icon} {tabConfig[tab].label}
            </button>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setFiltersOpen(o => !o)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', fontSize: '.86rem' }}>
              <Filter size={14} color={activeAccent} /> Filtres
              {areFiltersActive && <span style={{ background: activeAccent, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '.68rem', fontWeight: 700 }}>actifs</span>}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '.78rem' }}>{filtersOpen ? '▲' : '▼'}</span>
          </div>
          {filtersOpen && (
            <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: '12px', marginTop: '14px' }}>
                {[
                  { id: 'startDate', label: 'Date début', type: 'date', name: 'startDate', val: filters.startDate },
                  { id: 'endDate',   label: 'Date fin',   type: 'date', name: 'endDate',   val: filters.endDate },
                  { id: 'reference', label: activeTab === 'factures' ? 'N° Facture' : activeTab === 'interventions' ? 'Réf. dossier' : 'Véhicule', type: 'text', name: 'reference', val: filters.reference },
                ].map(f => (
                  <div key={f.id}>
                    <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.3px' }}>{f.label}</label>
                    <input type={f.type} value={f.val} placeholder={f.type === 'text' ? 'Rechercher…' : ''}
                      onChange={e => setFilters(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', fontSize: '.84rem', color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => (e.target.style.borderColor = activeAccent)}
                      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                    />
                  </div>
                ))}
                {activeTab === 'suiviCarburant' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.3px' }}>Station</label>
                    <select value={filters.smitoStation} onChange={e => setFilters(p => ({ ...p, smitoStation: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', fontSize: '.84rem', color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Toutes</option>
                      {validStations.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <button onClick={applyFilters} style={{ background: activeAccent, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={12} /> Appliquer
                </button>
                <button onClick={clearFilters} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={12} /> Effacer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── TABLE AREA ── */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>

          {/* section header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '22px', background: activeAccent, borderRadius: '4px' }} />
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '.95rem' }}>
                {tabConfig[activeTab].label}
              </span>
              <span style={{ background: activeAccent + '18', color: activeAccent, padding: '2px 9px', borderRadius: '999px', fontSize: '.73rem', fontWeight: 700 }}>
                {tableConfig[activeTab].rows.length}
              </span>
            </div>
            <button onClick={() => exportExcel(tableConfig[activeTab].rows, tableConfig[activeTab].cols, activeTab)}
              style={{ background: 'linear-gradient(135deg,#2d1060,#7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(124,58,237,.35)' }}>
              <FileSpreadsheet size={12} /> Exporter Excel
            </button>
          </div>

          <div style={{ padding: '16px' }}>
            <DataTable
              columns={tableConfig[activeTab].cols}
              data={tableConfig[activeTab].rows}
              renderActions={
                activeTab === 'interventions'
                  ? row => (
                    <button onClick={() => navigate(`/generate-facture/${row.id}`)}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '.74rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <FileText size={11} /> Facture
                    </button>
                  )
                  : activeTab === 'factures'
                  ? row => (
                    <button
                      onClick={() => row['N° Facture'] !== 'N/A' ? handleDownload(row.id, row['N° Facture']) : alert('Numéro non disponible.')}
                      disabled={downloadingId === row.id}
                      style={{ background: downloadingId === row.id ? '#f1f5f9' : '#1e293b', color: '#fff', border: 'none', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '.74rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', opacity: downloadingId === row.id ? .6 : 1 }}>
                      <Download size={11} /> {downloadingId === row.id ? 'Chargement…' : 'Télécharger'}
                    </button>
                  )
                  : undefined
              }
            />
          </div>

          {/* summary footer */}
          <div style={{ padding: '11px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '.78rem', color: '#64748b' }}>
            <span>{tableConfig[activeTab].rows.length} enregistrement{tableConfig[activeTab].rows.length !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 700, color: '#166534' }}>
              Total : {fmt(
                activeTab === 'factures'       ? totals.factures.sum :
                activeTab === 'interventions'  ? totals.interventions.sum :
                totals.suiviCarburant.sum
              )}
            </span>
          </div>
        </div>

        {/* Monthly totals for carburant */}
        {activeTab === 'suiviCarburant' && monthlyTotals.length > 0 && (
          <div style={{ marginTop: '18px', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
            <div style={{ padding: '13px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#64748b', borderRadius: '4px' }} />
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '.92rem' }}>Totaux mensuels</span>
            </div>
            <div style={{ padding: '16px' }}>
              <DataTable
                columns={['Mois', 'Total Prix (DH)']}
                data={monthlyTotals.map(t => ({ Mois: t.month, 'Total Prix (DH)': fmt(t.total_prix) }))}
              />
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', fontSize: '.72rem', color: '#94a3b8', padding: '14px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
        © 2025 Tamanar Assistance — Tous droits réservés
      </footer>
    </div>
  );
};

export default UserHistoryPage;
