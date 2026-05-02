import React from 'react';
import { Activity, MapPin, Target, Users } from 'lucide-react';
import FormField from '../components/FormField';
import type { FieldChangeEvent, FormErrors, FormState, SelectOption, SocieteAssistance } from '../types';

interface LocationSectionProps {
  values: FormState['location'];
  selectedSocieteId: number | '';
  societesAssistance: SocieteAssistance[];
  statusOptions: SelectOption[];
  evenementOptions: SelectOption[];
  errors: FormErrors;
  isDarkMode: boolean;
  onChange: (event: FieldChangeEvent) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  values,
  selectedSocieteId,
  societesAssistance,
  statusOptions,
  evenementOptions,
  errors,
  isDarkMode,
  onChange,
}) => {
  const selectedSociety = societesAssistance.find((societe) => societe.id === selectedSocieteId);
  const isImaSociety = selectedSociety?.nom === 'IMA';

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
        <MapPin className="h-6 w-6 text-purple-500" /> Localisation et intervention
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          label="Point d'attache"
          name="point_attach"
          icon={<MapPin className="h-5 w-5 text-purple-500" />}
          value={values.point_attach}
          hasError={!!errors.point_attach}
          errorMessage={errors.point_attach}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />

        <FormField
          label="Lieu d'intervention"
          name="lieu_intervention"
          icon={<MapPin className="h-5 w-5 text-purple-500" />}
          value={values.lieu_intervention}
          hasError={!!errors.lieu_intervention}
          errorMessage={errors.lieu_intervention}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />

        <FormField
          label="Destination"
          name="destination"
          icon={<Target className="h-5 w-5 text-purple-500" />}
          value={values.destination}
          hasError={!!errors.destination}
          errorMessage={errors.destination}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />

        <FormField
          label="Statut"
          name="status"
          icon={<Activity className="h-5 w-5 text-purple-500" />}
          options={statusOptions}
          value={values.status}
          hasError={!!errors.status}
          errorMessage={errors.status}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />

        <FormField
          label="Evenement"
          name="evenement"
          icon={<Activity className="h-5 w-5 text-purple-500" />}
          options={evenementOptions}
          value={values.evenement}
          hasError={!!errors.evenement}
          errorMessage={errors.evenement}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />

        {isImaSociety && (
          <FormField
            label="Groupe"
            name="group_id"
            icon={<Users className="h-5 w-5 text-purple-500" />}
            value={values.group_id || ''}
            hasError={!!errors.group_id}
            errorMessage={errors.group_id}
            onChange={onChange}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(LocationSection);
