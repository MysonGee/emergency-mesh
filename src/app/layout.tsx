import type { Metadata } from "next";
import "./globals.css";
import "./additions.css";
import "./figma-design.css";
import "./agent.css";
import "./weather.css";
import "./operational.css";

export const metadata: Metadata = {
  title: "Emergency Mesh",
  description: "Fictional, deterministic capability planning demo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
