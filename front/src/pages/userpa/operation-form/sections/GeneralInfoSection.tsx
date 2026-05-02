import React from 'react';
import { Building, Calendar, FileText } from 'lucide-react';
import FormField from '../components/FormField';
import type { FieldChangeEvent, FormErrors, FormState, SelectOption } from '../types';

interface GeneralInfoSectionProps {
  values: FormState['general'];
  errors: FormErrors;
  societeOptions: SelectOption[];
  isDarkMode: boolean;
  onChange: (event: FieldChangeEvent) => void;
}

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  values,
  errors,
  societeOptions,
  isDarkMode,
  onChange,
}) => (
  <div className="space-y-6">
    <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
      <FileText className="h-6 w-6 text-blue-500" /> Informations generales
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormField
        label="Date d'intervention"
        name="date_intervention"
        type="date"
        icon={<Calendar className="h-5 w-5 text-blue-500" />}
        value={values.date_intervention}
        hasError={!!errors.date_intervention}
        errorMessage={errors.date_intervention}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Societe d'assistance"
        name="societe_assistance"
        icon={<Building className="h-5 w-5 text-blue-500" />}
        options={societeOptions}
        value={values.societe_assistance}
        hasError={!!errors.societe_assistance}
        errorMessage={errors.societe_assistance}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Reference"
        name="ref_dossier"
        icon={<FileText className="h-5 w-5 text-blue-500" />}
        value={values.ref_dossier}
        hasError={!!errors.ref_dossier}
        errorMessage={errors.ref_dossier}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />
    </div>
  </div>
);

export default React.memo(GeneralInfoSection);
