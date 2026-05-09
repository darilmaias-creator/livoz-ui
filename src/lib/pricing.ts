export function calculateFinalPrice(basePrice: number, discountPercentage: number) {
  const safeBasePrice = Math.max(0, basePrice);
  const safeDiscount = Math.min(100, Math.max(0, discountPercentage));
  const finalPrice = safeBasePrice * (1 - safeDiscount / 100);

  return Math.max(0, Math.round(finalPrice * 100) / 100);
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
