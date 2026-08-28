import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "FutureCrest Energy CRM",
  description: "Professional Energy Campaign CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-slate-50">
        <AuthProvider>
          <main className="h-full overflow-y-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}