export function CardBox({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
