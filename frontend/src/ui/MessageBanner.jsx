// frontend/src/ui/MessageBanner.jsx

/**
 * Banner SIEMPRE legible:
 * - fondo oscuro + texto blanco (alto contraste)
 * - barra lateral de color por tipo
 *
 * Uso:
 *   <MessageBanner msg={{ type: "ok" | "error" | "warn" | "info", text: "..." }} />
 *   <MessageBanner msg="texto (asume error)" />
 */
export default function MessageBanner({ msg }) {
  const text = typeof msg === "string" ? msg : msg?.text;
  if (!text) return null;

  const type = typeof msg === "string" ? "error" : msg?.type || "info";

  const barClass =
    type === "ok"
      ? "bg-emerald-400"
      : type === "warn"
      ? "bg-amber-400"
      : type === "info"
      ? "bg-sky-400"
      : "bg-rose-400";

  return (
    <div className="relative overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-black/20 bg-slate-900/85 text-white">
      <div
        className={["pointer-events-none absolute left-0 top-0 h-full w-[6px]", barClass].join(" ")}
        aria-hidden="true"
      />
      <div className="pl-3">{text}</div>
    </div>
  );
}

