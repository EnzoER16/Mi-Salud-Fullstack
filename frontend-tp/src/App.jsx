import { useCallback, useEffect, useRef, useState } from 'react';
import './workflows.css';
import { Activity, Bell, CalendarDays, ChevronDown, CircleHelp, ClipboardList, HeartPulse, Home, LogOut, Menu, ShieldCheck, Syringe, UserRound, Users, X, Stethoscope, ContactRound } from 'lucide-react';
import { rest } from './api.js';
import LoginForm from './components/LoginForm.jsx';
import Brand from './components/Brand.jsx';
import { Message, PageHeader } from './components/UI.jsx';
import { PatientOverview, DoctorOverview, ProfilePanel, PersonalDetailsPanel, MedicalPanel, VaccinesPanel, AppointmentsPanel, EmergencyContactsPanel, UnderConstruction } from './components/PatientPanels.jsx';
import { PatientTreatmentsPanel, PatientHistoryPanel, DoctorPatientsPanel, CareGroupPanel, NotificationsPanel, DoctorAccessPanel, AppointmentDocumentsPanel } from './components/WorkflowsPanels.jsx';

const patientNav = [
  { id:'inicio', title:'Inicio', icon:Home },
  { id:'turnos', title:'Mis turnos', icon:CalendarDays },
  { id:'tratamientos', title:'Tratamientos', icon:Activity },
  { id:'cuidado', title:'Mi grupo de cuidado', icon:Users },
];
const patientMenu = [
  { id:'perfil', title:'Datos del perfil', icon:UserRound },
  { id:'personales', title:'Datos personales', icon:ContactRound },
  { id:'ficha', title:'Mi ficha médica', icon:ClipboardList },
  { id:'vacunas', title:'Mis vacunas', icon:Syringe },
  { id:'contactos', title:'Contactos de emergencia', icon:HeartPulse },
  { id:'historial', title:'Historial de consultas', icon:ClipboardList },
  { id:'documentos', title:'Archivos y notas', icon:CalendarDays },
  { id:'accesos', title:'Accesos médicos', icon:ShieldCheck },
  { id:'avisos', title:'Notificaciones', icon:Bell },
];
const doctorMenu = [
  { id:'perfil', title:'Datos profesionales', icon:Stethoscope },
  { id:'personales', title:'Datos personales', icon:UserRound },
  { id:'pacientes', title:'Pacientes y consultas', icon:ClipboardList },
  { id:'avisos', title:'Notificaciones', icon:Bell },
];
const titles = {inicio:'Inicio',turnos:'Mis turnos',cuidado:'Mi grupo de cuidado',perfil:'Datos del perfil',personales:'Datos personales',ficha:'Mi ficha médica',vacunas:'Mis vacunas',contactos:'Contactos de emergencia',tratamientos:'Tratamientos',historial:'Historial de consultas',documentos:'Archivos y notas',accesos:'Accesos médicos',avisos:'Notificaciones',pacientes:'Pacientes y consultas'};

