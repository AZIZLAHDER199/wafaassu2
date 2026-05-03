import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuiviCarburantData } from './OperationForm';
import { FiArrowLeft, FiRefreshCw, FiTrash2, FiDroplet } from 'react-icons/fi';

const SuiviCarburantRecords: React.FC = () => {
  const [suiviData, setSuiviData]   = useState<SuiviCarburantData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/get_suivi_carburant/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { const t = await refreshToken(); if (t) return fetchData(t); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: SuiviCarburantData[] = await res.json();
      setSuiviData(data);
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

  const deleteRecord = async (id: number) => {
    if (!window.confirm('Supprimer cet enregistrement ?')) return;
    const token = localStorage.getItem('token')!;
    const res = await fetch(`/api/suivi_carburant/${id}/`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
    if (res.ok) fetchData(token);
    else if (res.status === 401) { const t = await refreshToken(); if (t) deleteRecord(id); }
  };

  const totalPrix = suiviData.reduce((s, d) => s + (Number(d.prix) || 0), 0);
  const lastDate  = suiviData.length
    ? suiviData.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : null;

  const filtered = suiviData.filter(d =>
    [d.vehicule, d.service, d.pompiste, d.smitostation]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg,#ea580c 0%,#f97316 100%)', padding:'28px 32px 24px', color:'#fff', boxShadow:'0 4px 20px rgba(234,88,12,.3)' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <button onClick={() => navigate('/home')} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', borderRadius:'10px', padding:'8px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontWeight:600 }}>
              <FiArrowLeft /> Retour
            </button>
            <div>
              <h1 style={{ margin:0, fontSize:'1.65rem', fontWeight:800, display:'flex', alignItems:'center', gap:'10px' }}>
                <FiDroplet /> Suivi Carburant
              </h1>
              <p style={{ margin:'4px 0 0', opacity:.8, fontSize:'.85rem' }}>Suivi de la consommation carburant</p>
            </div>
          </div>
          <button onClick={() => fetchData(localStorage.getItem('token')!)} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff', borderRadius:'9px', padding:'9px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontWeight:600 }}>
            <FiRefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'28px 24px' }}>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px', marginBottom:'24px' }}>
          {[
            { icon:'⛽', label:'Total enregistrements', value: String(suiviData.length),   color:'#ea580c' },
            { icon:'💵', label:'Total dépenses',        value:`${totalPrix.toLocaleString('fr-FR')} MAD`, color:'#10b981' },
            { icon:'📅', label:'Dernière entrée',       value: lastDate ? new Date(lastDate).toLocaleDateString('fr-FR') : '—', color:'#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:'14px', padding:'18px 20px', boxShadow:'0 2px 12px rgba(30,64,175,.07)', border:'1px solid #e0e7ff', display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:`${s.color}1a`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:'.72rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.label}</div>
                <div style={{ fontSize:'1.05rem', fontWeight:800, color:'#0f172a', marginTop:'2px' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ background:'#fff', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', boxShadow:'0 2px 10px rgba(30,64,175,.07)', border:'1px solid #e0e7ff', display:'flex', alignItems:'center', gap:'10px' }}>
          <span>🔍</span>
          <input type="text" placeholder="Rechercher par véhicule, service, pompiste..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex:1, border:'1.5px solid #c7d2fe', borderRadius:'8px', padding:'8px 12px', fontSize:'.88rem', color:'#0f172a', background:'#f8faff', outline:'none' }} />
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'60px', textAlign:'center', border:'1px solid #e0e7ff' }}>
            <p style={{ color:'#64748b' }}>Chargement…</p>
          </div>
        ) : error ? (
          <div style={{ background:'#fef2f2', borderRadius:'14px', padding:'40px', textAlign:'center', border:'1px solid #fecaca' }}>
            <p style={{ color:'#b91c1c' }}>{error}</p>
            <button onClick={() => fetchData(localStorage.getItem('token')!)} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer', fontWeight:600, marginTop:'12px' }}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'60px', textAlign:'center', border:'1px solid #e0e7ff' }}>
            <div style={{ fontSize:'3rem', marginBottom:'12px' }}>⛽</div>
            <p style={{ color:'#64748b' }}>Aucun enregistrement trouvé.</p>
          </div>
        ) : (
          <div style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 16px rgba(30,64,175,.09)', border:'1px solid #e0e7ff' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.855rem' }}>
                <thead>
                  <tr style={{ background:'linear-gradient(90deg,#ea580c,#f97316)' }}>
                    {['Date','Ajouté par','Véhicule','Prix','Service','Pompiste','Station','Actions'].map(h => (
                      <th key={h} style={{ padding:'13px 14px', color:'#fff', fontWeight:700, textAlign:'left', whiteSpace:'nowrap', fontSize:'.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={d.id}
                      style={{ background: i%2===0 ? '#fff' : '#fff7ed', borderBottom:'1px solid #fed7aa', transition:'background .15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background='#ffedd5'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i%2===0?'#fff':'#fff7ed'}
                    >
                      <td style={{ padding:'11px 14px', color:'#334155', whiteSpace:'nowrap' }}>{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        {(d as any).user
                          ? <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#f3e8ff', color:'#6d28d9', borderRadius:'999px', padding:'3px 10px', fontWeight:700, fontSize:'.75rem' }}>
                              <span style={{ width:'18px', height:'18px', background:'#7c3aed', color:'#fff', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:800 }}>
                                {String((d as any).user)[0].toUpperCase()}
                              </span>
                              {String((d as any).user)}
                            </span>
                          : <span style={{ color:'#94a3b8', fontSize:'.78rem' }}>—</span>}
                      </td>
                      <td style={{ padding:'11px 14px', fontWeight:600, color:'#0f172a' }}>{d.vehicule || '—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ background:'#d1fae5', color:'#065f46', padding:'3px 10px', borderRadius:'8px', fontWeight:700, fontSize:'.82rem' }}>
                          {Number(d.prix||0).toLocaleString('fr-FR')} MAD
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px', color:'#475569' }}>{d.service || '—'}</td>
                      <td style={{ padding:'11px 14px', color:'#475569' }}>{d.pompiste || '—'}</td>
                      <td style={{ padding:'11px 14px', color:'#475569' }}>{(d as any).smitostation || '—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <button onClick={() => deleteRecord(d.id)} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:'7px', padding:'6px 12px', cursor:'pointer', fontSize:'.75rem', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
                          <FiTrash2 size={12} /> Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'12px 20px', background:'#fff7ed', borderTop:'1px solid #fed7aa', fontSize:'.78rem', color:'#64748b', display:'flex', justifyContent:'space-between' }}>
              <span>{filtered.length} enregistrement{filtered.length>1?'s':''}</span>
              <span>Total filtré : <strong style={{ color:'#065f46' }}>{filtered.reduce((s,d)=>s+(Number(d.prix)||0),0).toLocaleString('fr-FR')} MAD</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuiviCarburantRecords;
