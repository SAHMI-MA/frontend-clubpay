import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/lib/redux/provider";
import { getAssociationMetadata } from "@/lib/server-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getAssociationMetadata()
  
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: ["sports", "association", "management", "system", "teams", "players"],
    authors: [{ name: "Sports Manager Team" }],
    viewport: "width=device-width, initial-scale=1",
    robots: "index, follow",
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      siteName: metadata.siteName,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: metadata.title,
      description: metadata.description,
    },
    other: {
      ...(metadata.organizationName && { 'organization-name': metadata.organizationName }),
      ...(metadata.contactEmail && { 'contact-email': metadata.contactEmail }),
      ...(metadata.address && { 'organization-address': metadata.address }),
    }
  }
}

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
        <ReduxProvider>
          {/* I18nProvider will be client-side only and initialized in the client */}
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
