import * as React from "react";
import { Card as ShadCard, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function Card({ title, children, className = "" }) {
  return (
    <ShadCard className={className}>
      {title ? (
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={title ? "pt-0" : ""}>{children}</CardContent>
    </ShadCard>
  );
}
