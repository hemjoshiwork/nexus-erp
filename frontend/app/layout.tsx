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
        <html lang="en">
            {/* AGGRESSIVE TEST: RED BACKGROUND */}
            <body style={{ position: 'relative', minHeight: '100vh', background: 'red', margin: 0 }}>
                <Providers>
                    {children}
                </Providers>
                
                {/* TEST BUTTON - SHOULD BE BRIGHT YELLOW */}
                <button style={{ 
                    position: 'fixed', 
                    bottom: '50px', 
                    right: '50px', 
                    padding: '30px', 
                    background: 'yellow', 
                    color: 'black', 
                    fontWeight: 'bold',
                    fontSize: '20px',
                    border: '5px solid black',
                    zIndex: 9999999,
                    cursor: 'pointer'
                }}>
                    DEPLOYMENT TEST: IF YOU SEE THIS, UPDATE WORKED
                </button>

                <div style={{ position: 'fixed', bottom: '150px', right: '30px', zIndex: 999999 }}>
                   <ChatWidget />
                </div>
            </body>
        </html>
    );
}
