"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, IndianRupee, TrendingUp, Package } from 'lucide-react'

export default function DashboardPage() {
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalValue, setTotalValue] = useState(0)

    const fetchData = async () => {
        const token = localStorage.getItem("token")
        if (!token) return router.push("/login")
        
        try {
            const resProd = await fetch("https://nexus-erp-f8q9.onrender.com/inventory/products", { 
                headers: { Authorization: `Bearer ${token}` } 
            })
            if (resProd.ok) {
                const data = await resProd.json()
                setProducts(data)
                
                // Calculate Total Inventory Value
                const total = data.reduce((sum: number, p: any) => {
                    return sum + ((p.price || 0) * (p.quantity || 0))
                }, 0)
                setTotalValue(total)
            }
        } catch (error) {
            console.error("Failed to fetch inventory data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Key metrics and business insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Inventory Value Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <IndianRupee size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                            <TrendingUp size={12} />
                            Live
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Total Inventory Value</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
                            Capital currently tied in stock
                        </p>
                    </div>
                </div>

                {/* Total Products Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                            <Package size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Total SKU's</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {products.length}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
                            Unique products in catalog
                        </p>
                    </div>
                </div>
                
                {/* Low Stock Alerts (Placeholder logic) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                            <LayoutDashboard size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Low Stock Alerts</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {products.filter((p: any) => (p.quantity || 0) < 10).length}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
                            Items requiring immediate restock
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions or some other chart can go here in future */}
            <div className="bg-indigo-600 rounded-2xl p-8 text-white flex justify-between items-center overflow-hidden relative">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Welcome to Nexus ERP</h2>
                    <p className="text-indigo-100 max-w-md">The inventory analysis is up to date based on the latest products in your warehouse.</p>
                </div>
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <LayoutDashboard size={200} />
                </div>
            </div>
        </div>
    )
}
