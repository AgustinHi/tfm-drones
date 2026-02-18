import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesSection } from '../components/home/FeaturesSection';

describe('FeaturesSection Component', () => {
  it('renders section title', () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/Así se siente por dentro/)).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(/interfaz pensada para que encuentres/)
    ).toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    render(<FeaturesSection />);
    
    // Verificar las 4 features principales
    expect(screen.getByText(/Fichas claras/)).toBeInTheDocument();
    expect(screen.getByText(/Dumps por dron/)).toBeInTheDocument();
    expect(screen.getByText(/Recursos/)).toBeInTheDocument();
    expect(screen.getByText(/Público.*Comunidad/)).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection />);
    
    expect(screen.getByText(/Componentes, radio, vídeo/)).toBeInTheDocument();
    expect(screen.getByText(/Sube, revisa y guarda versiones/)).toBeInTheDocument();
    expect(screen.getByText(/Normativa, zonas y guías/)).toBeInTheDocument();
    expect(screen.getByText(/Aprende de configuraciones/)).toBeInTheDocument();
  });

  it('renders preview image', () => {
    render(<FeaturesSection />);
    const img = screen.getByAltText(/Ejemplo: tarjeta de dron/);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/home-preview.png');
  });

  it('image has correct attributes', () => {
    render(<FeaturesSection />);
    const img = screen.getByAltText(/Ejemplo: tarjeta de dron/);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveClass('h-full', 'w-full', 'object-contain');
  });

  it('renders correct number of feature cards', () => {
    const { container } = render(<FeaturesSection />);
    // Contar cards (excluyendo la imagen)
    const cards = container.querySelectorAll('.rounded-2xl');
    // 4 features + 1 image container - 1 = 4 cards de texto
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
