export default function Button({
  children,
  variant = "default", // default | outline
  type = "button",
  onClick,
  className = "",
  disabled = false,
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition";
  const variants = {
    default: "bg-black text-white hover:opacity-90 disabled:opacity-50",
    outline: "border hover:bg-gray-50 disabled:opacity-50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
