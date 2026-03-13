"use client"
import { X, Printer, Download } from "lucide-react"
import { useEffect, useState } from "react"

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: number | null
}

export default function InvoiceModal({ isOpen, onClose, saleId }: InvoiceModalProps) {
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && saleId) {
      const fetchInvoice = async () => {
        setLoading(true)
        try {
          const token = localStorage.getItem("token")
          const res = await fetch(`https://nexus-erp-f8q9.onrender.com/sales/${saleId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            setSale(await res.json())
          }
        } catch (error) {
          console.error("Failed to fetch invoice:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchInvoice()
    }
  }, [isOpen, saleId])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
        {/* Header - Buttons */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Download PDF
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-auto p-8 bg-white text-gray-900 printable-area">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : sale ? (
            <div id="printable-area" className="max-w-3xl mx-auto space-y-8">
              {/* Business Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black tracking-tighter text-indigo-600">NEXUS ERP</h1>
                  <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Tax Invoice / Bill of Supply</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-900">Nexus ERP Solutions</h2>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500 uppercase font-bold text-xs tracking-wider">Bill To:</p>
                  <p className="text-xl font-bold">{sale.customer_name}</p>
                  <p className="text-gray-600 italic">{sale.customer_phone_number || "No Contact Provided"}</p>
                  {sale.customer_gstin && (
                    <p className="font-bold text-indigo-600">GSTIN: {sale.customer_gstin}</p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-gray-500 uppercase font-bold text-xs tracking-wider">Invoice Number</p>
                    <p className="text-lg font-mono font-bold text-indigo-600">{sale.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase font-bold text-xs tracking-wider">Date</p>
                    <p className="text-lg font-bold">{new Date(sale.timestamp).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Tax (%)</th>
                      <th className="py-3 px-4 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 font-medium">{item.product_name}</td>
                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">₹{item.unit_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-gray-500">{item.tax_rate}%</td>
                        <td className="py-3 px-4 text-right font-bold">₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{(sale.total_amount - sale.tax_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST)</span>
                    <span>₹{sale.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black border-t-2 border-gray-800 pt-3 text-indigo-600">
                    <span>Grand Total</span>
                    <span>₹{sale.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-12 text-center space-y-4">
                <p className="text-gray-400 text-xs italic">This is a computer generated invoice and does not require a signature.</p>
                <div className="bg-indigo-50 p-6 rounded-xl">
                  <p className="text-indigo-900 font-bold text-lg">Thank you for your business!</p>
                  <p className="text-indigo-600 text-sm">Nexus ERP - Building the Future of Commerce</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Error loading invoice data.</div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { 
            visibility: hidden !important; 
          }
          #printable-area, #printable-area * { 
            visibility: visible !important; 
          }
          #printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          button { 
            display: none !important; 
          }
        }
      `}</style>
    </div>
  )
}
