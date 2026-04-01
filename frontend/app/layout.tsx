import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ChatWidget from "@/components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "NexusInventory",
    description: "Pro-grade ERP for inventory management",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} antialiased relative`}>
                <Providers>{children}</Providers>
                
                {/* Fixed container with highest Z-index to force visibility */}
                <div className="fixed bottom-0 right-0 z-[9999] pointer-events-none p-6">
                   <div className="pointer-events-auto">
                      <ChatWidget />
                   </div>
                </div>
            </body>
        </html>
    );
}
