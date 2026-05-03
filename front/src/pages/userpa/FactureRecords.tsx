import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FactureData } from './OperationForm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiFileText, FiTrash2, FiDownload, FiRefreshCw, FiEdit2, FiX, FiSave, FiHome } from 'react-icons/fi';

interface EditForm {
  facture_num: string; date: string; billing_company: string;
  reference: string; lieu_intervention: string; destination: string;
  montant_ht: string; tva: string; montant_ttc: string;
}

const FactureRecords: React.FC = () => {
  const [facturesData, setFacturesData] = useState<FactureData[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [editId, setEditId]             = useState<number | null>(null);
  const [editForm, setEditForm]         = useState<EditForm | null>(null);
  const [saving, setSaving]             = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/get_factures/', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { const t = await refreshToken(); if (t) return fetchData(t); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setFacturesData(await res.json());
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const refreshToken = async (): Promise<string | null> => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) { navigate('/login'); return null; }
    try {
      const res = await fetch('/api/token/refresh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('token', data.access); return data.access; }
      navigate('/login'); return null;
    } catch { navigate('/login'); return null; }
  };

  const deleteFacture = async (id: number) => {
    if (!window.confirm('Supprimer cette facture définitivement ?')) return;
    const token = localStorage.getItem('token')!;
    const res = await fetch(`/api/facture/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchData(token);
    else if (res.status === 401) { const t = await refreshToken(); if (t) deleteFacture(id); }
  };

  const openEdit = (f: FactureData) => {
    setEditId(f.id);
    setEditForm({
      facture_num: f.facture_num || '',
      date: f.date ? f.date.split('T')[0] : '',
      billing_company: (f.billing_company_name_display || f.billing_company || '') as string,
      reference: (f as any).reference || '',
      lieu_intervention: (f as any).lieu_intervention || '',
      destination: (f as any).destination || '',
      montant_ht: String((f as any).montant_ht || ''),
      tva: String((f as any).tva || ''),
      montant_ttc: String(f.montant_ttc || ''),
    });
  };

  const saveEdit = async () => {
    if (!editId || !editForm) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token')!;
      const res = await fetch(`/api/facture/${editId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setEditId(null); setEditForm(null); fetchData(token); }
      else {
        const err = await res.json();
        alert('Erreur: ' + JSON.stringify(err));
      }
    } catch (e) { alert('Erreur réseau'); }
    finally { setSaving(false); }
  };

  const exportAllPDF = () => {
    if (!facturesData.length) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(14); doc.text('Registre des Factures', 14, 16);
    doc.setFontSize(9);  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['N° Facture','Date','Société','Référence','Lieu','Destination','Montant HT','TVA','Montant TTC']],
      body: facturesData.map(f => [
        f.facture_num||'—', f.date||'—', f.billing_company||'—',
        (f as any).reference||'—', (f as any).lieu_intervention||'—', (f as any).destination||'—',
        `${(f as any).montant_ht||0} MAD`, `${(f as any).tva||0}%`, `${f.montant_ttc||0} MAD`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [45,16,96], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245,243,255] },
    });
    doc.save(`factures_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalTTC = facturesData.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0);
  const totalHT  = facturesData.reduce((s, f) => s + (Number((f as any).montant_ht) || 0), 0);
  const lastDate = facturesData.length
    ? facturesData.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : null;

  const filtered = facturesData.filter(f =>
    [f.facture_num, f.billing_company, (f as any).reference, (f as any).lieu_intervention, (f as any).destination]
      .some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg,#1a0533 0%,#2d1060 50%,#1e3a5f 100%)', padding: '0 clamp(16px,4vw,36px)', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,.25)', position: 'sticky', top: 0, zIndex: 50, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem' }}>
            ← Retour
          </button>
          <button onClick={() => navigate('/home')} style={{ background: 'rgba(168,85,247,.2)', border: '1px solid rgba(168,85,247,.3)', color: '#c4b5fd', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.82rem' }}>
            <FiHome size={13} /> Accueil
          </button>
        </div>
        <div style={{ fontWeight: 900, fontSize: 'clamp(.85rem,2vw,1rem)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiFileText /> Registre des Factures
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchData(localStorage.getItem('token')!)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.8rem', fontWeight: 600 }}>
            <FiRefreshCw size={12} /> Actualiser
          </button>
          <button onClick={exportAllPDF} style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.8rem', fontWeight: 700, boxShadow: '0 3px 10px rgba(124,58,237,.35)' }}>
            <FiDownload size={12} /> Exporter PDF
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,24px)' }}>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '14px', marginBottom: '22px' }}>
          {[
            { color: '#7c3aed', icon: '🧾', label: 'Total Factures',   value: String(facturesData.length) },
            { color: '#10b981', icon: '💰', label: 'Total HT',         value: `${totalHT.toLocaleString('fr-FR')} MAD` },
            { color: '#f59e0b', icon: '📈', label: 'Total TTC',        value: `${totalTTC.toLocaleString('fr-FR')} MAD` },
            { color: '#ec4899', icon: '📅', label: 'Dernière facture', value: lastDate ? new Date(lastDate).toLocaleDateString('fr-FR') : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1px solid #e8ecf4', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', boxShadow: '0 2px 10px rgba(0,0,0,.05)', border: '1px solid #e8ecf4', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔍</span>
          <input type="text" placeholder="Rechercher par numéro, société, référence, lieu…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '.86rem', color: '#0f172a', background: '#f8faff', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = '#7c3aed')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#64748b', fontSize: '.8rem' }}>Effacer</button>}
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '60px', textAlign: 'center', border: '1px solid #e8ecf4' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e8ecf4', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ color: '#64748b', margin: 0 }}>Chargement…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', borderRadius: '14px', padding: '40px', textAlign: 'center', border: '1px solid #fecaca' }}>
            <p style={{ color: '#b91c1c', margin: '0 0 16px' }}>⚠ {error}</p>
            <button onClick={() => fetchData(localStorage.getItem('token')!)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '60px', textAlign: 'center', border: '1px solid #e8ecf4' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧾</div>
            <p style={{ color: '#94a3b8', margin: 0 }}>Aucune facture trouvée.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,.07)', border: '1px solid #e8ecf4' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.845rem', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#2d1060,#1e3a5f)' }}>
                    {['N° Facture','Date','Société','Référence','Lieu','Destination','Montant HT','TVA','Montant TTC','Ajouté par','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', color: '#fff', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap', fontSize: '.75rem', letterSpacing: '.3px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr key={f.id}
                      style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff', borderBottom: '1px solid #f1f5f9', transition: 'background .12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f5f3ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#faf8ff'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '999px', fontWeight: 700, fontSize: '.78rem' }}>{f.facture_num || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#334155', whiteSpace: 'nowrap' }}>{f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{f.billing_company || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{(f as any).reference || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{(f as any).lieu_intervention || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{(f as any).destination || '—'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{Number((f as any).montant_ht || 0).toLocaleString('fr-FR')} MAD</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '6px', fontSize: '.78rem', fontWeight: 600 }}>{(f as any).tva || 0}%</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '.84rem', whiteSpace: 'nowrap' }}>{Number(f.montant_ttc || 0).toLocaleString('fr-FR')} MAD</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {(f as any).user?.username
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f3e8ff', color: '#6d28d9', borderRadius: '999px', padding: '3px 10px', fontWeight: 700, fontSize: '.75rem', whiteSpace: 'nowrap' }}>
                              <span style={{ width: '18px', height: '18px', background: '#7c3aed', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 800 }}>
                                {(f as any).user.username[0].toUpperCase()}
                              </span>
                              {(f as any).user.username}
                            </span>
                          : <span style={{ color: '#94a3b8', fontSize: '.78rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
                          <button onClick={() => navigate(`/generate-facture/${f.id}`)}
                            style={{ background: '#ede9fe', border: '1px solid #c4b5fd', color: '#6d28d9', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                            <FiFileText size={11} /> PDF
                          </button>
                          <button onClick={() => openEdit(f)}
                            style={{ background: '#fef9c3', border: '1px solid #fde68a', color: '#92400e', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <FiEdit2 size={11} /> Modifier
                          </button>
                          <button onClick={() => deleteFacture(f.id)}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <FiTrash2 size={11} /> Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '11px 18px', background: '#faf8ff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '.78rem', color: '#64748b' }}>
              <span>{filtered.length} facture{filtered.length > 1 ? 's' : ''}</span>
              <span>Total filtré TTC : <strong style={{ color: '#065f46' }}>{filtered.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0).toLocaleString('fr-FR')} MAD</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editId && editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) { setEditId(null); setEditForm(null); } }}
        >
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.3)' }}>
            {/* modal header */}
            <div style={{ background: 'linear-gradient(135deg,#1a0533,#2d1060)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                <FiEdit2 /> Modifier la facture
              </div>
              <button onClick={() => { setEditId(null); setEditForm(null); }} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <FiX />
              </button>
            </div>

            {/* modal body */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { key: 'facture_num',      label: 'N° Facture',    type: 'text' },
                { key: 'date',             label: 'Date',          type: 'date' },
                { key: 'billing_company',  label: 'Société',       type: 'text' },
                { key: 'reference',        label: 'Référence',     type: 'text' },
                { key: 'lieu_intervention',label: 'Lieu',          type: 'text' },
                { key: 'destination',      label: 'Destination',   type: 'text' },
                { key: 'montant_ht',       label: 'Montant HT',   type: 'number' },
                { key: 'tva',              label: 'TVA (%)',       type: 'number' },
                { key: 'montant_ttc',      label: 'Montant TTC',  type: 'number' },
              ].map(field => (
                <div key={field.key} style={{ gridColumn: field.key === 'billing_company' || field.key === 'lieu_intervention' ? 'span 2' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.4px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={(editForm as any)[field.key]}
                    onChange={e => setEditForm(prev => prev ? { ...prev, [field.key]: e.target.value } : prev)}
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '9px', padding: '9px 12px', fontSize: '.86rem', color: '#0f172a', background: '#f8faff', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>
              ))}
            </div>

            {/* modal footer */}
            <div style={{ padding: '0 24px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditId(null); setEditForm(null); }}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '10px', padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '.86rem' }}>
                Annuler
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ background: saving ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', borderRadius: '10px', padding: '10px 28px', cursor: saving ? 'default' : 'pointer', fontWeight: 800, fontSize: '.86rem', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 14px rgba(124,58,237,.35)' }}>
                <FiSave size={14} /> {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureRecords;
