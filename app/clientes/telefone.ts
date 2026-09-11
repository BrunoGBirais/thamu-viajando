// Formato alvo: (55) 11 9 9550-0339
export function formatTelefone(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 13);

  if (digits.length === 0) return "";

  let result = `(${digits.slice(0, 2)}`;
  if (digits.length <= 2) return result;

  result += `) ${digits.slice(2, 4)}`;
  if (digits.length <= 4) return result;

  result += ` ${digits.slice(4, 5)}`;
  if (digits.length <= 5) return result;

  result += ` ${digits.slice(5, 9)}`;
  if (digits.length <= 9) return result;

  return `${result}-${digits.slice(9)}`;
}
