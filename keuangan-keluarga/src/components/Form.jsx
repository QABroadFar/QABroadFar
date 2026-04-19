import './Form.css';

export function FormInput({ label, type = 'text', value, onChange, placeholder, required, className, multiline, rows = 3, ...props }) {
  const InputComponent = multiline ? 'textarea' : 'input';
  
  return (
    <div className={`form-group ${className || ''}`}>
      {label && <label className="form-label">{label}{required && <span className="required">*</span>}</label>}
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className="form-control"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="form-control"
          {...props}
        />
      )}
    </div>
  );
}

export function FormSelect({ label, value, onChange, options, placeholder, required, className, children }) {
  return (
    <div className={`form-group ${className || ''}`}>
      {label && <label className="form-label">{label}{required && <span className="required">*</span>}</label>}
      <select value={value} onChange={onChange} required={required} className="form-control">
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        {children}
      </select>
    </div>
  );
}

export function FormTextarea({ label, value, onChange, placeholder, rows = 3, className }) {
  return (
    <div className={`form-group ${className || ''}`}>
      {label && <label className="form-label">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="form-control"
      />
    </div>
  );
}

export function FormRow({ children }) {
  return <div className="form-row">{children}</div>;
}
