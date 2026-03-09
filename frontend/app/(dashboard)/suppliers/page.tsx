"use client"
import { useState, useEffect } from "react"
import { Truck, Mail, Phone, Trash2, Plus } from "lucide-react"

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([])
    const [form, setForm] = useState({ name: "", contact_person: "", email: "", phone_number: "" })
    const [searchTerm, setSearchTerm] = useState("")

    const fetchSuppliers = async () => {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:8000/suppliers", { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) setSuppliers(await res.json())
    }
    useEffect(() => { fetchSuppliers() }, [])

    const filteredSuppliers = suppliers.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const validateForm = () => {
        if (!form.name || !form.contact_person || !form.email || !form.phone_number) { alert("All fields mandatory"); return false; }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:8000/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(form),
        })
        if (res.ok) { setForm({ name: "", contact_person: "", email: "", phone_number: "" }); fetchSuppliers(); }
        else { alert("Error saving supplier") }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        const token = localStorage.getItem("token")
        const res = await fetch(`http://localhost:8000/suppliers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) fetchSuppliers()
    }

    const inputStyle = "w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Manage vendor relationships and contacts</p>
                </div>

                <input
                    type="text"
                    placeholder="Search suppliers..."
                    className="p-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg w-64 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 h-fit">
                    <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-600" />
                        Add New Supplier
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Company Name</label>
                            <input placeholder="Acme Corp" className={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contact Person</label>
                            <input placeholder="John Doe" className={inputStyle} value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                            <input type="email" placeholder="contact@acme.com" className={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
                            <input placeholder="+1 234 567 890" className={inputStyle} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Register Supplier
                        </button>
                    </form>
                </div>

                {/* Table Card */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider sticky top-0">
                                <tr>
                                    <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Company</th>
                                    <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Contact</th>
                                    <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Email</th>
                                    <th className="py-4 px-6 text-left border-b border-gray-200 dark:border-slate-700">Phone</th>
                                    <th className="py-4 px-6 text-center border-b border-gray-200 dark:border-slate-700">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100 dark:divide-slate-800">
                                {filteredSuppliers.map((s: any) => (
                                    <tr key={s.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-slate-800 transition-colors">
                                        <td className="py-4 px-6 text-left font-medium text-gray-900 dark:text-white">{s.name}</td>
                                        <td className="py-4 px-6 text-left text-gray-600 dark:text-slate-400">{s.contact_person}</td>
                                        <td className="py-4 px-6 text-left text-gray-500 dark:text-slate-500 flex items-center gap-2">
                                            <Mail className="w-3 h-3" /> {s.email}
                                        </td>
                                        <td className="py-4 px-6 text-left text-gray-500 dark:text-slate-500 font-mono text-xs">
                                            {s.phone_number}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSuppliers.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 dark:text-slate-500">No suppliers found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}