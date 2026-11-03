import { Activity } from 'lucide-react';

export default function Brand({ subtitle, large = false, onClick }) {
  const content = <>
    <span className="brand-symbol" aria-hidden="true"><Activity size={large ? 28 : 22} strokeWidth={2.7} /></span>
    <span className="brand-text"><span className="brand-name">Mi<span>Salud</span><b>+</b></span>{subtitle && <small>{subtitle}</small>}</span>
  </>;
  return onClick
    ? <button type="button" className={`brand-lockup ${large ? 'brand-large' : ''}`} onClick={onClick} aria-label="Volver al inicio">{content}</button>
    : <div className={`brand-lockup ${large ? 'brand-large' : ''}`}>{content}</div>;
}
