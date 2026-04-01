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
            <body className={`${inter.className} antialiased`} style={{ position: 'relative', minHeight: '100vh' }}>
                <Providers>{children}</Providers>
                
                {/* FORCE VISIBILITY LAYER - Highest possible z-index */}
                <div style={{ 
                    position: 'fixed', 
                    bottom: '30px', 
                    right: '30px', 
                    zIndex: 2147483647,
                    pointerEvents: 'auto' 
                }}>
                   <ChatWidget />
                </div>
            </body>
        </html>
    );
}
