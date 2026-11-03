import { AlertCircle, CheckCircle2, Plus, RefreshCw } from 'lucide-react';

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return <div className="page-header"><div><span className="overline">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}
export function Message({ type = 'info', children }) {
  if (!children) return null;
  return <div role={type === 'error' ? 'alert' : 'status'} className={`message message-${type}`}>{type === 'error' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}<span>{children}</span></div>;
}
export function EmptyState({ title, text, onClick, action = 'Agregar' }) {
  return <div className="empty-state"><span className="empty-art"><Plus size={27}/></span><h3>{title}</h3><p>{text}</p>{onClick && <button className="outline-btn" type="button" onClick={onClick}><Plus size={16}/>{action}</button>}</div>;
}
export function Loading({ children = 'Cargando información...' }) { return <div className="loading-inline"><RefreshCw size={18} className="spin"/>{children}</div>; }
export function Field({ label, children, className = '' }) { return <label className={`field ${className}`}><span>{label}</span>{children}</label>; }
export const shortDate = (value) => {
  if (!value) return 'Sin fecha';
  const [y, m, d] = value.slice(0, 10).split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : value;
};
export const dateTime = (value) => value ? new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';
