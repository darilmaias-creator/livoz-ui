import type { ReactNode } from "react";

type MissionCardProps = {
  icon?: ReactNode;
  title: string;
  description?: string | null;
  type?: string;
  level?: string;
  action?: ReactNode;
  completed?: boolean;
  isCompleting?: boolean;
  onComplete?: () => void;
};

export function MissionCard({
  icon = "⭐",
  title,
  description,
  type,
  level,
  action,
  completed = false,
  isCompleting = false,
  onComplete,
}: MissionCardProps) {
  return (
    <article className={`rounded-[26px] p-5 shadow-card ${completed ? "bg-green-50 ring-2 ring-green-100" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-livoz-soft text-2xl">
            {icon}
          </span>
          <div>
            {(type || level) && (
              <div className="flex flex-wrap gap-2">
                {type && (
                  <span className="rounded-full bg-livoz-soft px-3 py-1 text-[11px] font-extrabold uppercase text-livoz-blue">
                    {type}
                  </span>
                )}
                {level && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold uppercase text-slate-500">
                    {level}
                  </span>
                )}
              </div>
            )}
            <h2 className="mt-2 font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description || "Uma nova descoberta espera por aqui."}
            </p>
          </div>
        </div>
        {action ||
          (onComplete && (
            <button
              type="button"
              onClick={onComplete}
              disabled={completed || isCompleting}
              className="shrink-0 rounded-full bg-livoz-blue px-4 py-2 text-xs font-extrabold text-white transition hover:bg-livoz-navy disabled:cursor-not-allowed disabled:bg-green-500"
            >
              {isCompleting ? "Salvando..." : completed ? "Concluída" : "Concluir missão"}
            </button>
          ))}
      </div>
      {completed && (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-green-700">
          Missão concluída! Você ganhou estrelas.
        </p>
      )}
    </article>
  );
}
