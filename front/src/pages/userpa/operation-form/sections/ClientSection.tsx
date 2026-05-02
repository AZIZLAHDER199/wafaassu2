import React from 'react';
import { Car, User } from 'lucide-react';
import FormField from '../components/FormField';
import type { FieldChangeEvent, FormErrors, FormState } from '../types';

interface ClientSectionProps {
  values: FormState['client'];
  errors: FormErrors;
  isDarkMode: boolean;
  onChange: (event: FieldChangeEvent) => void;
}

const ClientSection: React.FC<ClientSectionProps> = ({ values, errors, isDarkMode, onChange }) => (
  <div className="space-y-6">
    <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
      <User className="h-6 w-6 text-green-500" /> Client et vehicule
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormField
        label="Assure"
        name="assure"
        icon={<User className="h-5 w-5 text-green-500" />}
        value={values.assure}
        hasError={!!errors.assure}
        errorMessage={errors.assure}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Immatriculation"
        name="immatriculation"
        icon={<Car className="h-5 w-5 text-green-500" />}
        value={values.immatriculation}
        hasError={!!errors.immatriculation}
        errorMessage={errors.immatriculation}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Marque"
        name="marque"
        icon={<Car className="h-5 w-5 text-green-500" />}
        value={values.marque}
        hasError={!!errors.marque}
        errorMessage={errors.marque}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />
    </div>
  </div>
);

export default React.memo(ClientSection);
