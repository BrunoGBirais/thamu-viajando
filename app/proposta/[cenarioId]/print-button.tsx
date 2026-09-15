"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
    >
      Salvar como PDF
    </button>
  );
}
