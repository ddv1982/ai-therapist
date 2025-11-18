interface MetricTileProps {
  label: string;
  value: React.ReactNode;
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="border-muted/30 bg-background/40 rounded-lg border px-3 py-2">
      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <div className="text-foreground mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
