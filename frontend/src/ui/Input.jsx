export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div className="grid gap-1">
      {label ? <label className="text-sm font-medium">{label}</label> : null}
      <input
        className="rounded-lg border px-3 py-2 outline-none focus:ring"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
