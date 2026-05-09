import type { ReactNode } from "react";

type BenefitCardProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  benefit?: string;
  validity?: string;
  status?: string;
  tone?: "green" | "blue" | "orange" | "pink";
};

const toneClasses = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-livoz-blue",
  orange: "bg-orange-50 text-livoz-orange",
  pink: "bg-pink-50 text-pink-600",
};

export function BenefitCard({
  icon = "⭐",
  title,
  description,
  benefit,
  validity,
  status,
  tone = "blue",
}: BenefitCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-card">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[16px] text-2xl ${toneClasses[tone]}`}>
        {icon}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{title}</h3>
          {status && (
            <span className="rounded-full bg-livoz-soft px-3 py-1 text-[11px] font-extrabold uppercase text-livoz-blue">
              {status}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        {(benefit || validity) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            {benefit && <span className="rounded-full bg-slate-50 px-3 py-1">{benefit}</span>}
            {validity && <span className="rounded-full bg-slate-50 px-3 py-1">Validade: {validity}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
