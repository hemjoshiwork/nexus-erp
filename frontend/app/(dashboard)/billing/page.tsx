"use client"
import { useState, useEffect } from "react"
import { Search, ShoppingCart, CreditCard } from "lucide-react"

export default function BillingPage() {
    const [products, setProducts] = useState([])
    const [cart, setCart] = useState([])
    const [customer, setCustomer] = useState({ name: "", phone_number: "", gstin: "" })
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token")
            const res = await fetch("https://nexus-erp-f8q9.onrender.com/inventory/products", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setProducts(await res.json())
        }
        fetchData()
    }, [])

    const addToCart = (product: any) => {
        const existing: any = cart.find((item: any) => item.id === product.id)
        if (existing) {
            setCart(cart.map((item: any) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item) as any)
        } else {
            setCart([...cart, { ...product, qty: 1 }] as any)
        }
    }

    const baseTotal = cart.reduce((acc: any, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.qty) || 0)), 0)
    const totalTax = cart.reduce((acc: any, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.qty) || 0) * (parseFloat(item.tax_rate) || 18) / 100), 0)
    const grandTotal = baseTotal + totalTax

    const handleCheckout = async () => {
        const validItems = cart.map((item: any) => ({ product_id: item.id, quantity: parseInt(item.qty) || 0 })).filter((item: any) => item.quantity > 0)
        if (!customer.name || validItems.length === 0) return alert("Add customer name and valid items")
        const token = localStorage.getItem("token")
        const payload = {
            customer_name: customer.name,
            customer_phone_number: customer.phone_number,
            customer_gstin: customer.gstin,
            items: validItems
        }
        const res = await fetch("https://nexus-erp-f8q9.onrender.com/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        })
        if (res.ok) {
            alert("Transaction Complete")
            setCart([])
            setCustomer({ name: "", phone_number: "", gstin: "" })
        } else {
            alert("Transaction Failed")
        }
    }

    const handleQuantityChange = (id: number, newQty: string) => {
        if (newQty === "") {
            setCart(cart.map((item: any) => item.id === id ? { ...item, qty: "" } : item) as any)
            return
        }
        const qty = parseInt(newQty)
        if (isNaN(qty) || qty < 1) return // Ignore invalid

        const product = products.find((p: any) => p.id === id) as any
        if (!product) return

        if (qty > product.quantity) {
            alert(`Only ${product.quantity} items in stock!`)
            return
        }

        setCart(cart.map((item: any) => item.id === id ? { ...item, qty: qty } : item) as any)
    }

    const inputStyle = "w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Process sales and manage invoices</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden h-full">
                {/* Product Selection */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col h-full">
                    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-600" />
                        Product Catalog
                    </h2>
                    <input
                        type="text" placeholder="Search products..."
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3 overflow-auto pr-2 pb-2">
                        {products.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p: any) => (
                            <button key={p.id} onClick={() => addToCart(p)} className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-left group">
                                <div className="font-bold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{p.name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-500 flex justify-between mt-2">
                                    <span>Qty: {p.quantity}</span>
                                    <span className="font-mono font-medium text-gray-700 dark:text-slate-300">₹{p.price}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Checkout Section */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col h-full">
                    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-indigo-600" />
                        Current Order
                    </h2>
                    <div className="space-y-3 mb-6">
                        <input placeholder="Customer Name" className={inputStyle} value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                        <input placeholder="Phone Number" className={inputStyle} value={customer.phone_number} onChange={e => setCustomer({ ...customer, phone_number: e.target.value })} />
                        <input placeholder="GSTIN (Optional)" className={inputStyle} value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} />
                    </div>

                    <div className="flex-1 max-h-[40vh] overflow-y-auto pr-2 border-t border-gray-100 dark:border-slate-800 pt-4 mb-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-400 dark:text-slate-600 italic py-10">Cart is empty</div>
                        ) : (
                            cart.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center mb-3 text-sm border-b border-gray-50 dark:border-slate-800 pb-2">
                                    <span className="text-gray-700 dark:text-slate-300 flex-1">{item.name}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400 dark:text-slate-500 text-xs">x</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.quantity} // Assuming item has max stock info, wait, item comes from product so it should have it. Actually I need to check if item in cart has 'quantity' property (stock).
                                                // When adding to cart: setCart([...cart, { ...product, qty: 1 }]) -> product has 'quantity' (stock) and we add 'qty' (cart count).
                                                // So item.quantity is stock, item.qty is cart count.
                                                value={item.qty}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                className="w-16 p-1 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        <span className="font-mono text-gray-900 dark:text-white w-20 text-right">₹{((parseFloat(item.price) || 0) * (parseInt(item.qty) || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-2 font-mono text-sm">
                        <div className="flex justify-between text-gray-500 dark:text-slate-400"><span>Subtotal</span><span>₹{baseTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-500 dark:text-slate-400 text-xs">
                            <span>CGST</span><span>₹{(totalTax / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 dark:text-slate-400 text-xs">
                            <span>SGST</span><span>₹{(totalTax / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-4 border-t border-dashed border-gray-300 dark:border-slate-700 mt-2">
                            <span>Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <button onClick={handleCheckout} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl mt-6 font-bold text-lg shadow-sm transition-all flex justify-center items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Complete Sale
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
