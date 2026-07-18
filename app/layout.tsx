import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FutureCrest Energy CRM",
  description: "Professional Energy Campaign CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      {/* We removed the Sidebar here so it doesn't double-up */}
      <body className={`${inter.className} h-screen overflow-hidden bg-slate-50`}>
        <main className="h-full overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}