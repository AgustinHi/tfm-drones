import * as React from "react";
import { Input as ShadInput } from "../components/ui/input";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  className = "",
  ...props
}) {
  return (
    <label className="grid gap-1">
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      <ShadInput
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={className}
        {...props}
      />
    </label>
  );
}
