import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RenderCV AI Resume Builder | YAML to PDF Generator",
  description:
    "Generate ATS-friendly resumes with AI, export RenderCV-compatible YAML, and download professional PDFs in seconds.",
  keywords: [
    "AI resume builder",
    "RenderCV",
    "YAML resume",
    "PDF resume generator",
    "curriculum vitae",
    "CV builder",
    "developer resume",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RenderCV AI Resume Builder",
    description:
      "Build and edit RenderCV YAML with AI and instantly preview a polished PDF resume.",
    url: siteUrl,
    siteName: "RenderCV AI Resume Builder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RenderCV AI Resume Builder | YAML to PDF Generator",
    description:
      "Generate ATS-friendly resumes with AI, edit the YAML schema, and export high-quality PDFs.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        {children}
      </body>
    </html>
  );
}
