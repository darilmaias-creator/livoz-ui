import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  children?: ReactNode;
};

type FormInputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

type FormSelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: string[];
  };

export function FormInput({ label, error, className = "", ...props }: FormInputProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        className={`w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-livoz-blue focus:ring-4 focus:ring-blue-100 ${className}`}
        {...props}
      />
      {error ? <span className="text-xs font-bold text-orange-600">{error}</span> : null}
    </label>
  );
}

export function FormSelect({ label, error, options, className = "", ...props }: FormSelectProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <select
        className={`w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-livoz-blue focus:ring-4 focus:ring-blue-100 ${className}`}
        {...props}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs font-bold text-orange-600">{error}</span> : null}
    </label>
  );
}
