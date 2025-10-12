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
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
