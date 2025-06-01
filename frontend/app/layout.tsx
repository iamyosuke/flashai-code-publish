import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import "./globals.css";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Flash AI - Smart Language Learning",
  description: "AI-powered flashcard generation for efficient language learning. Create personalized flashcards instantly with artificial intelligence to accelerate your language learning journey.",
  generator: "Next.js",
  applicationName: "Flash AI",
  referrer: "origin-when-cross-origin",
  keywords: ["flashcards", "language learning", "AI", "education", "spaced repetition", "study tools"],
  authors: [{ name: "Flash AI Team" }],
  colorScheme: "dark light",
  creator: "Flash AI Team",
  publisher: "Flash AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://getflashai.xyz"),
  
  openGraph: {
    title: "Flash AI - Smart Language Learning",
    description: "AI-powered flashcard generation for efficient language learning. Create personalized flashcards instantly with artificial intelligence.",
    url: "https://getflashai.xyz",
    siteName: "Flash AI",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "AI Flashcards Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Flash AI - Smart Language Learning",
    description: "AI-powered flashcard generation for efficient language learning",
    images: ["/logo.png"],
    creator: "@getflashai",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/logo.png",
    },
  },

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
