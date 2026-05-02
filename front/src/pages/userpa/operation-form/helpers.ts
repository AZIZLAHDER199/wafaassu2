import type { FormErrors, FormState, FormType, SocieteAssistance } from './types';

export const calculateMontantTTC = (ht: string, tvaRate: string): string => {
  const htValue = parseFloat(ht) || 0;
  const tvaValue = parseFloat(tvaRate) || 0;
  return htValue > 0 ? (htValue * (1 + tvaValue / 100)).toFixed(2) : '0.00';
};

export const validateForm = (
  state: FormState,
  formType: FormType,
  societesAssistance: SocieteAssistance[]
): FormErrors => {
  const errors: FormErrors = {};
  const { general, client, location, financial, suiviCarburant } = state;

  if (formType === 'intervention') {
    if (!general.date_intervention) errors.date_intervention = 'Date requise';
    if (!general.societe_assistance) errors.societe_assistance = 'Societe requise';
    if (!general.ref_dossier) errors.ref_dossier = 'Reference requise';
    if (!client.assure) errors.assure = 'Assure requis';
    if (!client.immatriculation) errors.immatriculation = 'Immatriculation requise';
    if (!client.marque) errors.marque = 'Marque requise';
    if (!location.point_attach) errors.point_attach = 'Point requis';
    if (!location.lieu_intervention) errors.lieu_intervention = 'Lieu requis';
    if (!location.destination) errors.destination = 'Destination requise';
    if (!location.status) errors.status = 'Statut requis';
    if (!location.evenement) errors.evenement = 'Evenement requis';

    const selectedSociety = societesAssistance.find((societe) => societe.id === general.societe_assistance);
    if (selectedSociety?.nom === 'IMA' && !location.group_id) {
      errors.group_id = 'Groupe requis pour la societe IMA';
    }

    const ht = parseFloat(financial.montant_ht);
    if (Number.isNaN(ht)) {
      errors.montant_ht = 'Valeur numerique requise';
    } else if (ht <= 0) {
      errors.montant_ht = 'Cout HT positif requis';
    }

    const tva = parseFloat(financial.tva);
    if (Number.isNaN(tva)) {
      errors.tva = 'Valeur numerique requise';
    } else if (tva < 0) {
      errors.tva = 'TVA non negative requise';
    }
  }

  if (formType === 'suivi_carburant') {
    if (!suiviCarburant.date) errors.date = 'Date requise';
    if (!suiviCarburant.vehicule) errors.vehicule = 'Vehicule requis';
    if (!suiviCarburant.service) errors.service = 'Service requis';
    if (!suiviCarburant.smitoStation) errors.smitoStation = 'Station Smito requise';

    const prix = parseFloat(suiviCarburant.prix);
    if (Number.isNaN(prix)) {
      errors.prix = 'Prix numerique requis';
    } else if (prix <= 0) {
      errors.prix = 'Prix positif requis';
    }
  }

  return errors;
};
