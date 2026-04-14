import './Button.css';

export default function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled, className, icon: Icon }) {
  const classes = `btn btn-${variant} btn-${size} ${className || ''}`;
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}
