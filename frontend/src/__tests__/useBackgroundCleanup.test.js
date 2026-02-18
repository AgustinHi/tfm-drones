import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useBackgroundCleanup } from '../hooks/useBackgroundCleanup';

// Componente de test que usa el hook
function TestComponent() {
  useBackgroundCleanup();
  return <div>Test</div>;
}

describe('useBackgroundCleanup Hook', () => {
  beforeEach(() => {
    // Limpiar estilos antes de cada test
    document.documentElement.style.background = '';
    document.body.style.background = '';
  });

  afterEach(() => {
    // Limpiar después
    document.documentElement.style.background = '';
    document.body.style.background = '';
  });

  it('should remove background styles on mount', () => {
    // Establecer estilos iniciales
    document.documentElement.style.background = 'blue';
    document.body.style.background = 'red';
    document.documentElement.style.backgroundImage = 'url(test.png)';

    render(<TestComponent />);

    // Verificar que los estilos fueron removidos
    expect(document.documentElement.style.background).toBe('none');
    expect(document.body.style.background).toBe('none');
    expect(document.documentElement.style.backgroundImage).toBe('none');
  });

  it('should set backgroundColor to transparent', () => {
    render(<TestComponent />);

    // Verificar que backgroundColor es transparent
    expect(document.documentElement.style.backgroundColor).toBe('transparent');
    expect(document.body.style.backgroundColor).toBe('transparent');
  });

  it('should restore original styles on cleanup', async () => {
    const originalBackground = 'linear-gradient(to right, blue, red)';
    document.documentElement.style.background = originalBackground;

    const { unmount } = render(<TestComponent />);

    // Verificar que se removió
    expect(document.documentElement.style.background).toBe('none');

    // Desmontar y verificar que se restauró
    unmount();

    await waitFor(() => {
      expect(document.documentElement.style.background).toBe(originalBackground);
    });
  });

  it('should handle missing root element gracefully', () => {
    // No debe lanzar error si no hay root element
    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();
  });
});
