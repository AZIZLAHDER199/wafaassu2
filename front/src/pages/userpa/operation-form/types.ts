import type { ChangeEvent } from 'react';

export const API_BASE_URL = 'http://127.0.0.1:8000';

export type FormType = 'intervention' | 'suivi_carburant';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SocieteAssistance {
  id: number;
  nom: string;
  ice?: string;
  adresse?: string;
}

export interface FormState {
  general: {
    date_intervention: string;
    societe_assistance: number | '';
    ref_dossier: string;
  };
  client: {
    assure: string;
    immatriculation: string;
    marque: string;
  };
  location: {
    point_attach: string;
    lieu_intervention: string;
    destination: string;
    status: string;
    evenement: string;
    group_id: string | null;
  };
  financial: {
    montant_ht: string;
    tva: string;
    cout_prestation_ttc: string;
  };
  suiviCarburant: {
    date: string;
    vehicule: string;
    service: string;
    pompiste: string;
    prix: string;
    smitoStation: string;
  };
}

export type FormErrors = Record<string, string>;

export type FormAction =
  | { type: 'UPDATE_GENERAL'; payload: Partial<FormState['general']> }
  | { type: 'UPDATE_CLIENT'; payload: Partial<FormState['client']> }
  | { type: 'UPDATE_LOCATION'; payload: Partial<FormState['location']> }
  | { type: 'UPDATE_FINANCIAL'; payload: Partial<FormState['financial']> }
  | { type: 'UPDATE_SUIVI_CARBURANT'; payload: Partial<FormState['suiviCarburant']> }
  | { type: 'RESET_FORM' };

export type FieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
