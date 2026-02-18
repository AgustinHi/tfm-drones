import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResourcesSection } from '../components/home/ResourcesSection';

describe('ResourcesSection Component', () => {
  it('renders section title', () => {
    render(<ResourcesSection />);
    expect(screen.getByText(/Normativa, zonas y vídeos/)).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<ResourcesSection />);
    expect(
      screen.getByText(/Acceso rápido a fuentes oficiales/)
    ).toBeInTheDocument();
  });

  it('renders all resource categories', () => {
    render(<ResourcesSection />);
    
    expect(screen.getByText(/Normativa/)).toBeInTheDocument();
    expect(screen.getByText(/Zonas/)).toBeInTheDocument();
    expect(screen.getByText(/Vídeo/)).toBeInTheDocument();
  });

  it('renders regulations items', () => {
    render(<ResourcesSection />);
    
    // Buscar items de normativa
    const regulationTexts = screen.getAllByText(/Guías oficiales/);
    expect(regulationTexts.length).toBeGreaterThan(0);
    
    const bestPracticesTexts = screen.getAllByText(/Buenas prácticas/);
    expect(bestPracticesTexts.length).toBeGreaterThan(0);
  });

  it('renders zones items', () => {
    render(<ResourcesSection />);
    
    const zoneTexts = screen.getAllByText(/Geo-zonas y restricciones/);
    expect(zoneTexts.length).toBeGreaterThan(0);
    
    const planningTexts = screen.getAllByText(/Planificación previa/);
    expect(planningTexts.length).toBeGreaterThan(0);
  });

  it('renders video items', () => {
    render(<ResourcesSection />);
    
    const playlistTexts = screen.getAllByText(/Playlists oficiales/);
    expect(playlistTexts.length).toBeGreaterThan(0);
    
    const guideTexts = screen.getAllByText(/Guías rápidas/);
    expect(guideTexts.length).toBeGreaterThan(0);
  });

  it('renders three resource cards', () => {
    const { container } = render(<ResourcesSection />);
    
    // Buscar cards de recursos
    const cards = container.querySelectorAll('.md\\:grid-cols-3 .rounded-2xl');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('renders bullet points for items', () => {
    const { container } = render(<ResourcesSection />);
    
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThan(0);
    
    // Verificar que los items tienen bullet points
    listItems.forEach((item) => {
      expect(item.textContent).toContain('•');
    });
  });
});
