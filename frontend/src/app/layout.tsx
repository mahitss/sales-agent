import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Beacon AI - Elevate Sales & Book Meetings Automatically",
  description: "An AI-powered sales agent that lives on your website, answers FAQs, qualifies leads, and schedules appointments automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full bg-black text-white">{children}</body>
    </html>
  );
}
