import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
// CHANGED: Using relative path to find the component
import ChatWidget from "../components/ChatWidget";

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
            {/* CLEAN PROFESSIONAL BODY */}
            <body className={`${inter.className} antialiased bg-gray-50 dark:bg-slate-950 transition-colors duration-300`}>
                <Providers>
                    {children}
                </Providers>
                
                {/* Sleek Chatbot Layer */}
                <div className="fixed bottom-6 right-6 z-[9999]">
                   <ChatWidget />
                </div>
            </body>
        </html>
    );
}
