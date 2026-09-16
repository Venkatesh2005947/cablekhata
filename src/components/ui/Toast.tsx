// src/components/ui/Toast.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

export interface ToastOptions {
  message: string;
  icon?: string;
  duration?: number;
}

// Simple singleton event bus for toasts
type ToastListener = (opts: ToastOptions) => void;
const listeners: ToastListener[] = [];

export function showToast(opts: ToastOptions) {
  listeners.forEach((fn) => fn(opts));
}

export default function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [icon, setIcon] = useState("check_circle");

  const trigger = useCallback((opts: ToastOptions) => {
    setMessage(opts.message);
    setIcon(opts.icon ?? "check_circle");
    setVisible(true);
    setTimeout(() => setVisible(false), opts.duration ?? 2800);
  }, []);

  useEffect(() => {
    listeners.push(trigger);
    return () => {
      const idx = listeners.indexOf(trigger);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, [trigger]);

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-modal flex items-center gap-2 text-label-md transition-all duration-300 pointer-events-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className="material-symbols-outlined text-inverse-primary text-[20px]">
        {icon}
      </span>
      <span>{message}</span>
    </div>
  );
}
