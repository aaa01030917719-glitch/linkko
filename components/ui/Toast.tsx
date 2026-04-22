"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 후 fade-in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
