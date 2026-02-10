import { useNavigate, useParams } from "react-router-dom";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function DumpParse() {
  const navigate = useNavigate();
  const { droneId, dumpId } = useParams();

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">Parse del dump #{dumpId}</h1>
            <p className="text-sm text-muted-foreground">Dron #{droneId} · Interpretación de datos</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/drones/${droneId}`)}>
              Volver al dron
            </Button>
          </div>
        </div>
      </div>

      <Card title="Estado">
        <p className="text-sm text-muted-foreground">
          El parse todavía no está implementado en el backend. La página ya está maquetada y lista.
        </p>
      </Card>

      <Card title="Estructura prevista">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Secciones por categoría (FC, rates, puertos, PID, OSD…)</li>
          <li>Comparación con valores recomendados (si procede)</li>
          <li>Alertas por valores fuera de rango</li>
        </ul>
      </Card>
    </div>
  );
}
