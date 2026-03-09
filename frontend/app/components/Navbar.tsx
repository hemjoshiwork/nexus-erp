"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, Truck, Receipt, History, LogOut } from 'lucide-react';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const navItems = [
        { name: 'Inventory', path: '/inventory', icon: LayoutDashboard },
        { name: 'Suppliers', path: '/suppliers', icon: Truck },
        { name: 'Billing', path: '/billing', icon: Receipt },
        { name: 'Sales History', path: '/sales-history', icon: History },
    ];

    return (
        <nav className="h-full w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-colors duration-300">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">N</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Nexus ERP
                    </span>
                </div>

                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-gray-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase">Theme</span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </nav>
    );
}