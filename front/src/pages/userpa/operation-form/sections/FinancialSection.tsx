import React from 'react';
import { Calculator, DollarSign, Percent } from 'lucide-react';
import FormField from '../components/FormField';
import type { FieldChangeEvent, FormErrors, FormState } from '../types';

interface FinancialSectionProps {
  values: FormState['financial'];
  errors: FormErrors;
  isDarkMode: boolean;
  onChange: (event: FieldChangeEvent) => void;
}

const FinancialSection: React.FC<FinancialSectionProps> = ({ values, errors, isDarkMode, onChange }) => (
  <div className="space-y-6">
    <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
      <DollarSign className="h-6 w-6 text-orange-500" /> Informations financieres
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormField
        label="Cout TTC (DH)"
        name="cout_prestation_ttc"
        icon={<DollarSign className="h-5 w-5 text-orange-500" />}
        value={values.cout_prestation_ttc}
        hasError={!!errors.cout_prestation_ttc}
        errorMessage={errors.cout_prestation_ttc}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="TVA (%)"
        name="tva"
        icon={<Percent className="h-5 w-5 text-orange-500" />}
        value={values.tva}
        hasError={!!errors.tva}
        errorMessage={errors.tva}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Montant HT (DH)"
        name="montant_ht"
        icon={<Calculator className="h-5 w-5 text-orange-500" />}
        readOnly
        value={values.montant_ht}
        hasError={!!errors.montant_ht}
        errorMessage={errors.montant_ht}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />
    </div>
  </div>
);

export default React.memo(FinancialSection);