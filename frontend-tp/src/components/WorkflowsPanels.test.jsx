import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PatientHistoryPanel, NotificationsPanel } from './WorkflowsPanels.jsx';
vi.mock('../api.js',()=>({API_URL:'http://localhost:3000/api',rest:vi.fn(async path=>{
  if(path==='/notifications/my')return {notifications:[],unread_count:0};
  return [];
})}));
describe('Ampliación MiSalud+',()=>{
  beforeEach(()=>vi.clearAllMocks());
  it('muestra el historial vacío sin inventar consultas',async()=>{
    render(<PatientHistoryPanel token="token"/>);
    expect(screen.getByRole('heading',{name:'Historial de consultas'})).toBeInTheDocument();
    await waitFor(()=>expect(screen.getByText('Sin consultas registradas')).toBeInTheDocument());
  });
  it('muestra las notificaciones vacías cuando no hay mensajes',async()=>{
    render(<NotificationsPanel token="token"/>);
    await waitFor(()=>expect(screen.getByText('Sin notificaciones')).toBeInTheDocument());
  });
});
