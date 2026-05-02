import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Download, ChevronLeft, Eye, FileText, Calendar, Building, MapPin, DollarSign, List, Info, Printer } from 'lucide-react';
import Navbar from '../../components/Navbar';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface InterventionData {
  id: number;
  ref_dossier: string;
  assure: string;
  date_intervention: string;
  evenement: string;
  marque?: string;
  immatriculation?: string;
  lieu_intervention?: string;
  destination?: string;
  cout_prestation_ttc: string | number;
  societe_assistance?: {
    id: number;
    nom: string;
    ice: string;
    adresse: string;
  };
}

interface SocieteAssistanceData {
  id: number;
  nom: string;
  ice: string;
  adresse: string;
}

interface FormData {
  facture_num: string;
  date: string;
  billing_company: string;
  ice: string;
  adresse: string;
  reference: string;
  point_attach: string;
  lieu_intervention: string;
  destination: string;
  perimetre: string;
  description: string;
  montant_ttc: string;
  montant_ht: string;
  tva: string;
}

const GenerateFacturePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [intervention, setIntervention] = useState<InterventionData | null>(null);
  const [societesAssistance, setSocietesAssistance] = useState<SocieteAssistanceData[]>([]);
  const [formData, setFormData] = useState<FormData>({
    facture_num: '',
    date: new Date().toISOString().substring(0, 10),
    billing_company: '',
    ice: '',
    adresse: '',
    reference: '',
    point_attach: 'TAMANAR',
    lieu_intervention: '',
    destination: '',
    perimetre: 'Rayon 50 KM',
    description: '',
    montant_ttc: '0.00',
    montant_ht: '0.00',
    tva: '0.00',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [preview, setPreview] = useState<boolean>(false);
  const [pdfGenerationLoading, setPdfGenerationLoading] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    return storedDarkMode ? JSON.parse(storedDarkMode) : false;
  });

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#121212';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#FFFFFF';
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const fetchInterventionAndInitForm = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token d\'authentification trouvé. Veuillez vous connecter.');

      const interventionRes = await axios.get<InterventionData>(`${API_BASE_URL}/api/intervention/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedIntervention = interventionRes.data;
      setIntervention(fetchedIntervention);

      const societesRes = await axios.get<SocieteAssistanceData[]>(`${API_BASE_URL}/api/societes-assistance/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSocietesAssistance(societesRes.data);

      const nextFactureNumRes = await axios.get<{ facture_num: string }>(`${API_BASE_URL}/api/next_facture_number/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextFactureNum = nextFactureNumRes.data.facture_num;

      const initialDescription = `Assistance pour véhicule ${fetchedIntervention.evenement || ''} - Véhicule ${fetchedIntervention.marque || ''} (${fetchedIntervention.immatriculation || ''}) du ${new Date(fetchedIntervention.date_intervention).toLocaleDateString('fr-FR')} à ${fetchedIntervention.lieu_intervention || ''} vers ${fetchedIntervention.destination || ''}.`;
      
      const initialMontantTTC_num = parseFloat(String(fetchedIntervention.cout_prestation_ttc));
      const initialMontantTTC = isNaN(initialMontantTTC_num) ? '0.00' : initialMontantTTC_num.toFixed(2);

      const tvaRate = 0.20;
      const initialMontantHT = (parseFloat(initialMontantTTC) / (1 + tvaRate)).toFixed(2);
      const initialTVA = (parseFloat(initialMontantTTC) - parseFloat(initialMontantHT)).toFixed(2);
      
      const initialSociete = fetchedIntervention.societe_assistance || { nom: '', ice: '', adresse: '' };

      setFormData({
        facture_num: nextFactureNum,
        date: new Date().toISOString().substring(0, 10),
        billing_company: initialSociete.nom,
        ice: initialSociete.ice,
        adresse: initialSociete.adresse,
        reference: fetchedIntervention.ref_dossier,
        point_attach: 'TAMANAR',
        lieu_intervention: fetchedIntervention.lieu_intervention || '',
        destination: fetchedIntervention.destination || '',
        perimetre: 'Rayon 50 KM',
        description: initialDescription,
        montant_ttc: initialMontantTTC,
        montant_ht: initialMontantHT,
        tva: initialTVA,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement de l\'intervention.');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchInterventionAndInitForm();
    } else {
      setError("ID de l'intervention non fourni.");
      setLoading(false);
    }
  }, [id, fetchInterventionAndInitForm]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSocieteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSociete = societesAssistance.find(s => s.nom === e.target.value);
    if (selectedSociete) {
      setFormData(prev => ({
        ...prev,
        billing_company: selectedSociete.nom,
        ice: selectedSociete.ice,
        adresse: selectedSociete.adresse,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        billing_company: e.target.value,
        ice: '',
        adresse: '',
      }));
    }
  }, [societesAssistance]);

  const convertToWords = useMemo(() => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    const convertLessThanOneThousand = (num: number): string => {
        let text = '';
        if (num >= 100) {
            if (Math.floor(num / 100) > 1) {
                text += units[Math.floor(num / 100)] + ' ';
            }
            text += 'cent';
            if (num % 100 === 0 && num > 100) {
                text += 's';
            }
            num %= 100;
            if (num > 0) {
                text += ' ';
            }
        }
        if (num >= 10 && num <= 19) {
            text += teens[num - 10];
        } else if (num >= 20) {
            text += tens[Math.floor(num / 10)];
            if (num % 10 > 0) {
                text += '-' + units[num % 10];
            }
        } else if (num > 0) {
            text += units[num];
        }
        return text.trim();
    };

    return (num: number): string => {
        if (num === 0) return 'ZÉRO';
        const numStr = num.toFixed(2);
        const [integerPart, decimalPart] = numStr.split('.');
        let text = '';
        let n = parseInt(integerPart, 10);

        if (n >= 1_000_000_000) {
            text += convertLessThanOneThousand(Math.floor(n / 1_000_000_000)) + ' milliard ';
            n %= 1_000_000_000;
        }
        if (n >= 1_000_000) {
            text += convertLessThanOneThousand(Math.floor(n / 1_000_000)) + ' million ';
            n %= 1_000_000;
        }
        if (n >= 1000) {
            if (Math.floor(n / 1000) > 1) {
                text += convertLessThanOneThousand(Math.floor(n / 1000)) + ' mille ';
            } else {
                text += 'mille ';
            }
            n %= 1000;
        }
        text += convertLessThanOneThousand(n);
        
        let finalText = text.replace(/\s+/g, ' ').trim().toUpperCase();

        if (decimalPart && parseInt(decimalPart, 10) > 0) {
            finalText += ' VIRGULE ' + parseInt(decimalPart, 10) + ' CENTIMES';
        }

        if (finalText.startsWith('UN MILLE')) {
            finalText = finalText.replace('UN MILLE', 'MILLE');
        }

        return finalText;
    };
}, []);

  const validateForm = useCallback(() => {
    const errors: Partial<FormData> = {};
    if (!formData.facture_num) errors.facture_num = 'Le numéro de facture est requis.';
    if (!formData.date) errors.date = 'La date est requise.';
    if (!formData.billing_company) errors.billing_company = 'Le destinataire est requis.';
    if (!formData.reference) errors.reference = 'La référence est requise.';
    if (!formData.description) errors.description = 'La description est requise.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmitPreview = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setPreview(true);
    }
  }, [validateForm]);

  const handleGeneratePDF = useCallback(async () => {
    if (!id || !intervention) return;
    setPdfGenerationLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token d\'authentification manquant.');

      const response = await axios.post(
        `${API_BASE_URL}/api/generate_facture_pdf/${id}/`,
        {
          ...formData,
          montant_ht: parseFloat(formData.montant_ht),
          tva: parseFloat(formData.tva),
          montant_ttc: parseFloat(formData.montant_ttc),
          montant_ttc_text: convertToWords(parseFloat(formData.montant_ttc)),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfBlobUrl(window.URL.createObjectURL(blob));
      alert('Facture PDF générée et sauvegardée avec succès!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de la génération de la facture.';
      alert(`Erreur: ${errorMessage}`);
      console.error('Generate PDF Error:', err.response?.data || err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setPdfGenerationLoading(false);
    }
  }, [id, intervention, formData, convertToWords, navigate]);

  const downloadPdf = useCallback(() => {
    if (pdfBlobUrl && formData.facture_num) {
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = `facture_${formData.facture_num.replace('/', '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [pdfBlobUrl, formData.facture_num]);

  if (loading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent" />
          <p className={`text-red-600 font-semibold text-xl`}>Chargement des données de l'intervention...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
        <div className={`max-w-xl w-full rounded-lg shadow-md p-8 border ${isDarkMode ? 'bg-gray-900 border-red-800' : 'bg-red-50 border-red-300'}`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Erreur</h1>
            <button
              onClick={() => navigate('/userhistory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              <ChevronLeft className="w-5 h-5" /> Retour
            </button>
          </div>
          <div className={`flex items-center gap-4 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
            <AlertCircle className="w-8 h-8" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-screen ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-950'} flex flex-col overflow-hidden`}>
      <Navbar
        title="Génération de Facture"
        showBackButton={true}
        onBackClick={() => navigate('/userhistory')}
        showDarkModeToggle={true}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <main className="flex-1 overflow-auto p-6">
        <div className={`max-w-5xl w-full mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-8 flex flex-col`}>
          {!preview ? (
            <form
              onSubmit={handleSubmitPreview}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg shadow-inner border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              noValidate
            >
              <h2 className={`md:col-span-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-950'} mb-4 flex items-center gap-2`}>
                <Info className="w-6 h-6 text-red-600" /> Informations de la Facture
              </h2>
              <div className="flex flex-col">
                <label htmlFor="facture_num" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <FileText /> Numéro de Facture <span className="text-red-500">*</span>
                </label>
                <input
                  id="facture_num"
                  name="facture_num"
                  type="text"
                  value={formData.facture_num}
                  onChange={handleInputChange}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                  aria-invalid={!!formErrors.facture_num}
                  aria-describedby={formErrors.facture_num ? `facture_num-error` : undefined}
                />
                {formErrors.facture_num && <p id={`facture_num-error`} className="mt-1 text-sm text-red-600 font-medium">{formErrors.facture_num}</p>}
              </div>

              <div className="flex flex-col">
                <label htmlFor="date" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <Calendar /> Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                  aria-invalid={!!formErrors.date}
                  aria-describedby={formErrors.date ? `date-error` : undefined}
                />
                {formErrors.date && <p id={`date-error`} className="mt-1 text-sm text-red-600 font-medium">{formErrors.date}</p>}
              </div>

              {/* Champ Destinataire - NEW DROPDOWN */}
              <div className="flex flex-col">
                <label htmlFor="billing_company" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <Building /> Destinataire <span className="text-red-500">*</span>
                </label>
                <select
                  id="billing_company"
                  name="billing_company"
                  value={formData.billing_company}
                  onChange={handleSocieteChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                >
                  <option value="">Sélectionnez une société...</option>
                  {societesAssistance.map(societe => (
                    <option key={societe.id} value={societe.nom}>{societe.nom}</option>
                  ))}
                </select>
                {formErrors.billing_company && <p id="billing_company-error" className="mt-1 text-sm text-red-600 font-medium">{formErrors.billing_company}</p>}
              </div>

              {/* Champs ICE et Adresse (read-only) */}
              <div className="flex flex-col">
                <label htmlFor="ice" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <List /> ICE
                </label>
                <input
                  id="ice"
                  name="ice"
                  type="text"
                  value={formData.ice}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="adresse" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <MapPin /> Adresse
                </label>
                <input
                  id="adresse"
                  name="adresse"
                  type="text"
                  value={formData.adresse}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                />
              </div>

              {/* Le reste des champs de formulaire... */}
              <div className="flex flex-col">
                <label htmlFor="reference" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <FileText /> Référence <span className="text-red-500">*</span>
                </label>
                <input
                  id="reference"
                  name="reference"
                  type="text"
                  value={formData.reference}
                  onChange={handleInputChange}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                  aria-invalid={!!formErrors.reference}
                  aria-describedby={formErrors.reference ? `reference-error` : undefined}
                />
                {formErrors.reference && <p id={`reference-error`} className="mt-1 text-sm text-red-600 font-medium">{formErrors.reference}</p>}
              </div>

              <div className="flex flex-col">
                <label htmlFor="point_attach" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <MapPin /> Point d'attache
                </label>
                <input
                  id="point_attach"
                  name="point_attach"
                  type="text"
                  value={formData.point_attach}
                  onChange={handleInputChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="lieu_intervention" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <MapPin /> Lieu d'intervention
                </label>
                <input
                  id="lieu_intervention"
                  name="lieu_intervention"
                  type="text"
                  value={formData.lieu_intervention}
                  onChange={handleInputChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="destination" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <MapPin /> Destination
                </label>
                <input
                  id="destination"
                  name="destination"
                  type="text"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                />
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="perimetre" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <MapPin /> Périmètre
                </label>
                <input
                  id="perimetre"
                  name="perimetre"
                  type="text"
                  value={formData.perimetre}
                  onChange={handleInputChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition`}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="montant_ttc" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <DollarSign /> Montant TTC (DH) <span className="text-red-500">*</span>
                </label>
                <input
                  id="montant_ttc"
                  name="montant_ttc"
                  type="text"
                  value={formData.montant_ttc}
                  onChange={handleInputChange}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="montant_ht" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <DollarSign /> Montant HT (DH)
                </label>
                <input
                  id="montant_ht"
                  name="montant_ht"
                  type="text"
                  value={formData.montant_ht}
                  onChange={handleInputChange}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                />
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="tva" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <DollarSign /> TVA (DH)
                </label>
                <input
                  id="tva"
                  name="tva"
                  type="text"
                  value={formData.tva}
                  onChange={handleInputChange}
                  readOnly
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-not-allowed`}
                />
              </div>

              <div className="md:col-span-2 flex flex-col">
                <label htmlFor="description" className={`mb-2 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center gap-1`}>
                  <List /> Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`rounded-lg border px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none ${
                    formErrors.description ? 'border-red-500 focus:ring-red-500' : `${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-500'}`
                  }`}
                  aria-invalid={!!formErrors.description}
                  aria-describedby={formErrors.description ? 'description-error' : undefined}
                />
                {formErrors.description && (
                  <p id="description-error" className="mt-1 text-sm text-red-600 font-medium">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 flex justify-center mt-6">
                <button
                  type="submit"
                  className="w-full max-w-md flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow-xl transition transform hover:scale-105"
                >
                  <Eye className="w-6 h-6" /> Aperçu de la Facture
                </button>
              </div>
            </form>
          ) : (
            <section className={`space-y-8 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-inner border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex-1 overflow-auto`}>
              <div className={`text-center pb-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-center mb-4">
                  <img
                    src="https://i.ibb.co/mVxjjNSj/logo.png"
                    alt="Tamanar Assistance Logo"
                    className="h-20 w-auto object-contain drop-shadow-md"
                    onError={(e) => { e.currentTarget.style.display = 'none'; console.error("Logo not found at /logo.png"); }}
                  />
                </div>
                <h2 className={`text-5xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight mb-2`}>FACTURE</h2>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>N° <span className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{formData.facture_num}</span></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-5 rounded-lg border shadow-sm ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}><Info className="w-5 h-5 text-red-600" /> Informations de facturation</h3>
                  <div className="space-y-2 text-base">
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Date :</strong> {formData.date}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Destinataire :</strong> {formData.billing_company}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>ICE :</strong> {formData.ice}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Adresse :</strong> {formData.adresse}</p>
                  </div>
                </div>
                <div className={`p-5 rounded-lg border shadow-sm ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}><MapPin className="w-5 h-5 text-red-600" /> Détails de l'intervention</h3>
                  <div className="space-y-2 text-base">
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Référence :</strong> {formData.reference}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Point d'attache :</strong> {formData.point_attach}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Lieu d'intervention :</strong> {formData.lieu_intervention}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Destination :</strong> {formData.destination}</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}><strong className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Périmètre :</strong> {formData.perimetre}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className={`w-full border-collapse border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden shadow-md`}>
                  <thead className={`bg-gradient-to-r ${isDarkMode ? 'from-gray-700 to-gray-600' : 'from-gray-200 to-gray-100'}`}>
                    <tr>
                      <th className={`text-left py-4 px-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-lg`}>DESCRIPTION</th>
                      <th className={`text-right py-4 px-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-lg`}>MONTANT DH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`${isDarkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} transition`}>
                      <td className={`py-4 px-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} whitespace-pre-line text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formData.description}</td>
                      <td className={`text-right py-4 px-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-800'} text-base`}>{formData.montant_ttc} DH</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={`p-6 rounded-lg border shadow-sm ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="text-right space-y-3">
                  <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><strong>TOTAL HT :</strong> <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{formData.montant_ht} DH</span></p>
                  <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><strong>T.V.A 20% :</strong> <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{formData.tva} DH</span></p>
                  <p className={`text-2xl font-extrabold pt-3 mt-4 border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                    <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>MONTANT À PAYER :</strong> <span className={`font-extrabold ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>{formData.montant_ttc} DH</span>
                  </p>
                </div>
              </div>
              <div className={`p-6 rounded-lg border-2 text-center shadow-lg ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
                <p className={`font-bold mb-3 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-900'}`}>Arrêté la présente facture à la somme de :</p>
                <p className={`text-3xl font-extrabold mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>## {convertToWords(parseFloat(formData.montant_ttc) || 0)} DIRHAMS TTC ##</p>
              </div>
              <div className={`text-center mt-12 pt-8 border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <h4 className={`font-bold mb-6 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CACHET & SIGNATURE</h4>
                <div className="flex justify-center">
                  <div className={`border-2 border-dashed rounded-lg p-16 w-96 h-48 flex items-end justify-center shadow-inner ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-400 bg-gray-100'}`}>
                    <p className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cachet et Signature ici</p>
                  </div>
                </div>
                <p className={`mt-6 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date: {formData.date}</p>
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-6 pt-8">
                <button
                  onClick={() => setPreview(false)}
                  className={`flex items-center justify-center gap-3 px-8 py-3 rounded-lg border-2 shadow-md font-semibold text-lg transition ${isDarkMode ? 'border-gray-700 text-white bg-gray-900 hover:bg-gray-800' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  <ChevronLeft className="w-6 h-6" /> Modifier les informations
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={pdfGenerationLoading}
                  className={`flex items-center justify-center gap-3 px-8 py-3 rounded-lg bg-red-600 text-white font-semibold text-lg transition shadow-lg transform hover:scale-105 hover:bg-red-700`}
                >
                  {pdfGenerationLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3" />
                  ) : (
                    <Download className="w-6 h-6" />
                  )}
                  {pdfGenerationLoading ? 'Génération du PDF...' : 'Générer et Télécharger PDF'}
                </button>
                {pdfBlobUrl && (
                  <button
                    onClick={downloadPdf}
                    className={`flex items-center justify-center gap-3 px-8 py-3 rounded-lg bg-red-600 text-white font-semibold text-lg transition shadow-lg transform hover:scale-105 hover:bg-red-700`}
                  >
                    <Download className="w-6 h-6" /> Télécharger l'Aperçu
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default GenerateFacturePage;