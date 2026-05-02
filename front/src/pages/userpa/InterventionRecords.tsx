import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiTrash2, FiTruck, FiFilter } from 'react-icons/fi';

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
  ref_dossier?: string;
}

const InterventionRecords: React.FC = () => {
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<InterventionData[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [search, setSearch]               = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData(token);
  }, [navigate, filterStatus, filterDateFrom]);

  const fetchData = async (token: string) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus)   params.append('status', filterStatus);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      const res = await fetch(`/api/get_interventions/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { const t = await refreshToken(); if (t) return fetchData(t); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setInterventions(data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const refreshToken = async (): Promise<string | null> => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) { navigate('/login'); return null; }
    try {
      const res  = await fetch('/api/token/refresh/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refresh }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('token', data.access); return data.access; }
      navigate('/login'); return null;
    } catch { navigate('/login'); return null; }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Supprimer l'intervention ${id} ?`)) return;
    const token = localStorage.getItem('token')!;
    const res = await fetch(`/api/intervention/${id}/`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
    if (res.ok) setInterventions(prev => prev.filter(i => i.id !== id));
    else if (res.status === 401) { const t = await refreshToken(); if (t) handleDelete(id); }
  };

  const totalTTC   = interventions.reduce((s, i) => s + (Number(i.cout_ttc) || 0), 0);
  const lastDate   = interventions.length
    ? interventions.slice().sort((a,b) => new Date(b.date_intervention).getTime() - new Date(a.date_intervention).getTime())[0].date_intervention
    : null;

  const filtered = interventions.filter(i =>
    [i.evenement, i.assure, i.immatriculation, i.marque, i.lieu_intervention, i.destination, i.ref_dossier]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', padding:'28px 32px 24px', color:'#fff', boxShadow:'0 4px 20px rgba(30,64,175,.3)' }}>
        <div style={{ maxWidth:'1300px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <button onClick={() => navigate('/home')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', borderRadius:'10px', padding:'8px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontWeight:600 }}>
              <FiArrowLeft /> Retour
            </button>
            <div>
              <h1 style={{ margin:0, fontSize:'1.65rem', fontWeight:800, display:'flex', alignItems:'center', gap:'10px' }}>
                <FiTruck /> Registre des Interventions
              </h1>
              <p style={{ margin:'4px 0 0', opacity:.8, fontSize:'.85rem' }}>Gestion des interventions</p>
            </div>
          </div>
          <button onClick={() => fetchData(localStorage.getItem('token')!)} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', borderRadius:'9px', padding:'9px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontWeight:600 }}>
            <FiRefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'1300px', margin:'0 auto', padding:'28px 24px' }}>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px', marginBottom:'24px' }}>
          {[
            { icon:'🚛', label:'Total interventions', value: String(interventions.length),                          color:'#1e40af' },
            { icon:'💰', label:'Total TTC',           value:`${totalTTC.toLocaleString('fr-FR')} MAD`,             color:'#10b981' },
            { icon:'✅', label:'Payées',               value: String(interventions.filter(i=>i.status==='payé').length),   color:'#059669' },
            { icon:'❌', label:'Impayées',             value: String(interventions.filter(i=>i.status==='impayé').length), color:'#dc2626' },
            { icon:'📅', label:'Dernière entrée',      value: lastDate ? new Date(lastDate).toLocaleDateString('fr-FR') : '—', color:'#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:'14px', padding:'16px 18px', boxShadow:'0 2px 12px rgba(30,64,175,.07)', border:'1px solid #e0e7ff', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'11px', background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:'.68rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.label}</div>
                <div style={{ fontSize:'1.05rem', fontWeight:800, color:'#0f172a', marginTop:'1px' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ background:'#fff', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(30,64,175,.07)', border:'1px solid #e0e7ff', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'12px' }}>
          <FiFilter color="#3b82f6" />
          <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex:'1 1 200px', border:'1.5px solid #c7d2fe', borderRadius:'8px', padding:'8px 12px', fontSize:'.88rem', color:'#0f172a', background:'#f8faff', outline:'none' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ border:'1.5px solid #c7d2fe', borderRadius:'8px', padding:'8px 12px', fontSize:'.85rem', color:'#0f172a', background:'#f8faff', outline:'none', cursor:'pointer' }}>
            <option value="">Tous les statuts</option>
            <option value="payé">Payé</option>
            <option value="impayé">Impayé</option>
          </select>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            style={{ border:'1.5px solid #c7d2fe', borderRadius:'8px', padding:'8px 12px', fontSize:'.85rem', color:'#0f172a', background:'#f8faff', outline:'none' }} />
          {(filterStatus || filterDateFrom || search) && (
            <button onClick={() => { setFilterStatus(''); setFilterDateFrom(''); setSearch(''); }}
              style={{ background:'#f1f5f9', border:'none', borderRadius:'7px', padding:'7px 14px', cursor:'pointer', color:'#64748b', fontSize:'.8rem', fontWeight:600 }}>
              Réinitialiser
            </button>
          )}
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'60px', textAlign:'center', border:'1px solid #e0e7ff' }}>
            <div style={{ fontSize:'2rem', marginBottom:'12px' }}>⏳</div>
            <p style={{ color:'#64748b' }}>Chargement des interventions…</p>
          </div>
        ) : error ? (
          <div style={{ background:'#fef2f2', borderRadius:'14px', padding:'40px', textAlign:'center', border:'1px solid #fecaca' }}>
            <p style={{ color:'#b91c1c' }}>{error}</p>
            <button onClick={() => fetchData(localStorage.getItem('token')!)} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer', fontWeight:600, marginTop:'12px' }}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'60px', textAlign:'center', border:'1px solid #e0e7ff' }}>
            <div style={{ fontSize:'3rem', marginBottom:'12px' }}>🚛</div>
            <p style={{ color:'#64748b' }}>Aucune intervention trouvée.</p>
          </div>
        ) : (
          <div style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 16px rgba(30,64,175,.09)', border:'1px solid #e0e7ff' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.845rem' }}>
                <thead>
                  <tr style={{ background:'linear-gradient(90deg,#1e3a8a,#3b82f6)' }}>
                    {['Date','Utilisateur','Événement','Statut','Assuré','Immatriculation','Marque','Lieu','Destination','Coût TTC','Actions'].map(h => (
                      <th key={h} style={{ padding:'13px 12px', color:'#fff', fontWeight:700, textAlign:'left', whiteSpace:'nowrap', fontSize:'.78rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => (
                    <tr key={inv.id}
                      style={{ background: i%2===0 ? '#fff' : '#eff6ff', borderBottom:'1px solid #dbeafe', transition:'background .15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background='#dbeafe'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i%2===0?'#fff':'#eff6ff'}
                    >
                      <td style={{ padding:'10px 12px', whiteSpace:'nowrap', color:'#334155' }}>{new Date(inv.date_intervention).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding:'10px 12px', color:'#475569' }}>{inv.user?.username || '—'}</td>
                      <td style={{ padding:'10px 12px', fontWeight:600, color:'#0f172a' }}>{inv.evenement}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{
                          padding:'3px 10px', borderRadius:'999px', fontWeight:700, fontSize:'.75rem',
                          background: inv.status === 'payé' ? '#d1fae5' : '#fee2e2',
                          color:       inv.status === 'payé' ? '#065f46' : '#b91c1c',
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', color:'#475569' }}>{inv.assure || '—'}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ background:'#f1f5f9', color:'#334155', padding:'2px 8px', borderRadius:'6px', fontSize:'.78rem', fontWeight:600 }}>
                          {inv.immatriculation || '—'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', color:'#475569' }}>{inv.marque || '—'}</td>
                      <td style={{ padding:'10px 12px', color:'#475569' }}>{inv.lieu_intervention || '—'}</td>
                      <td style={{ padding:'10px 12px', color:'#475569' }}>{inv.destination || '—'}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ background:'#d1fae5', color:'#065f46', padding:'3px 10px', borderRadius:'8px', fontWeight:700, fontSize:'.82rem', whiteSpace:'nowrap' }}>
                          {Number(inv.cout_ttc||0).toLocaleString('fr-FR')} MAD
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <button onClick={() => handleDelete(inv.id)} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:'7px', padding:'6px 10px', cursor:'pointer', fontSize:'.75rem', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
                          <FiTrash2 size={12} /> Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'12px 20px', background:'#eff6ff', borderTop:'1px solid #dbeafe', fontSize:'.78rem', color:'#64748b', display:'flex', justifyContent:'space-between' }}>
              <span>{filtered.length} intervention{filtered.length>1?'s':''} affichée{filtered.length>1?'s':''}</span>
              <span>Total filtré TTC : <strong style={{ color:'#065f46' }}>{filtered.reduce((s,i)=>s+(Number(i.cout_ttc)||0),0).toLocaleString('fr-FR')} MAD</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionRecords;
