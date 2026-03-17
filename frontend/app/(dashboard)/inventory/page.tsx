"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function InventoryContent() {
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Modals
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isStockModalOpen, setIsStockModalOpen] = useState(false)
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)

    const [editingId, setEditingId] = useState<number | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [uploadResult, setUploadResult] = useState<any>(null)

    const [newProduct, setNewProduct] = useState({ name: "", sku: "", category: "", price: 0, quantity: 0, description: "", supplier_id: "", tax_category: "General" })
    const [newSupplier, setNewSupplier] = useState({ name: "", contact_person: "", email: "", phone_number: "" })
    const [stockMove, setStockMove] = useState({ product_id: "", movement_type: "in", change_amount: 0, reason: "" })

    const searchParams = useSearchParams()
    const filter = searchParams.get("filter")

    const fetchData = async () => {
        const token = localStorage.getItem("token")
        if (!token) return router.push("/login")
        const resProd = await fetch("https://nexus-erp-f8q9.onrender.com/inventory/products", { headers: { Authorization: `Bearer ${token}` } })
        if (resProd.ok) setProducts(await resProd.json())
        const resSup = await fetch("https://nexus-erp-f8q9.onrender.com/suppliers", { headers: { Authorization: `Bearer ${token}` } })
        if (resSup.ok) setSuppliers(await resSup.json())
    }
    useEffect(() => { fetchData() }, [])

    const filteredProducts = products.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (filter === "low_stock") {
            return matchesSearch && (p.quantity || 0) < 10
        }
        return matchesSearch
    })

    const validateSupplier = () => {
        if (!newSupplier.name || !newSupplier.contact_person || !newSupplier.email || !newSupplier.phone_number) { alert("All fields mandatory"); return false; }
        return true
    }
    const validateProduct = () => {
        if (!newProduct.name || !newProduct.category || !newProduct.supplier_id) { alert("Name, Category, and Supplier are mandatory"); return false; }
        return true
    }

    const handleCreateOrEditProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateProduct()) return
        const token = localStorage.getItem("token")
        const payload = { ...newProduct, supplier_id: parseInt(newProduct.supplier_id) }
        let url = "https://nexus-erp-f8q9.onrender.com/inventory", method = "POST"
        if (editingId) { url = `https://nexus-erp-f8q9.onrender.com/inventory/${editingId}`; method = "PUT"; }
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
        if (res.ok) { setIsProductModalOpen(false); setEditingId(null); setNewProduct({ name: "", sku: "", category: "", price: 0, quantity: 0, description: "", supplier_id: "", tax_category: "General" }); fetchData(); }
        else { alert("Failed to save product") }
    }

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateSupplier()) return
        const token = localStorage.getItem("token")
        const res = await fetch("https://nexus-erp-f8q9.onrender.com/suppliers", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(newSupplier) })
        if (res.ok) { const s = await res.json(); setIsSupplierModalOpen(false); setNewSupplier({ name: "", contact_person: "", email: "", phone_number: "" }); await fetchData(); setNewProduct(prev => ({ ...prev, supplier_id: s.id.toString() })); }
        else { alert("Failed to create supplier") }
    }

    const handleMoveStock = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem("token")
        const res = await fetch("https://nexus-erp-f8q9.onrender.com/inventory/movements", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(stockMove) })
        if (res.ok) { setIsStockModalOpen(false); fetchData(); } else { alert("Failed to move stock") }
    }

    const handleUpload = async () => {
        if (!file) return; setLoading(true)
        const token = localStorage.getItem("token"); const formData = new FormData(); formData.append("file", file)
        try { const res = await fetch("https://nexus-erp-f8q9.onrender.com/inventory/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }); const data = await res.json(); setUploadResult(data); } catch (e) { alert("Upload Failed") } finally { setLoading(false); fetchData(); }
    }
    const closeUpload = () => { setIsUploadModalOpen(false); setUploadResult(null); setFile(null); }
    const handleClearInventory = async () => { if (!confirm("⚠️ Delete ALL products?")) return; const token = localStorage.getItem("token"); await fetch("https://nexus-erp-f8q9.onrender.com/inventory/clear", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); fetchData(); }
    const openEditModal = (p: any) => { setNewProduct({ name: p.name, sku: p.sku, category: p.category, price: p.price, quantity: p.quantity, description: p.description || "", supplier_id: p.supplier_id ? p.supplier_id.toString() : "", tax_category: p.tax_category || "General" }); setEditingId(p.id); setIsProductModalOpen(true); }

    // Styles
    const inputStyle = "w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
    const labelStyle = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1";
    const btnPrimary = "bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all";
    const btnDanger = "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg font-medium transition-all";
    const modalBg = "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4";
    const modalPanel = "bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl text-left border border-gray-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto";

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Manage your assets and stock levels</p>
                </div>

                <div className="flex gap-4 items-center">
                    {filter === "low_stock" && (
                        <button 
                            onClick={() => router.push("/inventory")}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                        >
                            Low Stock Filter <span>×</span>
                        </button>
                    )}
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="p-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg w-64 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleClearInventory} className={btnDanger}>Purge</button>
                        <button onClick={() => setIsUploadModalOpen(true)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 px-4 py-2 rounded-lg font-medium">Import</button>
                        <button onClick={() => setIsStockModalOpen(true)} className="bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 px-4 py-2 rounded-lg font-medium">Move Stock</button>
                        <button onClick={() => { setEditingId(null); setNewProduct({ name: "", sku: "", category: "", price: 0, quantity: 0, description: "", supplier_id: "", tax_category: "General" }); setIsProductModalOpen(true); }} className={btnPrimary}>+ Add Product</button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex-1">
                <div className="overflow-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700">SKU</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700">Name</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700">Category</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700 text-center">Tax</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700">Cost</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700">Supplier</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700 text-right">Stock</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700 text-right">Value</th>
                                <th className="py-4 px-6 border-b border-gray-200 dark:border-slate-700 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredProducts.map((p: any) => (
                                <tr key={p.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="py-3 px-6 font-mono text-gray-500 dark:text-slate-500 text-xs">{p.sku}</td>
                                    <td className="py-3 px-6 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                    <td className="py-3 px-6 text-gray-600 dark:text-slate-400">{p.category}</td>
                                    <td className="py-3 px-6 text-center"><span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">{p.tax_category} ({p.tax_rate || 18}%)</span></td>
                                    <td className="py-3 px-6 text-gray-700 dark:text-slate-300">₹{(p.price || 0).toFixed(2)}</td>
                                    <td className="py-3 px-6 text-gray-600 dark:text-slate-400">{p.supplier ? p.supplier.name : "-"}</td>
                                    <td className={`py-3 px-6 text-right font-medium ${(p.quantity || 0) < 10 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{p.quantity}</td>
                                    <td className="py-3 px-6 text-right text-gray-600 dark:text-slate-400">₹{((p.price || 0) * (p.quantity || 0)).toFixed(2)}</td>
                                    <td className="py-3 px-6 text-center">
                                        <button onClick={() => openEditModal(p)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm">Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr><td colSpan={9} className="text-center py-12 text-gray-400 dark:text-slate-500">No products found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className={modalBg}>
                    <form onSubmit={handleCreateOrEditProduct} className={modalPanel}>
                        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? "Edit Product" : "New Product"}</h2>
                            <button type="button" onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="col-span-2"><label className={labelStyle}>Product Name</label><input className={inputStyle} value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                            <div><label className={labelStyle}>SKU Code (Auto)</label><input className={inputStyle} value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} placeholder="Leave empty for auto-generation" /></div>
                            <div><label className={labelStyle}>Category</label><input className={inputStyle} value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} /></div>
                            <div><label className={labelStyle}>Tax Class</label><select className={inputStyle} value={newProduct.tax_category} onChange={e => setNewProduct({ ...newProduct, tax_category: e.target.value })}><option value="Essential">Essential (0%)</option><option value="Mass Consumption">Mass Consumption (5%)</option><option value="Standard-Low">Standard-Low (12%)</option><option value="General">General (18%)</option><option value="Electronics">Electronics (18%)</option><option value="Luxury">Luxury (28%)</option></select></div>
                            <div><label className={labelStyle}>Unit Cost (₹)</label><input type="number" className={inputStyle} value={isNaN(newProduct.price) ? "" : newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label className={labelStyle}>Initial Stock</label><input type="number" className={inputStyle} value={isNaN(newProduct.quantity) ? "" : newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })} /></div>
                            <div className="col-span-2"><label className={labelStyle}>Supplier</label><div className="flex gap-2"><select className={`flex-1 ${inputStyle}`} value={newProduct.supplier_id} onChange={e => setNewProduct({ ...newProduct, supplier_id: e.target.value })}><option value="">-- Select Supplier --</option>{suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button type="button" onClick={() => setIsSupplierModalOpen(true)} className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-700">+</button></div></div>
                            <div className="col-span-2"><label className={labelStyle}>Description</label><textarea className={`${inputStyle} h-24`} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                            <button type="submit" className={btnPrimary}>Save Product</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Supplier Modal */}
            {isSupplierModalOpen && (
                <div className={modalBg}>
                    <form onSubmit={handleCreateSupplier} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-xl shadow-2xl w-96">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Supplier</h2>
                        <div className="space-y-4">
                            <input placeholder="Company Name" className={inputStyle} value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                            <input placeholder="Contact Person" className={inputStyle} value={newSupplier.contact_person} onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                            <input placeholder="Email" className={inputStyle} value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                            <input placeholder="Phone" className={inputStyle} value={newSupplier.phone_number} onChange={e => setNewSupplier({ ...newSupplier, phone_number: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                            <button type="submit" className={btnPrimary}>Create</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stock Move Modal */}
            {isStockModalOpen && (
                <div className={modalBg}>
                    <form onSubmit={handleMoveStock} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 rounded-xl shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Move Stock</h2>
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Product</label><select className={inputStyle} required onChange={e => setStockMove({ ...stockMove, product_id: e.target.value })}><option value="">Select Product...</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            <div><label className={labelStyle}>Type</label><select className={inputStyle} onChange={e => setStockMove({ ...stockMove, movement_type: e.target.value })}><option value="in">Restock (+)</option><option value="out">Correction (-)</option></select></div>
                            <div><label className={labelStyle}>Quantity</label><input placeholder="Amount" type="number" className={inputStyle} required value={isNaN(stockMove.change_amount) || stockMove.change_amount === 0 ? "" : stockMove.change_amount} onChange={e => setStockMove({ ...stockMove, change_amount: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                            <button type="submit" className={btnPrimary}>Confirm Move</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className={modalBg}>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 rounded-xl w-full max-w-md">
                        {!uploadResult ? (
                            <>
                                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Import Products</h2>
                                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors bg-gray-50 dark:bg-slate-900/50">
                                    <input type="file" onChange={e => e.target.files && setFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={closeUpload} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                                    <button onClick={handleUpload} disabled={loading} className={btnPrimary}>{loading ? "Importing..." : "Start Import"}</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Import Complete</h3>
                                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 my-4">
                                    <p className="text-emerald-600 dark:text-emerald-400">Added: {uploadResult.added}</p>
                                    <p className="text-blue-600 dark:text-blue-400">Updated: {uploadResult.updated}</p>
                                </div>
                                <button onClick={closeUpload} className={btnPrimary + " w-full"}>Done</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function InventoryPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <InventoryContent />
        </Suspense>
    )
}