import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { FieldChangeEvent, SelectOption } from '../types';

interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (event: FieldChangeEvent) => void;
  isDarkMode: boolean;
  type?: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  readOnly?: boolean;
  step?: string;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  isDarkMode,
  type = 'text',
  icon,
  options,
  readOnly = false,
  step,
  hasError,
  errorMessage,
  className,
}) => (
  <div className="space-y-2">
    <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
      {icon} {label}
    </label>

    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 rounded-lg text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-500' : ''} ${className || ''}`}
      >
        <option value="">Selectionnez...</option>
        {options.map((option) => (
          <option key={String(option.value)} value={option.value} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        step={step}
        className={
          `w-full px-4 py-3 rounded-lg text-sm ${
            isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
          } border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            readOnly ? 'cursor-not-allowed' : ''
          } ${hasError ? 'border-red-500' : ''} ${className || ''}`
        }
        placeholder={`Entrez ${label.toLowerCase()}`}
      />
    )}

    {hasError && errorMessage && (
      <p className="text-red-500 text-xs flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {errorMessage}
      </p>
    )}
  </div>
);

export default React.memo(FormField);
