import { useNavigate, useParams } from "react-router-dom";
import Button from "../ui/Button";
import Card from "../ui/Card";

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function SectionPlaceholder({ title, desc }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-extrabold tracking-tight">{title}</div>
          <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
        <Chip>pendiente</Chip>
      </div>
    </div>
  );
}

export default function DumpParse() {
  const navigate = useNavigate();
  const { droneId, dumpId } = useParams();

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Parse del dump #{dumpId}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Chip>Dron #{droneId}</Chip>
              <Chip>Interpretación de datos</Chip>
              <Chip>solo lectura</Chip>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta pantalla mostrará el análisis del dump: secciones por categoría, alertas y recomendaciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/drones/${droneId}`)}>
              Volver al dron
            </Button>
            <Button variant="outline" onClick={() => navigate("/manage")}>
              Volver a Manage
            </Button>
          </div>
        </div>

        {/* Action strip */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Estado actual: <span className="font-bold text-foreground">maquetado</span> · backend{" "}
            <span className="font-bold text-foreground">pendiente</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled title="Pendiente de implementar en el backend">
              Parsear (pendiente)
            </Button>
          </div>
        </div>
      </div>

      <Card title="Estado">
        <div className="grid gap-3">
          <div className="rounded-2xl border bg-background p-5">
            <p className="text-sm text-muted-foreground">
              El parse todavía no está implementado en el backend. Esta pantalla ya está lista para mostrar:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Secciones por categoría (FC, rates, puertos, PID, OSD…)</li>
              <li>Comparación con valores recomendados (si procede)</li>
              <li>Alertas por valores fuera de rango</li>
            </ul>

            <p className="mt-4 text-xs text-muted-foreground">
              Cuando el endpoint exista, aquí se mostrarán resultados y avisos sin romper el layout.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Estructura prevista">
        <div className="grid gap-3">
          <SectionPlaceholder
            title="FC / Firmware"
            desc="Versión, target, configuración base y compatibilidad."
          />
          <SectionPlaceholder
            title="PID / Rates"
            desc="Valores actuales, desviaciones y recomendaciones."
          />
          <SectionPlaceholder
            title="Ports / Periféricos"
            desc="UARTs, GPS, VTX, RX, SmartAudio, etc."
          />
          <SectionPlaceholder
            title="OSD / Modes"
            desc="Elementos OSD y asignación de modos."
          />
          <SectionPlaceholder
            title="Alertas"
            desc="Valores fuera de rango, incoherencias y riesgos."
          />
        </div>
      </Card>
    </div>
  );
}
