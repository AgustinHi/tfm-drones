import { CardBox, SectionCard } from "./CardComponents";
import { useTranslationHelper } from "../../hooks/useTranslationHelper";

const RESOURCES = [
  {
    titleEn: "Regulations",
    titleEs: "Normativa",
    items: [
      { en: "Official guidance", es: "Guías oficiales" },
      { en: "Best practices", es: "Buenas prácticas" },
    ],
  },
  {
    titleEn: "Zones",
    titleEs: "Zonas",
    items: [
      { en: "Geo-zones and restrictions", es: "Geo-zonas y restricciones" },
      { en: "Pre-flight planning", es: "Planificación previa" },
    ],
  },
  {
    titleEn: "Video",
    titleEs: "Vídeo",
    items: [
      { en: "Official playlists", es: "Playlists oficiales" },
      { en: "Quick guides", es: "Guías rápidas" },
    ],
  },
];

export function ResourcesSection() {
  const { isEn } = useTranslationHelper();

  return (
    <SectionCard
      title={isEn ? "Regulations, zones and videos" : "Normativa, zonas y vídeos"}
      description={
        isEn
          ? "Quick access to official sources to plan flights and operate safely (available after sign-in)."
          : "Acceso rápido a fuentes oficiales para planificar vuelos y operar con seguridad (disponible al iniciar sesión)."
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {RESOURCES.map((resource, idx) => (
          <CardBox key={idx}>
            <div className="text-sm font-extrabold">
              {isEn ? resource.titleEn : resource.titleEs}
            </div>
            <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
              {resource.items.map((item, itemIdx) => (
                <li key={itemIdx}>• {isEn ? item.en : item.es}</li>
              ))}
            </ul>
          </CardBox>
        ))}
      </div>
    </SectionCard>
  );
}
