

export default function Brand({ subtitle, large = false, onClick }) {
  const content = <>
    <span className="brand-symbol brand-with-image" aria-hidden="true"><img className="brand-symbol-image" src="/logo-icon.png" alt="" /></span>
    <span className="brand-text"><span className="brand-name">Mi<span>Salud</span><b>+</b></span>{subtitle && <small>{subtitle}</small>}</span>
  </>;
  return onClick
    ? <button type="button" className={`brand-lockup ${large ? 'brand-large' : ''}`} onClick={onClick} aria-label="Volver al inicio">{content}</button>
    : <div className={`brand-lockup ${large ? 'brand-large' : ''}`}>{content}</div>;
}
