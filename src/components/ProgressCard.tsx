type ProgressCardProps = {
  title?: string;
  description?: string;
  value?: number;
  percentage?: number;
  stars?: number;
  level?: string;
};

export function ProgressCard({
  title = "Progresso semanal",
  description = "Continue praticando para ganhar mais estrelas.",
  value,
  percentage,
  stars = 0,
  level = "Explorador",
}: ProgressCardProps) {
  const progressValue = percentage ?? value ?? 0;
  const safeValue = Math.min(Math.max(progressValue, 0), 100);

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-card">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-title text-xl font-extrabold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <strong className="text-2xl text-livoz-navy">{safeValue}%</strong>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-livoz-blue to-livoz-cyan"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold text-slate-600">
        <span className="rounded-full bg-livoz-soft px-3 py-1">⭐ {stars} estrelas</span>
        <span className="rounded-full bg-livoz-soft px-3 py-1">Nível {level}</span>
      </div>
    </section>
  );
}
