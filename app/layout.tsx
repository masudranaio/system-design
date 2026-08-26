import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/nav/theme-provider";
import { TopBar } from "@/components/nav/TopBar";
import { Sidebar } from "@/components/nav/Sidebar";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "System Design Course",
  description:
    "A personal HLD + LLD system design course and interview-prep reference.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexMono.variable} ${sourceSerif.variable}`}
    >
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            <TopBar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 px-6 py-6">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
