import { CardBox, SectionCard } from "./CardComponents";
import { useTranslationHelper } from "../../hooks/useTranslationHelper";

const FEATURES = [
  {
    titleKey: "home.features.cleanProfiles.title",
    titleEn: "Clean profiles",
    titleEs: "Fichas claras",
    descKey: "home.features.cleanProfiles.desc",
    descEn: "Components, radio, video and notes in one place.",
    descEs: "Componentes, radio, vídeo y notas en un solo sitio.",
  },
  {
    titleKey: "home.features.dumpsDrone.title",
    titleEn: "Dumps per drone",
    titleEs: "Dumps por dron",
    descKey: "home.features.dumpsDrone.desc",
    descEn: "Upload, review and keep versions so you never lose changes.",
    descEs: "Sube, revisa y guarda versiones para no perder cambios.",
  },
  {
    titleKey: "home.features.resources.title",
    titleEn: "Resources",
    titleEs: "Recursos",
    descKey: "home.features.resources.desc",
    descEn: "Rules, zones and guides (available after sign-in).",
    descEs: "Normativa, zonas y guías (disponible al iniciar sesión).",
  },
  {
    titleKey: "home.features.community.title",
    titleEn: "Public / Community",
    titleEs: "Público / Comunidad",
    descKey: "home.features.community.desc",
    descEn: "Learn from shared configs and tips.",
    descEs: "Aprende de configuraciones y consejos compartidos.",
  },
];

export function FeaturesSection() {
  const { tv, isEn } = useTranslationHelper();

  return (
    <SectionCard
      title={isEn ? "This is what it feels like inside" : "Así se siente por dentro"}
      description={
        isEn
          ? "An interface designed to keep your configurations accessible with zero friction."
          : "Una interfaz pensada para que encuentres y mantengas tus configuraciones sin fricción."
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="grid gap-3">
          {FEATURES.map((feature, idx) => (
            <CardBox key={idx}>
              <div className="text-sm font-extrabold">
                {tv(feature.titleKey, feature.titleEs, feature.titleEn)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {tv(feature.descKey, feature.descEs, feature.descEn)}
              </div>
            </CardBox>
          ))}
        </div>

        <div className="relative h-[300px] overflow-hidden rounded-3xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10 sm:h-[360px] lg:h-[420px]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
          <img
            src="/home-preview.png"
            alt={isEn ? "Example: drone card and dumps" : "Ejemplo: tarjeta de dron y dumps"}
            className="h-full w-full object-contain"
            loading="lazy"
            draggable="false"
          />
        </div>
      </div>
    </SectionCard>
  );
}
