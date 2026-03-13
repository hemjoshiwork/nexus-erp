"use client"
import { useState, useEffect } from "react"
import { History, FileText } from "lucide-react"
import InvoiceModal from "../../../components/InvoiceModal"

export default function SalesHistory() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchHistory = async () => {
        const token = localStorage.getItem("token")
        const res = await fetch("https://nexus-erp-f8q9.onrender.com/sales/history", {
            headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
            setSales(await res.json())
        }
        setLoading(false)
    }

    useEffect(() => { fetchHistory() }, [])

    const openInvoice = (id: number) => {
        setSelectedSaleId(id)
        setIsModalOpen(true)
    }

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Ledger</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">History of all transactions</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider sticky top-0">
                            <tr>
                                <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Invoice</th>
                                <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Date</th>
                                <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Customer</th>
                                <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Manifest</th>
                                <th className="py-4 px-6 text-right border-b border-gray-200 dark:border-slate-700">Tax</th>
                                <th className="py-4 px-6 text-right border-b border-gray-200 dark:border-slate-700">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-slate-800">
                            {sales.map((sale: any) => (
                                <tr key={sale.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-slate-800 transition-colors">
                                    <td className="py-4 px-6 text-left font-mono text-gray-500 dark:text-slate-400 text-xs">
                                        <div 
                                            className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors group"
                                            onClick={() => openInvoice(sale.id)}
                                        >
                                            <FileText className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                            {sale.invoice_number}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-left text-gray-600 dark:text-slate-300">
                                        {new Date(sale.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6 text-left">
                                        <div className="font-medium text-gray-900 dark:text-white">{sale.customer_name}</div>
                                        <div className="text-xs text-gray-500 dark:text-slate-500">{sale.customer_phone_number || 'N/A'}</div>
                                    </td>
                                    <td className="py-4 px-6 text-left">
                                        <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">{sale.items.length} items</span>
                                    </td>
                                    <td className="py-4 px-6 text-right text-gray-500 dark:text-slate-400 font-mono">
                                        ₹{sale.tax_amount.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-6 text-right font-bold text-gray-900 dark:text-white font-mono">
                                        ₹{sale.total_amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-slate-500">No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InvoiceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                saleId={selectedSaleId} 
            />
        </div>
    )
}
