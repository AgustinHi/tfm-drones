import * as React from "react";
import { Card as ShadCard, CardContent, CardHeader, CardTitle } from "../components/ui/card";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Card({ title, children, className = "", bordered = false }) {
  return (
    <ShadCard
      className={cx(
        bordered ? "border border-border/60" : "border-0",
        "bg-background/90 shadow-sm",
        className
      )}
    >
      {title ? (
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={title ? "pt-0" : ""}>{children}</CardContent>
    </ShadCard>
  );
}
