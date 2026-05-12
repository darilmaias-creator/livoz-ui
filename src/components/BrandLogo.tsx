export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full overflow-visible ${className}`}>
      <img
        src="/brand/logo.png"
        alt="Livoz - Cada palavra, uma nova descoberta."
        className="block h-auto w-full max-w-[520px] object-contain"
      />
    </div>
  );
}
