import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/nav/theme-provider";
import { TopBar } from "@/components/nav/TopBar";
import { Sidebar } from "@/components/nav/Sidebar";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
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
      className={`${archivo.variable} ${sourceSans.variable} ${plexMono.variable}`}
    >
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            <TopBar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
