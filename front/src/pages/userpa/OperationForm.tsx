import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Save, History, Home, ChevronLeft } from 'lucide-react';
import axios from 'axios';

import { evenementOptions, serviceOptions, statusOptions } from './operation-form/constants';
import { validateForm } from './operation-form/helpers';
import { formReducer, initialState } from './operation-form/state';
import ClientSection from './operation-form/sections/ClientSection';
import FinancialSection from './operation-form/sections/FinancialSection';
import GeneralInfoSection from './operation-form/sections/GeneralInfoSection';
import LocationSection from './operation-form/sections/LocationSection';
import SuiviCarburantFormSection from './operation-form/sections/SuiviCarburantFormSection';
import type { FieldChangeEvent, FormType, SocieteAssistance } from './operation-form/types';
import { API_BASE_URL } from './operation-form/types';
import logo from './assets/logo.png';

const OperationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawType = searchParams.get('type');
  const formType: FormType = rawType === 'suivi_carburant' ? 'suivi_carburant' : 'intervention';
  const recordId: number | null = null;

  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors]       = useState<Record<string, string>>({});
  const [societesAssistance, setSocietesAssistance] = useState<SocieteAssistance[]>([]);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  const societeOptions = useMemo(
    () => societesAssistance.map((s) => ({ value: s.id, label: s.nom })),
    [societesAssistance]
  );
  const displayedErrors = useMemo(
    () => (hasSubmittedOnce ? formErrors : {}),
    [hasSubmittedOnce, formErrors]
  );

  /* ── fetch societes ── */
  useEffect(() => {
    if (formType !== 'intervention' || societesAssistance.length > 0) return;
    const fetchSocietes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setError("Aucun token d'authentification. Reconnectez-vous."); return; }
        const res = await axios.get<SocieteAssistance[]>(API_BASE_URL + '/api/societes_assistance/', {
          headers: { Authorization: 'Bearer ' + token },
        });
        setSocietesAssistance(res.data);
      } catch (e: any) {
        setError(e.response?.data?.detail || e.message || 'Erreur chargement societes');
        if (e.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
      }
    };
    fetchSocietes();
  }, [formType, navigate, societesAssistance.length]);

  /* ── default societe ── */
  useEffect(() => {
    if (formType !== 'intervention' || societesAssistance.length === 0) return;
    if (formState.general.societe_assistance !== '') return;
    const def = societesAssistance.find((s) => s.nom === 'RMA') || societesAssistance[0];
    if (def) dispatch({ type: 'UPDATE_GENERAL', payload: { societe_assistance: def.id } });
  }, [formType, formState.general.societe_assistance, societesAssistance]);

  /* ── auto-calculate HT ── */
  useEffect(() => {
    if (formType === 'intervention') {
      const ttc = parseFloat(formState.financial.cout_prestation_ttc || '0');
      const tva = parseFloat(formState.financial.tva || '0');
      if (!isNaN(ttc) && !isNaN(tva) && ttc > 0) {
        const ht = (ttc / (1 + tva / 100)).toFixed(2);
        if (ht !== formState.financial.montant_ht)
          dispatch({ type: 'UPDATE_FINANCIAL', payload: { montant_ht: ht } });
      } else if (formState.financial.montant_ht !== '') {
        dispatch({ type: 'UPDATE_FINANCIAL', payload: { montant_ht: '' } });
      }
    }
    setFormErrors(validateForm(formState, formType, societesAssistance));
  }, [formState, formType, societesAssistance]);

  /* ── input handler ── */
  const handleInputChange = useCallback((event: FieldChangeEvent) => {
    const { name, value } = event.target;
    if (['montant_ht','tva','prix','cout_prestation_ttc'].includes(name) && value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    if (name === 'societe_assistance') {
      const v = value === '' ? '' : parseInt(value, 10);
      dispatch({ type: 'UPDATE_GENERAL', payload: { societe_assistance: v } });
      const sel = societesAssistance.find((s) => s.id === v);
      if (sel?.nom !== 'IMA') dispatch({ type: 'UPDATE_LOCATION', payload: { group_id: null } });
      return;
    }
    if (['date_intervention','ref_dossier'].includes(name)) { dispatch({ type: 'UPDATE_GENERAL', payload: { [name]: value } }); return; }
    if (['assure','immatriculation','marque'].includes(name)) { dispatch({ type: 'UPDATE_CLIENT', payload: { [name]: value } }); return; }
    if (['point_attach','lieu_intervention','destination','status','evenement','group_id'].includes(name)) { dispatch({ type: 'UPDATE_LOCATION', payload: { [name]: value } }); return; }
    if (['montant_ht','tva','cout_prestation_ttc'].includes(name)) { dispatch({ type: 'UPDATE_FINANCIAL', payload: { [name]: value } }); return; }
    if (['date','vehicule','service','pompiste','prix','smitoStation'].includes(name)) dispatch({ type: 'UPDATE_SUIVI_CARBURANT', payload: { [name]: value } });
  }, [societesAssistance]);

  /* ── submit ── */
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmittedOnce(true);
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const errors = validateForm(formState, formType, societesAssistance);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setIsLoading(false); return; }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token auth');

      let payload: any;
      let apiUrl = '';

      if (formType === 'intervention') {
        payload = {
          date_intervention: formState.general.date_intervention,
          societe_assistance_id: formState.general.societe_assistance === '' ? null : formState.general.societe_assistance,
          ref_dossier: formState.general.ref_dossier,
          assure: formState.client.assure,
          immatriculation: formState.client.immatriculation,
          marque: formState.client.marque,
          point_attach: formState.location.point_attach,
          lieu_intervention: formState.location.lieu_intervention,
          destination: formState.location.destination,
          status: formState.location.status,
          evenement: formState.location.evenement,
          group_id: societesAssistance.find((s) => s.id === formState.general.societe_assistance)?.nom === 'IMA'
            ? formState.location.group_id || null : null,
          montant_ht: parseFloat(formState.financial.montant_ht || '0'),
          tva: parseFloat(formState.financial.tva || '0'),
          cout_prestation_ttc: parseFloat(formState.financial.cout_prestation_ttc || '0'),
        };
        apiUrl = API_BASE_URL + '/api/intervention/';
      }

      if (formType === 'suivi_carburant') {
        payload = {
          date: formState.suiviCarburant.date,
          vehicule: formState.suiviCarburant.vehicule,
          service: formState.suiviCarburant.service,
          pompiste: formState.suiviCarburant.pompiste,
          prix: parseFloat(formState.suiviCarburant.prix || '0'),
          smitoStation: formState.suiviCarburant.smitoStation,
        };
        apiUrl = API_BASE_URL + '/api/suivi_carburant/';
      }

      const response = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      });

      setSuccessMessage((formType === 'intervention' ? 'Intervention' : 'Suivi carburant') + ' enregistré(e) avec succès !');
      dispatch({ type: 'RESET_FORM' });
      setHasSubmittedOnce(false);

      if (formType === 'intervention') {
        const id = response.data.id;
        if (!id) throw new Error('ID intervention non retourné');
        navigate('/generate-facture/' + id);
      } else {
        navigate('/userhistory');
      }
    } catch (err: any) {
      let msg = 'Erreur lors de l\'enregistrement';
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'object' && !Array.isArray(d))
          msg = Object.keys(d).map((k) => `${k}: ${Array.isArray(d[k]) ? d[k].join(', ') : d[k]}`).join('; ');
        else if (typeof d === 'string') msg = d;
      } else if (err?.message) msg = err.message;
      setError('Erreur : ' + msg);
      if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
    } finally {
      setIsLoading(false);
    }
  }, [formState, formType, navigate, societesAssistance]);

  /* ── derived ── */
  const isIntervention = formType === 'intervention';
  const pageTitle = isIntervention ? 'Nouvelle Intervention' : 'Suivi Carburant';
  const pageIcon  = isIntervention ? '🚛' : '⛽';
  const accentColor = isIntervention ? '#7c3aed' : '#0ea5e9';
  const accentLight = isIntervention ? '#ede9fe' : '#e0f2fe';
  const accentText  = isIntervention ? '#6d28d9' : '#0369a1';

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: 'Segoe UI,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        background: 'linear-gradient(135deg,#1a0533 0%,#2d1060 50%,#1e3a5f 100%)',
        padding: '0 clamp(14px,4vw,32px)',
        height: '66px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        position: 'sticky', top: 0, zIndex: 50,
        gap: '12px',
      }}>
        {/* Left: nav buttons + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.8rem' }}>
            <ChevronLeft size={14} /> Retour
          </button>
          <button onClick={() => navigate('/home')} style={{ background: 'rgba(168,85,247,.2)', border: '1px solid rgba(168,85,247,.3)', color: '#c4b5fd', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.8rem' }}>
            <Home size={13} /> Accueil
          </button>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Logo" style={{ height: '30px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Center: title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center', minWidth: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accentColor}30`, border: `1px solid ${accentColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
            {pageIcon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(.82rem,2vw,.98rem)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</div>
            <div style={{ fontSize: '.62rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              Remplissez les informations pour créer {isIntervention ? 'une intervention' : 'une fiche carburant'}
            </div>
          </div>
        </div>

        {/* Right: history */}
        <button onClick={() => navigate('/userhistory')} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '.8rem', flexShrink: 0 }}>
          <History size={13} /> Historique
        </button>
      </header>

      {/* ── BODY ── */}
      <main style={{ flex: 1, padding: 'clamp(16px,3vw,28px) clamp(12px,3vw,24px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Alerts */}
          {successMessage && (
            <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#065f46', fontWeight: 600, fontSize: '.88rem' }}>
              <CheckCircle size={18} color="#059669" /> {successMessage}
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontWeight: 600, fontSize: '.88rem' }}>
              <AlertCircle size={18} color="#dc2626" /> {error}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #e8ecf4' }}>
              <div style={{ width: '44px', height: '44px', border: `3px solid #e8ecf4`, borderTop: `3px solid ${accentColor}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ color: '#64748b', margin: 0, fontWeight: 600 }}>Enregistrement en cours…</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!isLoading && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {isIntervention && (
                <>
                  <Section title="Informations générales" icon="📋" color="#7c3aed">
                    <GeneralInfoSection values={formState.general} errors={displayedErrors} societeOptions={societeOptions} isDarkMode={false} onChange={handleInputChange} />
                  </Section>

                  <Section title="Client & Véhicule" icon="👤" color="#10b981">
                    <ClientSection values={formState.client} errors={displayedErrors} isDarkMode={false} onChange={handleInputChange} />
                  </Section>

                  <Section title="Localisation & Intervention" icon="📍" color="#8b5cf6">
                    <LocationSection values={formState.location} selectedSocieteId={formState.general.societe_assistance} societesAssistance={societesAssistance} statusOptions={statusOptions} evenementOptions={evenementOptions} errors={displayedErrors} isDarkMode={false} onChange={handleInputChange} />
                  </Section>

                  <Section title="Informations financières" icon="💰" color="#f59e0b">
                    <FinancialSection values={formState.financial} errors={displayedErrors} isDarkMode={false} onChange={handleInputChange} />
                  </Section>
                </>
              )}

              {!isIntervention && (
                <Section title="Suivi Carburant" icon="⛽" color="#0ea5e9">
                  <SuiviCarburantFormSection values={formState.suiviCarburant} serviceOptions={serviceOptions} errors={displayedErrors} isDarkMode={false} onChange={handleInputChange} />
                </Section>
              )}

              {/* Submit button */}
              <button type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                  background: isLoading ? '#c4b5fd' : `linear-gradient(135deg,${accentColor},${isIntervention ? '#a855f7' : '#38bdf8'})`,
                  color: '#fff', fontSize: '1rem', fontWeight: 800,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: `0 6px 20px ${accentColor}40`,
                  transition: 'all .2s',
                  letterSpacing: '.3px',
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Save size={18} />
                {recordId ? 'Modifier' : 'Enregistrer'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

/* ── Section wrapper card ── */
const Section: React.FC<{ title: string; icon: string; color: string; children: React.ReactNode }> = ({ title, icon, color, children }) => (
  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e8ecf4', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: `4px solid ${color}` }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: '.92rem', color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

export default OperationForm;
