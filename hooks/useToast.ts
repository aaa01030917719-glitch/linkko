"use client";

import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string, duration = 2500) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, showToast };
}
