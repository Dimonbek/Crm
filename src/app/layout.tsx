import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
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
  title: "DimoCRM",
  description: "Telegram bot bilan ishlaydigan CRM tizimi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mavzu cookie'дan o'qiladi — server darhol to'g'ri chizadi
  const theme = (await cookies()).get("theme")?.value;
  const dark = theme === "dark";

  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${
        dark ? " dark" : ""
      }`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
