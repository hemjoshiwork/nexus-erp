"use client";
import { useState, useEffect } from "react";

export default function CreateProductModal({ isOpen, onClose, onSuccess }: any) {
    const [form, setForm] = useState({ name: "", sku: "", category: "", price: "", quantity: "0", supplier_id: "" });
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isNewSupplierMode, setIsNewSupplierMode] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: "", contact_person: "", email: "", phone: "", supplied_product: "" });

    // --- SAFE DATA FETCHING ---
    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8000/suppliers", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSuppliers(Array.isArray(data) ? data : []);
            } else {
                console.warn("Could not fetch suppliers (Server might be busy)");
                setSuppliers([]);
            }
        } catch (error) {
            console.error("Backend offline or network error:", error);
            setSuppliers([]); // Prevent crash
        }
    };

    useEffect(() => {
        if (isOpen) fetchSuppliers();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        let finalSupplierId = form.supplier_id;

        try {
            // 1. If adding a new supplier first
            if (isNewSupplierMode) {
                // Validation
                if (!/^[A-Za-z\s]+$/.test(newSupplier.name)) return alert("Supplier Name: Letters only.");
                if (!newSupplier.email.endsWith("@gmail.com")) return alert("Email: Must be @gmail.com");
                if (!/^\d{10}$/.test(newSupplier.phone)) return alert("Phone: Must be 10 digits.");

                const supRes = await fetch("http://localhost:8000/suppliers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(newSupplier),
                });

                if (!supRes.ok) throw new Error("Failed to create supplier");
                const savedSupplier = await supRes.json();
                finalSupplierId = savedSupplier.id.toString();
            }

            // 2. Create Product
            const payload: any = {
                ...form,
                price: parseFloat(form.price),
                quantity: parseInt(form.quantity),
                supplier_id: finalSupplierId ? parseInt(finalSupplierId) : null
            };

            const prodRes = await fetch("http://localhost:8000/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!prodRes.ok) throw new Error("Failed to create product");

            // Reset & Close
            setIsNewSupplierMode(false);
            setNewSupplier({ name: "", contact_person: "", email: "", phone: "", supplied_product: "" });
            setForm({ name: "", sku: "", category: "", price: "", quantity: "0", supplier_id: "" });
            onSuccess();
            onClose();

        } catch (error) {
            alert("Error saving: Check if Backend is running!");
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
            <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Create New Product</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input placeholder="Product Name" required className="w-full p-2 border rounded" onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input placeholder="SKU" required className="w-full p-2 border rounded" onChange={e => setForm({ ...form, sku: e.target.value })} />
                    <input placeholder="Category" required className="w-full p-2 border rounded" onChange={e => setForm({ ...form, category: e.target.value })} />

                    {/* Supplier Section */}
                    <div className="border p-3 rounded bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-gray-700">Supplier</label>
                            <button type="button" onClick={() => setIsNewSupplierMode(!isNewSupplierMode)} className="text-xs text-blue-600 hover:underline">
                                {isNewSupplierMode ? "Select Existing" : "+ Add New"}
                            </button>
                        </div>

                        {!isNewSupplierMode ? (
                            <select className="w-full p-2 border rounded" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                                <option value="">-- Select Supplier --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        ) : (
                            <div className="space-y-2 animate-fadeIn">
                                <input placeholder="New Supplier Name" required className="w-full p-2 border rounded text-sm" onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                                <input placeholder="Contact Person" required className="w-full p-2 border rounded text-sm" onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                                <input placeholder="Email (@gmail.com)" required className="w-full p-2 border rounded text-sm" onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                                <input placeholder="Phone (10 digits)" required maxLength={10} className="w-full p-2 border rounded text-sm" onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input type="number" placeholder="Price (₹)" required className="w-1/2 p-2 border rounded" onChange={e => setForm({ ...form, price: e.target.value })} />
                        <input type="number" placeholder="Qty" required className="w-1/2 p-2 border rounded" defaultValue="0" onChange={e => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="text-gray-500">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                            {isNewSupplierMode ? "Save Supplier & Product" : "Create Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
