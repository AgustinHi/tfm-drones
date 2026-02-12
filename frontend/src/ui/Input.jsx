import * as React from "react";
import { Input as ShadInput } from "../components/ui/input";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <label className="grid gap-1">
      {label ? (
        <span className="text-sm font-semibold text-muted-foreground">
          {label} {required ? <span className="text-destructive">*</span> : null}
        </span>
      ) : null}

      <ShadInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cx(
          // Tamaño y forma consistentes
          "h-11 rounded-xl px-3 text-sm",

          // 👇 Clave: un pelín más “sólido” para leer/escribir sobre foto/panel
          // Sin hardcodear colores: usa tokens
          "bg-background/95 text-foreground",

          // Borde suave, token-based (evita bordes negros)
          "border border-input/70",
          "hover:border-input",

          // Placeholder legible
          "placeholder:text-muted-foreground/70",

          // Focus: ring token-based (glow pro sin romper tema)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:border-ring/50",

          // Disabled
          disabled ? "opacity-60 cursor-not-allowed" : "",

          className
        )}
        {...props}
      />
    </label>
  );
}
