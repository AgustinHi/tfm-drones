export default function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${className}`}>
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}
