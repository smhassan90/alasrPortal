import React from 'react';
import styles from './Input.module.css';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  name?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  icon,
  helperText,
  fullWidth = false,
  className = '',
  name,
}) => {
  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    styles.input,
    error ? styles.error : '',
    icon ? styles.withIcon : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          name={name}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

