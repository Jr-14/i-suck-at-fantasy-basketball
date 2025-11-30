import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarNav } from "./components/sidebar-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skill Issue",
  description: "I suck at fantasy basketball and have skill issues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
          <aside className="hidden w-64 border-r border-zinc-200 bg-white/80 px-5 py-8 shadow-sm lg:block">
            <div className="flex h-full flex-col gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Skill Issue
                </p>
                <p className="text-lg font-semibold text-zinc-900">Fantasy helper</p>
              </div>
              <SidebarNav />
            </div>
          </aside>
          <div className="flex-1">
            <div className="border-b border-zinc-200 bg-white/90 px-4 py-3 shadow-sm lg:hidden">
              <SidebarNav orientation="horizontal" />
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
