import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
// import StagewiseToolbarClient from "../components/StagewiseToolbarClient";
import { UserProvider } from "../contexts/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Popverse.ai - AI驱动的IP角色生成平台",
  description: "上传图片，创造专属IP形象，AI生成完整周边套装。手机壳、钥匙扣、3D手办，秒级完成！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <UserProvider>
          {/* <StagewiseToolbarClient /> */}
          <ClientBody>{children}</ClientBody>
        </UserProvider>
      </body>
    </html>
  );
}
