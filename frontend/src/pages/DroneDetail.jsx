import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const CONTROLLERS = ["", "Betaflight", "Kiss"];
const VIDEOS = ["", "Analogico", "Digital"];

export default function DroneDetail() {
  const navigate = useNavigate();
  const { droneId } = useParams();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [drone, setDrone] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    comment: "",
    controller: "",
    video: "",
    radio: "",
    components: "",
  });

  const setError = (text) => setMsg({ type: "error", text });
  const setOk = (text) => setMsg({ type: "ok", text });
  const clearMsg = () => setMsg({ type: "", text: "" });

  const fillFormFromDrone = (d) => {
    setForm({
      name: d?.name ?? "",
      comment: d?.comment ?? "",
      controller: d?.controller ?? "",
      video: d?.video ?? "",
      radio: d?.radio ?? "",
      components: d?.components ?? "",
    });
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      clearMsg();
      setLoading(true);
      try {
        const res = await api.get(`/drones/${droneId}`);
        if (!alive) return;

        setDrone(res.data);
        fillFormFromDrone(res.data);
      } catch (err) {
        if (!alive) return;
        if (!err?.response) setError("Error de red: no se pudo contactar con el servidor.");
        else setError(err?.response?.data?.detail || "Error cargando el dron.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [droneId]);

  const reload = () => {
    window.location.reload();
  };

  const startEdit = () => {
    if (!drone) return;
    clearMsg();
    setIsEditing(true);
    fillFormFromDrone(drone);
  };

  const cancelEdit = () => {
    if (!drone) return;
    clearMsg();
    setIsEditing(false);
    fillFormFromDrone(drone);
  };

  const save = async () => {
    clearMsg();

    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        comment: form.comment?.trim() ? form.comment.trim() : null,
        controller: form.controller?.trim() ? form.controller.trim() : null,
        video: form.video?.trim() ? form.video.trim() : null,
        radio: form.radio?.trim() ? form.radio.trim() : null,
        components: form.components?.trim() ? form.components.trim() : null,
      };

      const res = await api.put(`/drones/${droneId}`, payload);

      setDrone(res.data);
      fillFormFromDrone(res.data);
      setIsEditing(false);
      setOk("Guardado correctamente.");
    } catch (err) {
      if (!err?.response) setError("Error de red: no se pudo contactar con el servidor.");
      else setError(err?.response?.data?.detail || "Error guardando el dron.");
    }
  };

  const Field = ({ label, value }) => (
    <div className="grid gap-1">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="rounded-xl border bg-background px-3 py-2 text-sm">
        {value ? String(value) : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );

  const Select = ({ label, value, onChange, options }) => (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((x) => (
          <option key={x} value={x}>
            {x === "" ? "—" : x}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">Dron #{droneId}</h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Editando características" : "Vista de características (solo lectura)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/manage")}>
              Volver a Manage
            </Button>

            <Button variant="outline" onClick={reload} disabled={loading}>
              Recargar
            </Button>

            {!isEditing ? (
              <Button onClick={startEdit} disabled={loading || !drone}>
                Editar
              </Button>
            ) : (
              <>
                <Button onClick={save} disabled={loading}>
                  Guardar
                </Button>
                <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {msg.text ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            msg.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          ].join(" ")}
        >
          {msg.text}
        </div>
      ) : null}

      {loading ? (
        <Card title="Cargando">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </Card>
      ) : !drone ? (
        <Card title="Error">
          <p className="text-sm text-muted-foreground">No se pudo cargar el dron.</p>
        </Card>
      ) : (
        <Card title="Características">
          {!isEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre" value={drone.name} />
              <Field label="Controller" value={drone.controller} />
              <Field label="Vídeo" value={drone.video} />
              <Field label="Radio" value={drone.radio} />
              <Field label="Componentes" value={drone.components} />
              <div className="md:col-span-2">
                <Field label="Comentario" value={drone.comment} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del dron"
              />

              <Select
                label="Controller"
                value={form.controller}
                onChange={(e) => setForm((f) => ({ ...f, controller: e.target.value }))}
                options={CONTROLLERS}
              />

              <Select
                label="Vídeo"
                value={form.video}
                onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
                options={VIDEOS}
              />

              <Input
                label="Radio"
                value={form.radio}
                onChange={(e) => setForm((f) => ({ ...f, radio: e.target.value }))}
                placeholder="ELRS / Crossfire / etc."
              />

              <Input
                label="Componentes"
                value={form.components}
                onChange={(e) => setForm((f) => ({ ...f, components: e.target.value }))}
                placeholder="Motores, FC, ESC…"
              />

              <label className="grid gap-1 md:col-span-2">
                <span className="text-sm font-medium">Comentario</span>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Notas"
                  rows={4}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>
          )}
        </Card>
      )}

      <Card title="Dumps">
        <p className="text-sm text-muted-foreground">
          Aquí irá: subir dump, listar dumps y botón “Parsear”.
        </p>
      </Card>
    </div>
  );
}
