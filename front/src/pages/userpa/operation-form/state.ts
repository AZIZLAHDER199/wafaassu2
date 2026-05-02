import type { FormAction, FormState } from './types';

const today = new Date().toISOString().split('T')[0];

export const initialState: FormState = {
  general: {
    date_intervention: today,
    societe_assistance: '',
    ref_dossier: '',
  },
  client: {
    assure: '',
    immatriculation: '',
    marque: '',
  },
  location: {
    point_attach: 'TAMANAR',
    lieu_intervention: '',
    destination: '',
    status: 'En cours',
    evenement: 'Remorquage Interurbain',
    group_id: null,
  },
  financial: {
    montant_ht: '0.00',
    tva: '20',
    cout_prestation_ttc: '',
  },
  suiviCarburant: {
    date: today,
    vehicule: '',
    service: 'Carburant',
    pompiste: '',
    prix: '',
    smitoStation: '',
  },
};

export const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'UPDATE_GENERAL':
      return { ...state, general: { ...state.general, ...action.payload } };
    case 'UPDATE_CLIENT':
      return { ...state, client: { ...state.client, ...action.payload } };
    case 'UPDATE_LOCATION':
      return { ...state, location: { ...state.location, ...action.payload } };
    case 'UPDATE_FINANCIAL':
      return { ...state, financial: { ...state.financial, ...action.payload } };
    case 'UPDATE_SUIVI_CARBURANT':
      return { ...state, suiviCarburant: { ...state.suiviCarburant, ...action.payload } };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
};
