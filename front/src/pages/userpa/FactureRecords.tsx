import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FactureData } from './OperationForm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiFileText, FiTrash2, FiDownload, FiRefreshCw, FiArrowLeft, FiTrendingUp } from 'react-icons/fi';

const FactureRecords: React.FC = () => {
  const [facturesData, setFacturesData]   = useState<FactureData[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/get_factures/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { const t = await refreshToken(); if (t) return fetchData(t); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: FactureData[] = await res.json();
      setFacturesData(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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

  const deleteFacture = async (id: number) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    const token = localStorage.getItem('token')!;
    const res = await fetch(`/api/facture/${id}/`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
    if (res.ok) fetchData(token);
    else if (res.status === 401) { const t = await refreshToken(); if (t) deleteFacture(id); }
  };

  const exportAllPDF = () => {
    if (!facturesData.length) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Registre des Factures', 14, 16);
    doc.setFontSize(9);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['N° Facture','Date','Société','Référence','Lieu','Destination','Montant HT','TVA','Montant TTC']],
      body: facturesData.map(f => [
        f.facture_num||'—', f.date||'—', f.billing_company||'—',
        f.reference||'—', f.lieu_intervention||'—', f.destination||'—',
        `${f.montant_ht||0} MAD`, `${f.tva||0}%`, `${f.montant_ttc||0} MAD`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30,64,175], textColor:255, fontStyle:'bold' },
      alternateRowStyles: { fillColor: [239,246,255] },
    });
    doc.save(`factures_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // stats
  const totalTTC   = facturesData.reduce((s,f) => s + (Number(f.montant_ttc)||0), 0);
  const totalHT    = facturesData.reduce((s,f) => s + (Number(f.montant_ht)||0),  0);
  const lastDate   = facturesData.length
    ? facturesData.slice().sort((a,b)=> new Date(b.date).getTime()-new Date(a.date).getTime())[0].date
    : null;

  const filtered = facturesData.filter(f =>
    [f.facture_num,f.billing_company,f.reference,f.lieu_intervention,f.destination]
      .some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* ── HEADER ── */}
      <div style={{
        background:'linear-gradient(135deg,#0891b2 0%,#38bdf8 100%)',
        padding:'28px 32px 24px',
        color:'#fff',
        boxShadow:'0 4px 20px rgba(8,145,178,.3)',
      }}>
        <div style={{maxWidth:'1200px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <button
              onClick={() => navigate('/home')}
              style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',borderRadius:'10px',padding:'8px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontWeight:600}}
            >
              <FiArrowLeft /> Retour
            </button>
            <div>
              <h1 style={{margin:0,fontSize:'1.65rem',fontWeight:800,display:'flex',alignItems:'center',gap:'10px'}}>
                <FiFileText /> Registre des Factures
              </h1>
              <p style={{margin:'4px 0 0',opacity:.8,fontSize:'.85rem'}}>Gestion et suivi des factures</p>
            </div>
          </div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
            <button onClick={() => fetchData(localStorage.getItem('token')!)}
              style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',borderRadius:'9px',padding:'9px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontWeight:600}}>
              <FiRefreshCw size={14}/> Actualiser
            </button>
            <button onClick={exportAllPDF}
              style={{background:'#fff',border:'none',color:'#0891b2',borderRadius:'9px',padding:'9px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontWeight:700}}>
              <FiDownload size={14}/> Exporter PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'28px 24px'}}>

        {/* ── STATS ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px',marginBottom:'28px'}}>
          <StatCard color="#0891b2" icon="🧾" label="Total Factures"    value={String(facturesData.length)} />
          <StatCard color="#10b981" icon="💰" label="Total HT"          value={`${totalHT.toLocaleString('fr-FR')} MAD`} />
          <StatCard color="#f97316" icon="📈" label="Total TTC"         value={`${totalTTC.toLocaleString('fr-FR')} MAD`} />
          <StatCard color="#7c3aed" icon="📅" label="Dernière facture"  value={lastDate ? new Date(lastDate).toLocaleDateString('fr-FR') : '—'} />
        </div>

        {/* ── SEARCH ── */}
        <div style={{background:'#fff',borderRadius:'12px',padding:'18px 22px',marginBottom:'24px',boxShadow:'0 2px 12px rgba(30,64,175,.07)',border:'1px solid #e0e7ff',display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'1.1rem'}}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher par numéro, société, référence, lieu..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex:1, border:'1.5px solid #c7d2fe', borderRadius:'8px',
              padding:'9px 14px', fontSize:'.88rem', color:'#0f172a',
              background:'#f8faff', outline:'none',
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              style={{background:'#f1f5f9',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer',color:'#64748b',fontSize:'.8rem'}}>
              Effacer
            </button>
          )}
        </div>

        {/* ── TABLE ── */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchData(localStorage.getItem('token')!)} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 2px 16px rgba(30,64,175,.09)',border:'1px solid #e0e7ff'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.855rem'}}>
                <thead>
                  <tr style={{background:'linear-gradient(90deg,#0891b2,#38bdf8)'}}>
                    {['N° Facture','Date','Société d\'assistance','Référence','Lieu','Destination','Montant HT','TVA','Montant TTC','Actions'].map(h => (
                      <th key={h} style={{padding:'13px 14px',color:'#fff',fontWeight:700,textAlign:'left',whiteSpace:'nowrap',fontSize:'.8rem',letterSpacing:'.3px'}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr key={f.id}
                      style={{
                        background: i%2===0 ? '#fff' : '#f0f9ff',
                        borderBottom:'1px solid #e0f2fe',
                        transition:'background .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background='#dbeafe'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i%2===0?'#fff':'#f0f9ff'}
                    >
                      <td style={{padding:'11px 14px'}}>
                        <span style={{background:'#dbeafe',color:'#1e40af',padding:'3px 10px',borderRadius:'999px',fontWeight:700,fontSize:'.78rem'}}>
                          {f.facture_num || '—'}
                        </span>
                      </td>
                      <td style={{padding:'11px 14px',color:'#334155',whiteSpace:'nowrap'}}>
                        {f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td style={{padding:'11px 14px',fontWeight:600,color:'#0f172a'}}>{f.billing_company || '—'}</td>
                      <td style={{padding:'11px 14px',color:'#475569'}}>{f.reference || '—'}</td>
                      <td style={{padding:'11px 14px',color:'#475569'}}>{f.lieu_intervention || '—'}</td>
                      <td style={{padding:'11px 14px',color:'#475569'}}>{f.destination || '—'}</td>
                      <td style={{padding:'11px 14px',fontWeight:600,color:'#0f172a',whiteSpace:'nowrap'}}>{Number(f.montant_ht||0).toLocaleString('fr-FR')} MAD</td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{background:'#fff7ed',color:'#c2410c',padding:'2px 8px',borderRadius:'6px',fontSize:'.78rem',fontWeight:600}}>
                          {f.tva || 0}%
                        </span>
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{background:'#d1fae5',color:'#065f46',padding:'4px 10px',borderRadius:'8px',fontWeight:700,fontSize:'.85rem',whiteSpace:'nowrap'}}>
                          {Number(f.montant_ttc||0).toLocaleString('fr-FR')} MAD
                        </span>
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <div style={{display:'flex',gap:'6px',flexWrap:'nowrap'}}>
                          <button
                            onClick={() => navigate(`/generate-facture/${f.id}`)}
                            style={{background:'#eff6ff',border:'1px solid #bfdbfe',color:'#1d4ed8',borderRadius:'7px',padding:'6px 10px',cursor:'pointer',fontSize:'.75rem',fontWeight:600,display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}}
                          >
                            <FiFileText size={12}/> Générer PDF
                          </button>
                          <button
                            onClick={() => deleteFacture(f.id)}
                            style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',borderRadius:'7px',padding:'6px 10px',cursor:'pointer',fontSize:'.75rem',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}
                          >
                            <FiTrash2 size={12}/> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{padding:'12px 20px',background:'#f8faff',borderTop:'1px solid #e0e7ff',fontSize:'.78rem',color:'#64748b',display:'flex',justifyContent:'space-between'}}>
              <span>{filtered.length} facture{filtered.length>1?'s':''} affichée{filtered.length>1?'s':''}</span>
              <span>Total filtré TTC : <strong style={{color:'#065f46'}}>{filtered.reduce((s,f)=>s+(Number(f.montant_ttc)||0),0).toLocaleString('fr-FR')} MAD</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureRecords;

/* ── sub-components ── */
const StatCard = ({color,icon,label,value}:{color:string;icon:string;label:string;value:string}) => (
  <div style={{background:'#fff',borderRadius:'14px',padding:'18px 20px',boxShadow:'0 2px 12px rgba(30,64,175,.07)',border:'1px solid #e0e7ff',display:'flex',alignItems:'center',gap:'14px'}}>
    <div style={{width:'48px',height:'48px',borderRadius:'12px',background:`${color}1a`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>{icon}</div>
    <div>
      <div style={{fontSize:'.72rem',color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</div>
      <div style={{fontSize:'1.1rem',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>{value}</div>
    </div>
  </div>
);

const LoadingState = () => (
  <div style={{background:'#fff',borderRadius:'14px',padding:'60px',textAlign:'center',border:'1px solid #e0e7ff'}}>
    <div style={{fontSize:'2rem',marginBottom:'12px'}}>⏳</div>
    <p style={{color:'#64748b',margin:0}}>Chargement des factures…</p>
  </div>
);

const ErrorState = ({message,onRetry}:{message:string;onRetry:()=>void}) => (
  <div style={{background:'#fef2f2',borderRadius:'14px',padding:'40px',textAlign:'center',border:'1px solid #fecaca'}}>
    <div style={{fontSize:'2rem',marginBottom:'12px'}}>⚠️</div>
    <p style={{color:'#b91c1c',margin:'0 0 16px'}}>{message}</p>
    <button onClick={onRetry} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 20px',cursor:'pointer',fontWeight:600}}>
      Réessayer
    </button>
  </div>
);

const EmptyState = () => (
  <div style={{background:'#fff',borderRadius:'14px',padding:'60px',textAlign:'center',border:'1px solid #e0e7ff'}}>
    <div style={{fontSize:'3rem',marginBottom:'12px'}}>🧾</div>
    <p style={{color:'#64748b',margin:0,fontSize:'1rem'}}>Aucune facture trouvée.</p>
  </div>
);
