import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VShare - Thuê thiết bị quay phim, chụp ảnh",
  description: "Nền tảng kết nối người thuê và cho thuê thiết bị quay phim, chụp ảnh chuyên nghiệp",
  keywords: "thuê camera, thuê ống kính, thiết bị quay phim, chụp ảnh, VShare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
