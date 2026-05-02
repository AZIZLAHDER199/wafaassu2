import type { SelectOption } from './types';

export const statusOptions: SelectOption[] = [
  { value: 'En cours', label: 'En cours' },
  { value: 'Annule', label: 'Annule' },
  { value: 'Complete', label: 'Complete' },
];

export const evenementOptions: SelectOption[] = [
  { value: 'Remorquage Interurbain', label: 'Remorquage Interurbain' },
  { value: 'Panne Mecanique', label: 'Panne Mecanique' },
  { value: 'Accident', label: 'Accident' },
  { value: 'Assistance', label: 'Assistance' },
];

export const serviceOptions: SelectOption[] = [
  { value: 'Carburant', label: 'Carburant' },
  { value: 'Vidange', label: 'Vidange' },
  { value: 'Reparation', label: 'Reparation' },
  { value: 'Autres', label: 'Autres' },
];
