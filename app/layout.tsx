import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { PreferencesProvider, preferencesBootScript } from "./_features/preferences/Preferences";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter-src", display: "swap" });
const khmer = Noto_Sans_Khmer({ subsets: ["khmer"], variable: "--font-khmer-src", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Rean AI Admin", template: "%s · Rean AI Admin" },
  description: "Curriculum publishing, student monitoring and AI turn review for Rean AI.",
  icons: { icon: "/AI Tutor_Logo.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#070b19" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${khmer.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
