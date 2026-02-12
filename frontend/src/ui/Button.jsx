import * as React from "react";
import { Button as ShadButton } from "../components/ui/button";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  children,
  variant = "default", // default | outline | ghost | danger
  type = "button",
  onClick,
  className = "",
  disabled = false,
  ...props
}) {
  const mappedVariant =
    variant === "danger"
      ? "destructive"
      : variant === "ghost"
      ? "ghost"
      : variant === "outline"
      ? "outline"
      : "default";

  // Capa visual propia (identidad)
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl font-bold " +
    "transition-all duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    default:
      // Primario: gradiente suave + glow sutil en hover
      "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground " +
      "shadow-sm hover:shadow-md " +
      "hover:brightness-[1.03] " +
      "before:absolute before:inset-0 before:-z-10 before:rounded-xl before:blur-md before:opacity-0 " +
      "before:transition-opacity before:duration-200 before:bg-primary " +
      "hover:before:opacity-30",

    outline:
      // Outline fino, más “producto”
      "border border-border/70 bg-background/40 text-foreground backdrop-blur " +
      "hover:bg-accent hover:text-accent-foreground " +
      "shadow-sm hover:shadow-md",

    ghost:
      // Ghost limpio, sin borde, pero con hover agradable
      "bg-transparent text-foreground " +
      "hover:bg-accent hover:text-accent-foreground",

    danger:
      // Danger: no chillón, pero inequívoco
      "bg-destructive text-destructive-foreground " +
      "shadow-sm hover:shadow-md " +
      "hover:brightness-[1.02] " +
      "before:absolute before:inset-0 before:-z-10 before:rounded-xl before:blur-md before:opacity-0 " +
      "before:transition-opacity before:duration-200 before:bg-destructive " +
      "hover:before:opacity-25",
  };

  const extra =
    // Ajustes generales para que “respire” y se vea consistente
    "ring-offset-background";

  const resolved =
    variant === "danger"
      ? variants.danger
      : variant === "outline"
      ? variants.outline
      : variant === "ghost"
      ? variants.ghost
      : variants.default;

  return (
    <ShadButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={mappedVariant}
      className={cx(base, extra, resolved, className)}
      {...props}
    >
      {children}
    </ShadButton>
  );
}
