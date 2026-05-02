import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
}
interface InterventionData {
  id: number; ref_dossier: string; assure: string;
  date_intervention: string; evenement: string;
  status: string; cout_prestation_ttc: number;
}
interface SuiviCarData {
  id: number; vehicule: string; date: string;
  prix: number; service: string; pompiste?: string; smitoStation: string;
}
interface MonthlyTotal { month: string; total_prix: number; }

type Tab = 'factures' | 'interventions' | 'suiviCarburant';

/* ── tiny helpers ── */
const R = '#cc0000';
const DARK = '#111';
const fmt = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`;

/* ── Responsive table ── */
const DataTable: React.FC<{
  columns: string[];
  data: any[];
  renderActions?: (row: any) => React.ReactNode;
}> = ({ columns, data, renderActions }) => (
  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '12px', border: '1px solid #fee2e2' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px', fontSize: '.84rem' }}>
      <thead>
        <tr style={{ background: `linear-gradient(90deg,${DARK},#333)` }}>
          {columns.map(col => (
            <th key={col} style={{ padding: '11px 14px', color: '#fff', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', fontSize: '.75rem', letterSpacing: '.4px' }}>
              {col}
            </th>
          ))}
          {renderActions && (
            <th style={{ padding: '11px 14px', color: '#fff', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', fontSize: '.75rem' }}>
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.length ? data.map((row, i) => (
          <tr key={row.id ?? i}
            style={{ background: i % 2 === 0 ? '#fff' : '#fff5f5', borderBottom: '1px solid #fee2e2', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fef2f2'}
            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fff5f5'}
          >
            {columns.map(col => (
              <td key={`${col}-${i}`} style={{ padding: '10px 14px', color: '#111' }}>
                {col === 'Statut' ? (
                  <span style={{
                    background: row[col] === 'payé' ? '#dcfce7' : '#fee2e2',
                    color:      row[col] === 'payé' ? '#166534' : '#991b1b',
                    padding: '2px 10px', borderRadius: '999px', fontSize: '.74rem', fontWeight: 700,
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
              style={{ padding: '36px', textAlign: 'center', color: '#9ca3af' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/* ── Stat card ── */
const StatBadge = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div style={{
    background: '#fff', border: '1.5px solid #fee2e2',
    borderRadius: '12px', padding: '16px 20px',
    boxShadow: '0 2px 10px rgba(204,0,0,.07)',
    minWidth: '140px', flex: '1 1 140px',
  }}>
    <div style={{ fontSize: '.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: DARK }}>{value}</div>
    {sub && <div style={{ fontSize: '.75rem', color: R, fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
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
        axios.get(`${API_BASE_URL}/api/get_factures/`,           { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_interventions/`,      { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/get_suivi_carburant/`,    { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
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
      s = s.filter(x => smitoStation === 'AUCUNE' ? (!x.smitoStation || x.smitoStation === 'AUCUNE') : x.smitoStation?.toLowerCase().includes(smitoStation.toLowerCase()));
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

  const exportCSV = (rows: any[], headers: string[], name: string) => {
    if (!rows.length) { alert('Aucune donnée à exporter.'); return; }
    const csv = 'data:text/csv;charset=utf-8,' +
      headers.map(h => `"${h}"`).join(';') + '\n' +
      rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv); a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── table configs ──
  const tableConfig = {
    factures: {
      cols: ['N° Facture', 'Date', 'Société', 'Montant TTC'],
      rows: filteredData.factures.map(f => ({
        id: f.id,
        'N° Facture': f.facture_num || 'N/A',
        Date: f.date ? new Date(f.date).toLocaleDateString('fr-FR') : 'N/A',
        Société: f.billing_company_name_display || f.billing_company || 'N/A',
        'Montant TTC': fmt(f.montant_ttc),
      })),
    },
    interventions: {
      cols: ['Ref Dossier', 'Assuré', 'Date', 'Événement', 'Statut', 'Coût TTC'],
      rows: filteredData.interventions.map(i => ({
        id: i.id,
        'Ref Dossier': i.ref_dossier || 'N/A',
        Assuré: i.assure || 'N/A',
        Date: i.date_intervention ? new Date(i.date_intervention).toLocaleDateString('fr-FR') : 'N/A',
        Événement: i.evenement || 'N/A',
        Statut: i.status || 'N/A',
        'Coût TTC': fmt(i.cout_prestation_ttc || 0),
      })),
    },
    suiviCarburant: {
      cols: ['Véhicule', 'Date', 'Prix', 'Service', 'Pompiste', 'Station'],
      rows: filteredData.suiviCarburant.map(s => ({
        id: s.id,
        Véhicule: s.vehicule,
        Date: s.date ? new Date(s.date).toLocaleDateString('fr-FR') : 'N/A',
        Prix: fmt(s.prix),
        Service: s.service,
        Pompiste: s.pompiste || 'N/A',
        Station: s.smitoStation || 'AUCUNE',
      })),
    },
  };

  const totals = {
    factures:      { count: filteredData.factures.length,      sum: filteredData.factures.reduce((a,f) => a+f.montant_ttc,0) },
    interventions: { count: filteredData.interventions.length, sum: filteredData.interventions.reduce((a,i) => a+(i.cout_prestation_ttc||0),0) },
    suiviCarburant:{ count: filteredData.suiviCarburant.length,sum: filteredData.suiviCarburant.reduce((a,s) => a+s.prix,0) },
  };

  const areFiltersActive = filters.startDate || filters.endDate || filters.reference || filters.smitoStation;

  const tabLabels: Record<Tab, { icon: React.ReactNode; label: string }> = {
    interventions:  { icon: <Clipboard size={15}/>, label: 'Interventions' },
    factures:       { icon: <File size={15}/>,      label: 'Factures' },
    suiviCarburant: { icon: <Truck size={15}/>,     label: 'Carburant' },
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #fee2e2', borderTop: `4px solid ${R}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: R, fontWeight: 600 }}>Chargement de l'historique…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', padding: '20px' }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '32px', maxWidth: '440px', textAlign: 'center' }}>
        <AlertCircle size={40} color={R} style={{ marginBottom: '12px' }} />
        <p style={{ color: '#991b1b', fontWeight: 600, marginBottom: '16px' }}>{error}</p>
        <button onClick={fetchData} style={{ background: R, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 22px', cursor: 'pointer', fontWeight: 700 }}>
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background: DARK, padding: '0 clamp(16px,4vw,28px)', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(0,0,0,.4)', position: 'sticky', top: 0, zIndex: 50, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(204,0,0,.2)', border: '1px solid rgba(204,0,0,.4)', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap' }}>
            <ChevronLeft size={16} /> Retour
          </button>
          <img src={logo} alt="Logo" style={{ height: '38px', objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 'clamp(.85rem,2vw,1rem)', whiteSpace: 'nowrap' }}>Historique</span>
        </div>
        <button onClick={fetchData} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#ccc', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.8rem', whiteSpace: 'nowrap' }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </header>

      <main style={{ flex: 1, padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,28px)', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <StatBadge label="Interventions"  value={totals.interventions.count}  sub={fmt(totals.interventions.sum)} />
          <StatBadge label="Factures"       value={totals.factures.count}       sub={fmt(totals.factures.sum)} />
          <StatBadge label="Suivi Carburant" value={totals.suiviCarburant.count} sub={fmt(totals.suiviCarburant.sum)} />
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #fee2e2', paddingBottom: '0' }}>
          {(Object.keys(tabLabels) as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px', borderRadius: '10px 10px 0 0',
                border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem',
                background: activeTab === tab ? R : '#fff',
                color:      activeTab === tab ? '#fff' : '#6b7280',
                borderBottom: activeTab === tab ? `2px solid ${R}` : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all .15s',
              }}
            >
              {tabLabels[tab].icon} {tabLabels[tab].label}
            </button>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #fee2e2', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(204,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setFiltersOpen(o => !o)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: DARK, fontSize: '.88rem' }}>
              <Filter size={15} color={R} /> Filtres
              {areFiltersActive && <span style={{ background: R, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '.7rem', fontWeight: 700 }}>actifs</span>}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '.8rem' }}>{filtersOpen ? '▲' : '▼'}</span>
          </div>
          {filtersOpen && (
            <div style={{ padding: '0 18px 16px', borderTop: '1px solid #fee2e2' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px', marginTop: '14px' }}>
                {[
                  { id: 'startDate', label: 'Date début',  type: 'date',  name: 'startDate',  val: filters.startDate },
                  { id: 'endDate',   label: 'Date fin',    type: 'date',  name: 'endDate',    val: filters.endDate },
                  { id: 'reference', label: activeTab === 'factures' ? 'N° Facture' : activeTab === 'interventions' ? 'Réf. dossier' : 'Véhicule', type: 'text', name: 'reference', val: filters.reference },
                ].map(f => (
                  <div key={f.id}>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#374151', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.3px' }}>{f.label}</label>
                    <input type={f.type} value={f.val} placeholder={f.type === 'text' ? 'Rechercher...' : ''}
                      onChange={e => setFilters(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '7px 10px', fontSize: '.85rem', color: DARK, background: '#fff5f5', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => (e.target.style.borderColor = R)}
                      onBlur={e => (e.target.style.borderColor = '#fecaca')}
                    />
                  </div>
                ))}
                {activeTab === 'suiviCarburant' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#374151', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.3px' }}>Station</label>
                    <select value={filters.smitoStation} onChange={e => setFilters(p => ({ ...p, smitoStation: e.target.value }))}
                      style={{ width: '100%', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '7px 10px', fontSize: '.85rem', color: DARK, background: '#fff5f5', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Toutes</option>
                      {validStations.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <button onClick={applyFilters} style={{ background: R, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={13} /> Appliquer
                </button>
                <button onClick={clearFilters} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={13} /> Effacer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── TABLE AREA ── */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #fee2e2', overflow: 'hidden', boxShadow: '0 2px 12px rgba(204,0,0,.08)' }}>

          {/* section header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '24px', background: R, borderRadius: '4px' }} />
              <span style={{ fontWeight: 800, color: DARK, fontSize: '1rem' }}>
                {tabLabels[activeTab].label}
              </span>
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: '999px', fontSize: '.75rem', fontWeight: 700 }}>
                {tableConfig[activeTab].rows.length}
              </span>
            </div>
            <button onClick={() => exportCSV(tableConfig[activeTab].rows, tableConfig[activeTab].cols, activeTab)}
              style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileSpreadsheet size={13} /> Exporter CSV
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
                      style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <FileText size={12} /> Facture
                    </button>
                  )
                  : activeTab === 'factures'
                  ? row => (
                    <button
                      onClick={() => row['N° Facture'] !== 'N/A' ? handleDownload(row.id, row['N° Facture']) : alert('Numéro non disponible.')}
                      disabled={downloadingId === row.id}
                      style={{ background: downloadingId === row.id ? '#fee2e2' : DARK, color: '#fff', border: 'none', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', opacity: downloadingId === row.id ? .6 : 1 }}>
                      <Download size={12} /> {downloadingId === row.id ? 'Chargement...' : 'Télécharger'}
                    </button>
                  )
                  : undefined
              }
            />
          </div>

          {/* summary footer */}
          <div style={{ padding: '12px 20px', background: '#fff5f5', borderTop: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '.8rem', color: '#6b7280' }}>
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
          <div style={{ marginTop: '20px', background: '#fff', borderRadius: '14px', border: '1px solid #fee2e2', overflow: 'hidden', boxShadow: '0 2px 12px rgba(204,0,0,.08)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '22px', background: DARK, borderRadius: '4px' }} />
              <span style={{ fontWeight: 800, color: DARK }}>Totaux mensuels</span>
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

      <footer style={{ textAlign: 'center', fontSize: '.72rem', color: '#6b7280', padding: '14px', borderTop: '1px solid #e5e7eb', background: DARK, color: '#555' }}>
        © 2025 Tamanar Assistance — Tous droits réservés
      </footer>
    </div>
  );
};

export default UserHistoryPage;
