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

const inputStyle = (hasError?: boolean, readOnly?: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '9px',
  border: `1.5px solid ${hasError ? '#fca5a5' : '#e2e8f0'}`,
  fontSize: '.86rem',
  color: '#0f172a',
  background: readOnly ? '#f8fafc' : '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .15s',
  cursor: readOnly ? 'not-allowed' : 'text',
  fontFamily: 'inherit',
});

const FormField: React.FC<FormFieldProps> = ({
  label, name, value, onChange, isDarkMode,
  type = 'text', icon, options, readOnly = false,
  step, hasError, errorMessage, className,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>
      {icon && <span style={{ opacity: .7, display: 'flex' }}>{icon}</span>}
      {label}
    </label>

    {options ? (
      <select name={name} value={value} onChange={onChange}
        style={{ ...inputStyle(hasError), cursor: 'pointer' }}
        onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px #7c3aed18'; }}
        onBlur={e => { e.target.style.borderColor = hasError ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
      >
        <option value="">Sélectionnez…</option>
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>{o.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type} name={name} value={value} onChange={onChange}
        readOnly={readOnly} step={step}
        placeholder={`${label}…`}
        style={inputStyle(hasError, readOnly)}
        onFocus={e => { if (!readOnly) { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px #7c3aed18'; } }}
        onBlur={e => { e.target.style.borderColor = hasError ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
      />
    )}

    {hasError && errorMessage && (
      <p style={{ margin: 0, fontSize: '.72rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
        <AlertCircle size={12} /> {errorMessage}
      </p>
    )}
  </div>
);

export default React.memo(FormField);
