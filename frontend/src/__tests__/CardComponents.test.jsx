import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardBox, SectionCard } from '../components/home/CardComponents';

describe('CardBox Component', () => {
  it('renders children correctly', () => {
    render(
      <CardBox>
        <div>Test Content</div>
      </CardBox>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <CardBox>
        <div>Content</div>
      </CardBox>
    );
    const cardElement = container.querySelector('.rounded-2xl');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass('bg-white/45', 'backdrop-blur-xl');
  });

  it('applies additional custom classes', () => {
    const { container } = render(
      <CardBox className="custom-class">
        <div>Content</div>
      </CardBox>
    );
    const cardElement = container.querySelector('.custom-class');
    expect(cardElement).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <CardBox>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </CardBox>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});

describe('SectionCard Component', () => {
  it('renders title correctly', () => {
    render(
      <SectionCard title="Test Title">
        <div>Content</div>
      </SectionCard>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <SectionCard title="Title" description="Test Description">
        <div>Content</div>
      </SectionCard>
    );
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const { container } = render(
      <SectionCard title="Title">
        <div>Content</div>
      </SectionCard>
    );
    // Verificar que el componente se renderiza sin errores
    expect(container.querySelector('h2')).toHaveTextContent('Title');
  });

  it('renders children content', () => {
    render(
      <SectionCard title="Title" description="Description">
        <div>Custom Content</div>
      </SectionCard>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(
      <SectionCard title="Title" description="Description">
        <div>Content</div>
      </SectionCard>
    );
    const sectionElement = container.querySelector('.rounded-3xl');
    expect(sectionElement).toHaveClass('bg-white/55', 'backdrop-blur-2xl');
  });
});
