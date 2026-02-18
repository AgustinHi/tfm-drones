import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('HeroSection Component', () => {
  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders hero section title', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText('DronHangar')).toBeInTheDocument();
  });

  it('renders hero section description', () => {
    renderWithRouter(<HeroSection />);
    // Buscar parte de la descripción en español
    expect(
      screen.getByText(/Centraliza tus drones/)
    ).toBeInTheDocument();
  });

  it('renders login/register button', () => {
    renderWithRouter(<HeroSection />);
    expect(
      screen.getByText(/Iniciar sesión/)
    ).toBeInTheDocument();
  });

  it('renders unlock hint text', () => {
    renderWithRouter(<HeroSection />);
    expect(
      screen.getByText(/Inicia sesión para desbloquear/)
    ).toBeInTheDocument();
  });

  it('renders feature highlight box', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Fácil · Intuitivo · Seguro/)).toBeInTheDocument();
  });

  it('button is clickable', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HeroSection />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    await user.click(buttons[0]);
    // Test que el click se ejecuta sin error
  });

  it('renders multiple text elements correctly', () => {
    renderWithRouter(<HeroSection />);
    // Verificar que contiene textos clave
    expect(screen.getByText(/Acceso protegido/)).toBeInTheDocument();
    expect(screen.getByText(/En segundos/)).toBeInTheDocument();
  });
});