export default function App() {
  const [token,setToken] = useState(()=>localStorage.getItem('tp_token')||'');
  const [user,setUser] = useState(null);
  const [profile,setProfile] = useState(null);
  const [ready,setReady] = useState(false);
  const [tab,setTab] = useState('inicio');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);
  const menuRef=useRef(null);
  const fetchProfile=useCallback(async(currentUser,currentToken)=>{
    try {const p=await rest(currentUser.role==='Paciente'?'/patient/profile':'/doctor/profile','GET',undefined,currentToken);setProfile(p);}
    catch(e){if(e.status!==404)setError(e.message);setProfile(null);}
  },[]);
  useEffect(()=>{
    if(!token){setUser(null);setProfile(null);setReady(true);return;}
    let active=true;
    rest('/auth/profile','GET',undefined,token).then(async currentUser=>{
      if(!active)return;
      setUser(currentUser);
      await fetchProfile(currentUser,token);
    }).catch(()=>{if(active){localStorage.removeItem('tp_token');setToken('');setUser(null);setProfile(null);}})
      .finally(()=>{if(active)setReady(true);});
    return()=>{active=false};
  },[token,fetchProfile]);
  useEffect(()=>{
    if(!menuOpen)return;
    function clickOutside(e){if(menuRef.current&&!menuRef.current.contains(e.target))setMenuOpen(false);}
    document.addEventListener('pointerdown',clickOutside);
    return()=>document.removeEventListener('pointerdown',clickOutside);
  },[menuOpen]);
  function logout(){localStorage.removeItem('tp_token');setToken('');setUser(null);setProfile(null);setTab('inicio');setMenuOpen(false);setError('');}
  async function authenticate(data,create=false){setBusy(true);setError('');try{if(create)await rest('/auth/register','POST',data);const result=await rest('/auth/login','POST',{email:data.email,password:data.password});localStorage.setItem('tp_token',result.token);setReady(false);setToken(result.token);setUser(result.user);setTab('inicio');}catch(e){setError(e.message)}finally{setBusy(false)}}
  function navigate(next){setTab(next);setMenuOpen(false);setMobileOpen(false);setError('');window.scrollTo?.({top:0,behavior:'smooth'});}
  if(!ready)return <div className="app-loading"><span className="loading-brand"><Activity size={30}/></span><h1>MiSalud+</h1><p>Preparando tu espacio...</p></div>;
  if(!user)return <><LoginForm onLogin={v=>authenticate(v)} onRegister={v=>authenticate(v,true)} busy={busy}/>{error&&<div className="floating-error" role="alert">{error}</div>}</>;
  const isDoctor=user.role==='Doctor';
  const topItems=isDoctor?[{id:'inicio',title:'Inicio',icon:Home},{id:'pacientes',title:'Mis pacientes',icon:ClipboardList}]:patientNav;
  const menuItems=isDoctor?doctorMenu:patientMenu;
  const initials=user.username.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
  return <div className="app-page"><div className="gradient-strip"/>
    <header className="main-header"><div className="header-container"><Brand onClick={()=>navigate('inicio')} subtitle={isDoctor?'Portal médico':'Portal del paciente'}/>
      <nav className={`main-nav ${mobileOpen?'mobile-open':''}`} aria-label="Navegación principal">{topItems.map(({id,title,icon:Icon,soon})=><button key={id} type="button" className={`nav-link ${tab===id?'current':''}`} onClick={()=>navigate(id)} aria-current={tab===id?'page':undefined}><Icon size={18}/><span>{title}</span>{soon&&<i title="En migración">·</i>}</button>)}</nav>
      <div className="header-actions"><span className="secure-label"><ShieldCheck size={16}/> Sesión segura</span><button type="button" className="icon-btn header-help" title="Sección de ayuda" onClick={()=>navigate('ayuda')}><CircleHelp size={21}/></button>
        <div className="profile-menu-wrap" ref={menuRef}><button className="user-trigger" onClick={()=>setMenuOpen(o=>!o)} aria-expanded={menuOpen} aria-haspopup="menu"><span className="top-avatar">{initials}</span><span className="user-trigger-text"><strong>{user.username}</strong><small>{isDoctor?'Médico/a':'Paciente'}</small></span><ChevronDown size={17}/></button>
        {menuOpen&&<div className="profile-dropdown" role="menu"><div className="dropdown-user"><strong>{user.username}</strong><small>{user.email}</small></div>{menuItems.map(({id,title,icon:Icon})=><button key={id} role="menuitem" onClick={()=>navigate(id)}><Icon size={18}/>{title}</button>)}<div className="dropdown-divider"/><button role="menuitem" className="logout-item" onClick={logout}><LogOut size={18}/> Cerrar sesión</button></div>}</div>
        <button className="icon-btn mobile-menu-btn" aria-label={mobileOpen?'Cerrar menú':'Abrir menú'} onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button>
      </div></div></header>
    <main className="app-content"><div className="content-inner">
      {tab!=='inicio'&&<nav className="breadcrumbs" aria-label="Ruta de navegación"><button onClick={()=>navigate('inicio')}>Inicio</button><span>/</span><strong>{titles[tab]||'Ayuda'}</strong></nav>}
      {error&&<Message type="error">{error}</Message>}
      {!profile?<><PageHeader eyebrow="PRIMEROS PASOS" title="Completá tu perfil" subtitle="Necesitamos unos datos básicos antes de habilitar las funciones de MiSalud+."/><ProfilePanel key={user.id_user} user={user} profile={null} token={token} onSaved={()=>fetchProfile(user,token)}/></>
      : tab==='inicio'? (isDoctor?<DoctorOverview user={user} profile={profile} navigate={navigate}/>:<PatientOverview user={user} profile={profile} token={token} navigate={navigate}/>)
      : tab==='perfil'?<ProfilePanel user={user} profile={profile} token={token} onSaved={()=>fetchProfile(user,token)}/>
      : tab==='personales'?<PersonalDetailsPanel token={token} role={user.role}/>
      : !isDoctor&&tab==='ficha'?<MedicalPanel token={token}/>
      : !isDoctor&&tab==='vacunas'?<VaccinesPanel token={token}/>
      : !isDoctor&&tab==='turnos'?<AppointmentsPanel token={token}/>
      : !isDoctor&&tab==='contactos'?<EmergencyContactsPanel token={token}/>
      : !isDoctor&&tab==='tratamientos'?<PatientTreatmentsPanel token={token}/>
      : !isDoctor&&tab==='historial'?<PatientHistoryPanel token={token}/>
      : !isDoctor&&tab==='cuidado'?<CareGroupPanel token={token}/>
      : !isDoctor&&tab==='documentos'?<AppointmentDocumentsPanel token={token}/>
      : !isDoctor&&tab==='accesos'?<DoctorAccessPanel token={token}/>
      : isDoctor&&tab==='pacientes'?<DoctorPatientsPanel token={token}/>
      : tab==='avisos'?<NotificationsPanel token={token}/>
      : tab==='ayuda'?<><PageHeader eyebrow="AYUDA" title="Acerca de MiSalud+" subtitle="TP Integrador de Programación III"/><section className="card form-card"><h2>Esta versión del proyecto</h2><p className="muted">Aplicación React conectada al API Gateway de NestJS. Vacunas y turnos utilizan GraphQL; consultas, tratamientos, grupos de cuidado, perfiles y documentos utilizan REST. El acceso clínico profesional requiere autorización del paciente.</p><p className="muted">La plataforma no reemplaza una historia clínica oficial ni brinda asesoramiento médico.</p><button className="outline-btn" onClick={()=>navigate('inicio')}>Volver al inicio</button></section></>
      : <UnderConstruction type={tab}/>
      }
    </div></main><footer className="app-footer"><span>© 2026 MiSalud+ · Trabajo Práctico Integrador</span><span>Desarrollado con React · NestJS · MongoDB</span></footer>
  </div>;
}
