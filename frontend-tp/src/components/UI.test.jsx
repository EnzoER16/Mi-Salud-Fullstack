import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, Message, PageHeader, shortDate } from './UI.jsx';

describe('MiSalud+ - UI visual', () => {
  it('muestra el titulo y subtitulo de la pagina', () => {
    render(<PageHeader eyebrow="MI SALUD" title="Mi ficha médica" subtitle="Información clínica" />);
    expect(screen.getByRole('heading', { name: 'Mi ficha médica' })).toBeInTheDocument();
    expect(screen.getByText('Información clínica')).toBeInTheDocument();
  });

  it('muestra estado vacio y ejecuta la accion', () => {
    const action = vi.fn();
    render(<EmptyState title="Sin vacunas" text="Agregá una vacuna" onClick={action} action="Agregar vacuna" />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar vacuna/i }));
    expect(action).toHaveBeenCalledOnce();
  });

  it('presenta mensajes de error accesibles y fechas locales legibles', () => {
    render(<Message type="error">Error al guardar</Message>);
    expect(screen.getByRole('alert')).toHaveTextContent('Error al guardar');
    expect(shortDate('2026-11-03')).toBe('03/11/2026');
  });
});
