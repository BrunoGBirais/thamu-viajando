"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Tone = "success" | "error";

type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<
  ((message: string, tone?: Tone) => void) | null
>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(
      () => setToasts((current) => current.filter((item) => item.id !== id)),
      3500
    );
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}

      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="animate-pop flex items-center gap-3 rounded-xl bg-brand-navy px-4 py-3 font-semibold text-white shadow-xl"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                toast.tone === "error"
                  ? "bg-brand-red text-white"
                  : "bg-brand-yellow text-brand-navy"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {toast.tone === "error" ? (
                  <path d="M12 7v6M12 17h.01" />
                ) : (
                  <path d="M20 6 9 17l-5-5" />
                )}
              </svg>
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);

  if (!push) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  }

  return push;
}
