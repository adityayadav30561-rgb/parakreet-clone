export function Panel({
  title,
  children,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
}): React.JSX.Element {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">{title}</h2>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </header>
      {children}
    </section>
  );
}
