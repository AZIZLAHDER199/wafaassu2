import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, ChevronLeft, Edit3, History, Moon, Save, Sun } from 'lucide-react';
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

const OperationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawType = searchParams.get('type');
  const formType: FormType = rawType === 'suivi_carburant' ? 'suivi_carburant' : 'intervention';
  const recordId: number | null = null;

  const [isDarkMode, setDarkMode] = useState(false);
  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [societesAssistance, setSocietesAssistance] = useState<SocieteAssistance[]>([]);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  const societeOptions = useMemo(
    () => societesAssistance.map((societe) => ({ value: societe.id, label: societe.nom })),
    [societesAssistance]
  );

  const displayedErrors = useMemo(() => (hasSubmittedOnce ? formErrors : {}), [hasSubmittedOnce, formErrors]);

  useEffect(() => {
    if (formType !== 'intervention' || societesAssistance.length > 0) {
      return;
    }

    const fetchSocietes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Aucun token d'authentification trouve. Veuillez vous connecter.");
          return;
        }

        const response = await axios.get<SocieteAssistance[]>(
          API_BASE_URL + '/api/societes_assistance/',
          { headers: { Authorization: 'Bearer ' + token } }
        );

        setSocietesAssistance(response.data);
      } catch (fetchError: any) {
        const message = fetchError.response?.data?.detail || fetchError.message || 'Erreur chargement societes';
        setError(message);

        if (fetchError.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchSocietes();
  }, [formType, navigate, societesAssistance.length]);

  useEffect(() => {
    if (formType !== 'intervention' || societesAssistance.length === 0) {
      return;
    }

    if (formState.general.societe_assistance !== '') {
      return;
    }

    const defaultSociety = societesAssistance.find((societe) => societe.nom === 'RMA') || societesAssistance[0];
    if (defaultSociety) {
      dispatch({ type: 'UPDATE_GENERAL', payload: { societe_assistance: defaultSociety.id } });
    }
  }, [formType, formState.general.societe_assistance, societesAssistance]);

  useEffect(() => {
    if (formType === 'intervention') {
      const ttc = parseFloat(formState.financial.cout_prestation_ttc || '0');
      const tva = parseFloat(formState.financial.tva || '0');

      if (!isNaN(ttc) && !isNaN(tva) && ttc > 0) {
        const ht = ttc / (1 + tva / 100);
        const formattedHt = ht.toFixed(2);

        if (formattedHt !== formState.financial.montant_ht) {
          dispatch({
            type: 'UPDATE_FINANCIAL',
            payload: { montant_ht: formattedHt },
          });
          return;
        }
      } else if (formState.financial.montant_ht !== '') {
        dispatch({
          type: 'UPDATE_FINANCIAL',
          payload: { montant_ht: '' },
        });
        return;
      }
    }

    setFormErrors(validateForm(formState, formType, societesAssistance));
  }, [formState, formType, societesAssistance]);

  const handleInputChange = useCallback(
    (event: FieldChangeEvent) => {
      const { name, value } = event.target;

      if (
        (name === 'montant_ht' ||
          name === 'tva' ||
          name === 'prix' ||
          name === 'cout_prestation_ttc') &&
        value !== '' &&
        !/^\d*\.?\d*$/.test(value)
      ) {
        return;
      }

      if (name === 'societe_assistance') {
        const societeValue = value === '' ? '' : parseInt(value, 10);
        dispatch({ type: 'UPDATE_GENERAL', payload: { societe_assistance: societeValue } });

        const selectedSociety = societesAssistance.find((societe) => societe.id === societeValue);
        if (selectedSociety?.nom !== 'IMA') {
          dispatch({ type: 'UPDATE_LOCATION', payload: { group_id: null } });
        }
        return;
      }

      if (['date_intervention', 'ref_dossier'].includes(name)) {
        dispatch({ type: 'UPDATE_GENERAL', payload: { [name]: value } });
        return;
      }

      if (['assure', 'immatriculation', 'marque'].includes(name)) {
        dispatch({ type: 'UPDATE_CLIENT', payload: { [name]: value } });
        return;
      }

      if (['point_attach', 'lieu_intervention', 'destination', 'status', 'evenement', 'group_id'].includes(name)) {
        dispatch({ type: 'UPDATE_LOCATION', payload: { [name]: value } });
        return;
      }

      if (['montant_ht', 'tva', 'cout_prestation_ttc'].includes(name)) {
        dispatch({ type: 'UPDATE_FINANCIAL', payload: { [name]: value } });
        return;
      }

      if (['date', 'vehicule', 'service', 'pompiste', 'prix', 'smitoStation'].includes(name)) {
        dispatch({ type: 'UPDATE_SUIVI_CARBURANT', payload: { [name]: value } });
      }
    },
    [societesAssistance]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setHasSubmittedOnce(true);
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const errors = validateForm(formState, formType, societesAssistance);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Aucun token auth trouve');
        }

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
            group_id:
              societesAssistance.find((societe) => societe.id === formState.general.societe_assistance)?.nom === 'IMA'
                ? formState.location.group_id || null
                : null,
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
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });

        setSuccessMessage(
          (formType === 'intervention' ? 'Intervention' : 'Suivi carburant') + ' enregistre(e) avec succes!'
        );
        dispatch({ type: 'RESET_FORM' });
        setHasSubmittedOnce(false);

        if (formType === 'intervention') {
          const interventionId = response.data.id;
          if (!interventionId) {
            throw new Error('ID intervention non retourne par API');
          }
          navigate('/generate-facture/' + interventionId);
        } else {
          navigate('/userhistory');
        }
      } catch (submitError: any) {
        let errorMessage = 'Erreur pendant enregistrement';

        if (axios.isAxiosError(submitError) && submitError.response?.data) {
          const backendErrors = submitError.response.data;
          if (typeof backendErrors === 'object' && !Array.isArray(backendErrors)) {
            errorMessage = Object.keys(backendErrors)
              .map((key) => {
                const value = backendErrors[key];
                const asText = Array.isArray(value) ? value.join(', ') : value;
                return key + ': ' + asText;
              })
              .join('; ');
          } else if (typeof backendErrors === 'string') {
            errorMessage = backendErrors;
          }
        } else if (submitError?.message) {
          errorMessage = submitError.message;
        }

        setError('Erreur: ' + errorMessage);
        if (submitError.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formState, formType, navigate, societesAssistance]
  );

  const toggleDarkMode = useCallback(() => setDarkMode((previous) => !previous), []);

  const handleHistoryClick = useCallback(() => {
    const userRole = localStorage.getItem('userRole');
    navigate(userRole === 'admin' ? '/adminhistory' : '/userhistory');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={
        'min-h-screen w-screen flex flex-col ' +
        (isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900')
      }
    >
      <div
        className={
          'sticky top-0 z-20 w-full border-b px-4 md:px-6 py-4 ' +
          (isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200')
        }
      >
        <div className="w-full flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
              <Edit3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {recordId
                  ? 'Modifier Intervention'
                  : 'Nouvelle operation (' + (formType === 'intervention' ? 'Intervention' : 'Suivi Carburant') + ')'}
              </h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                Remplissez les informations pour {recordId ? 'modifier' : 'creer'} une{' '}
                {formType === 'intervention' ? 'intervention' : 'fiche suivi carburant'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className={
                'flex items-center gap-2 px-4 py-2 rounded-xl border transition ' +
                (isDarkMode ? 'bg-gray-900 border-gray-700 text-yellow-400' : 'bg-white border-gray-200 text-gray-700')
              }
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={handleHistoryClick}
              className={
                'flex items-center gap-2 px-4 py-2 rounded-xl border transition ' +
                (isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700')
              }
            >
              <History className="h-5 w-5" /> Voir Historique
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={
                'flex items-center gap-2 px-4 py-2 rounded-xl border transition ' +
                (isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700')
              }
            >
              <ChevronLeft className="h-5 w-5" /> Retour
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-3 md:px-6 py-6">
        <div className="w-full">
          {successMessage && (
            <div className="p-4 mb-6 rounded-2xl bg-green-100 text-green-800 flex items-center gap-2 shadow-sm">
              <CheckCircle className="h-5 w-5" /> {successMessage}
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-red-100 text-red-800 flex items-center gap-2 shadow-sm">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={
              'w-full min-h-[calc(100vh-140px)] flex flex-col gap-8 rounded-3xl border p-4 md:p-6 shadow-sm ' +
              (isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')
            }
          >
            {formType === 'intervention' && (
              <>
                <GeneralInfoSection
                  values={formState.general}
                  errors={displayedErrors}
                  societeOptions={societeOptions}
                  isDarkMode={isDarkMode}
                  onChange={handleInputChange}
                />

                <ClientSection
                  values={formState.client}
                  errors={displayedErrors}
                  isDarkMode={isDarkMode}
                  onChange={handleInputChange}
                />

                <LocationSection
                  values={formState.location}
                  selectedSocieteId={formState.general.societe_assistance}
                  societesAssistance={societesAssistance}
                  statusOptions={statusOptions}
                  evenementOptions={evenementOptions}
                  errors={displayedErrors}
                  isDarkMode={isDarkMode}
                  onChange={handleInputChange}
                />

                <FinancialSection
                  values={formState.financial}
                  errors={displayedErrors}
                  isDarkMode={isDarkMode}
                  onChange={handleInputChange}
                />
              </>
            )}

            {formType === 'suivi_carburant' && (
              <div className="flex-grow w-full">
                <SuiviCarburantFormSection
                  values={formState.suiviCarburant}
                  serviceOptions={serviceOptions}
                  errors={displayedErrors}
                  isDarkMode={isDarkMode}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="sticky bottom-0 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={
                  'w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 shadow-md transition ' +
                  (isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')
                }
              >
                <Save className="h-5 w-5" />
                {recordId ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OperationForm);