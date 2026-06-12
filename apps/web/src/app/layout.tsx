import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider.client";

export const metadata: Metadata = {
  title: "LinguaBridge — Live translated video calls",
  description:
    "Private video rooms with real-time English ↔ Spanish captions. Create a room, share one link, talk naturally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. Video Speed Controller) inject classes into <body> before hydration */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
