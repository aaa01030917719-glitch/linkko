import type { Metadata, Viewport } from "next";
import "./globals.css";

const fontSizeSettingScript = `
(() => {
  try {
    const storageKey = "linkko:settings:font-size";
    const storedValue = window.localStorage.getItem(storageKey);
    const nextValue = storedValue === "medium" || storedValue === "large" ? storedValue : "default";
    document.documentElement.dataset.fontSize = nextValue;
  } catch {
    document.documentElement.dataset.fontSize = "default";
  }
})();
`;

export const metadata: Metadata = {
  title: "Linkko",
  description: "나만의 링크 메모 아카이브",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6C5CE7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontSizeSettingScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
