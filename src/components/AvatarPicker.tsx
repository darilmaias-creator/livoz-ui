"use client";

const avatars = ["🦊", "🐼", "🐯", "🐵", "🐧", "🦁"];

type AvatarPickerProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function AvatarPicker({ value, onChange, error }: AvatarPickerProps) {
  return (
    <div className="grid gap-3">
      <span className="text-sm font-semibold text-slate-700">Escolha de avatar</span>
      <div className="grid grid-cols-3 gap-3">
        {avatars.map((avatar) => (
          <button
            type="button"
            key={avatar}
            onClick={() => onChange(avatar)}
            className={`grid aspect-square place-items-center rounded-[22px] border text-3xl transition ${
              value === avatar
                ? "border-livoz-blue bg-blue-50 shadow-[0_12px_24px_rgba(30,115,248,0.14)]"
                : "border-slate-200 bg-white hover:border-blue-200"
            }`}
            aria-label={`Escolher avatar ${avatar}`}
          >
            {avatar}
          </button>
        ))}
      </div>
      {error ? <span className="text-xs font-bold text-orange-600">{error}</span> : null}
    </div>
  );
}
