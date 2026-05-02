import React from 'react';
import { Building, Calendar, Car, Clipboard, DollarSign, Truck, User } from 'lucide-react';
import FormField from '../components/FormField';
import type { FieldChangeEvent, FormErrors, FormState, SelectOption } from '../types';

interface SuiviCarburantFormSectionProps {
  values: FormState['suiviCarburant'];
  serviceOptions: SelectOption[];
  errors: FormErrors;
  isDarkMode: boolean;
  onChange: (event: FieldChangeEvent) => void;
}

const SuiviCarburantFormSection: React.FC<SuiviCarburantFormSectionProps> = ({
  values,
  serviceOptions,
  errors,
  isDarkMode,
  onChange,
}) => (
  <div className="space-y-8 w-full h-full flex flex-col">
    <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
      <Truck className="h-7 w-7 text-blue-500" /> Informations suivi carburant
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full flex-grow">
      <FormField
        label="Date"
        name="date"
        type="date"
        icon={<Calendar className="h-6 w-6 text-blue-500" />}
        value={values.date}
        hasError={!!errors.date}
        errorMessage={errors.date}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Vehicule"
        name="vehicule"
        icon={<Car className="h-6 w-6 text-blue-500" />}
        value={values.vehicule}
        hasError={!!errors.vehicule}
        errorMessage={errors.vehicule}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Service"
        name="service"
        icon={<Clipboard className="h-6 w-6 text-blue-500" />}
        options={serviceOptions}
        value={values.service}
        hasError={!!errors.service}
        errorMessage={errors.service}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Pompiste"
        name="pompiste"
        icon={<User className="h-6 w-6 text-blue-500" />}
        value={values.pompiste}
        hasError={!!errors.pompiste}
        errorMessage={errors.pompiste}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <FormField
        label="Prix (DH)"
        name="prix"
        icon={<DollarSign className="h-6 w-6 text-blue-500" />}
        value={values.prix}
        hasError={!!errors.prix}
        errorMessage={errors.prix}
        onChange={onChange}
        isDarkMode={isDarkMode}
      />

      <div className="col-span-full">
        <FormField
          label="Station Smito"
          name="smitoStation"
          icon={<Building className="h-6 w-6 text-blue-500" />}
          value={values.smitoStation}
          hasError={!!errors.smitoStation}
          errorMessage={errors.smitoStation}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  </div>
);

export default React.memo(SuiviCarburantFormSection);
