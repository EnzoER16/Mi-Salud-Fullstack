import { useState } from 'react';
import { ArrowRight, HeartPulse, LockKeyhole, ShieldCheck, Stethoscope, CalendarDays, ClipboardList, Eye, EyeOff } from 'lucide-react';
import Brand from './Brand.jsx';

export default function LoginForm({ onLogin, onRegister, busy = false }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Paciente');
  const [showPassword, setShowPassword] = useState(false);
  function submit(event) {
    event.preventDefault();
    if (register) onRegister({ username, email, password, role });
    else onLogin({ email, password });
  }
  return <div className="auth-page">
    <div className="gradient-strip"/>
    <header className="auth-topbar"><Brand subtitle="Tu bienestar, nuestra prioridad"/><span className="topbar-tag"><ShieldCheck size={15}/> Acceso seguro</span></header>
    <main className="auth-main">
      <section className="auth-message" aria-label="Presentación de MiSalud+">
        <span className="overline">TU SALUD EN UN SOLO LUGAR</span>
        <h1>Tu información médica,<br/><span>siempre con vos.</span></h1>
        <p>Organizá tu salud de forma simple. Accedé a tu ficha médica, registrá tus vacunas y gestioná tus turnos en un espacio personal.</p>
        <div className="auth-features">
          <div><span className="auth-feature-icon"><ClipboardList size={22}/></span><span><strong>Historia clínica</strong><small>Tu información, organizada</small></span></div>
          <div><span className="auth-feature-icon"><CalendarDays size={22}/></span><span><strong>Turnos médicos</strong><small>Tu agenda de salud</small></span></div>
          <div><span className="auth-feature-icon"><Stethoscope size={22}/></span><span><strong>Dos roles, una plataforma</strong><small>Pacientes y profesionales</small></span></div>
        </div>
        <div className="auth-decoration" aria-hidden="true"><HeartPulse size={155} strokeWidth={1}/></div>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-top"><span className="auth-card-icon"><LockKeyhole size={21}/></span><span className="form-kicker">MI CUENTA</span></div>
        <h2>{register ? 'Crear una cuenta' : 'Ingresá a tu cuenta'}</h2>
        <p className="auth-subtitle">{register ? 'Registrate y comenzá a organizar tu salud.' : 'Bienvenido/a nuevamente a MiSalud+.'}</p>
        {register && <>
          <label htmlFor="username">Nombre de usuario</label><input id="username" required minLength={2} maxLength={50} autoComplete="username" placeholder="Tu nombre" value={username} onChange={e => setUsername(e.target.value)}/>
          <label htmlFor="role">Tipo de usuario</label><select id="role" value={role} onChange={e => setRole(e.target.value)}><option>Paciente</option><option>Doctor</option></select>
        </>}
        <label htmlFor="email">Correo electrónico</label><input id="email" type="email" required autoComplete="email" placeholder="nombre@correo.com" value={email} onChange={e => setEmail(e.target.value)}/>
        <label htmlFor="password">Contraseña</label>
        <div className="password-wrapper"><input id="password" type={showPassword ? 'text' : 'password'} required minLength={register ? 6 : 1} autoComplete={register ? 'new-password' : 'current-password'} placeholder="Ingresá tu contraseña" value={password} onChange={e => setPassword(e.target.value)}/><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
        <button type="submit" className="primary-btn auth-submit" disabled={busy}>{busy ? 'Procesando...' : register ? 'Crear cuenta' : 'Ingresar'}<ArrowRight size={17}/></button>
        <div className="auth-divider"><span>¿{register ? 'Ya tenés una cuenta' : 'Todavía no tenés cuenta'}?</span></div>
        <button type="button" className="auth-alternate" onClick={() => setRegister(v => !v)}>{register ? 'Iniciar sesión' : 'Registrate acá'}</button>
        <p className="auth-security"><ShieldCheck size={15}/> Información protegida mediante autenticación JWT</p>
      </form>
    </main>
    <footer className="auth-footer">MiSalud+ · TP Integrador de Programación III · 2026</footer>
  </div>;
}
