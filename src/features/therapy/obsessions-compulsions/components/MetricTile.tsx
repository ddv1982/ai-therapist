import React from 'react';

interface MetricTileProps {
  label: string;
  value: React.ReactNode;
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-lg border border-muted/30 bg-background/40 px-3 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
