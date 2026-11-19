import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Double Programme — Comparateur Letterboxd",
  description: "Comparez les films et les notes de deux profils Letterboxd, puis choisissez quoi vous faire découvrir.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
