import * as React from "react";
import { Button as ShadButton } from "../components/ui/button";

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

  return (
    <ShadButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={mappedVariant}
      className={className}
      {...props}
    >
      {children}
    </ShadButton>
  );
}
