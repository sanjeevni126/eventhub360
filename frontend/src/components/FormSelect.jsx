import React from 'react';

const FormSelect = ({ label, value, onChange, options = [], required = false, className = '', defaultOption = 'Select an option' }) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label} {required && '*'}</label>}
      <select value={value} onChange={onChange} required={required}>
        <option value="">{defaultOption}</option>
        {options.map((opt, index) => (
          <option key={index} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;
