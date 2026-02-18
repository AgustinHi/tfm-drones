// frontend/src/pages/Home.jsx
import { useBackgroundCleanup } from "../hooks/useBackgroundCleanup";
import { HeroSection } from "../components/home/HeroSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { ResourcesSection } from "../components/home/ResourcesSection";

export default function Home() {
  // Home sin loguear: anula cualquier fondo global previo (hangar), pero NO pinta azul.
  useBackgroundCleanup();

  return (
    <div className="relative isolate">
      {/* Fondo único: bg-home.png (SIN z-index negativo) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url(/bg-home.png)" }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/20" />

      <div className="relative z-10 grid gap-6">
        <HeroSection />
        <FeaturesSection />
        <ResourcesSection />
      </div>
    </div>
  );
}
