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
        <html lang="en">
            {/* AGGRESSIVE TEST: RED BACKGROUND */}
            <body style={{ position: 'relative', minHeight: '100vh', background: 'red', margin: 0 }}>
                <Providers>
                    {children}
                </Providers>
                
                {/* DIAGNOSTIC LAYER: YELLOW BUTTON */}
                <button style={{ 
                    position: 'fixed', 
                    bottom: '50px', 
                    right: '50px', 
                    padding: '30px', 
                    background: 'yellow', 
                    color: 'black', 
                    fontWeight: 'bold',
                    zIndex: 9999999,
                }}>
                    BUILD SUCCESSFUL: UPDATE IS LIVE
                </button>

                <div style={{ position: 'fixed', bottom: '150px', right: '30px', zIndex: 999999 }}>
                   <ChatWidget />
                </div>
            </body>
        </html>
    );
}
