import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginForm from './LoginForm.jsx';
import AuthGate from './AuthGate.jsx';

describe('Interfaz React - pruebas de componentes', () => {
  it('envia los datos del formulario al iniciar sesion', () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} onRegister={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'demo@gmail.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Secreto123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(onLogin).toHaveBeenCalledWith({ email: 'demo@gmail.com', password: 'Secreto123' });
  });

  it('protege el contenido cuando no hay usuario', () => {
    render(<AuthGate user={null}><h2>Ficha clínica</h2></AuthGate>);
    expect(screen.queryByText('Ficha clínica')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Iniciá sesión');
  });
});
