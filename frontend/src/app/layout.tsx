// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Activity Tracker",
  description: "Track and manage your daily activities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-800 text-gray-800 min-h-screen flex flex-col items-center justify-start p-4">
        <div className="w-full max-w-4xl">{children}</div>
      </body>
    </html>
  );
}
