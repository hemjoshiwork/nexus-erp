"use client";
import { useState } from "react";

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (!isOpen) return null;

    const handleUpload = async () => {
        if (!file) return alert("Please select a file");
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token");
        try {
            const res = await fetch("https://nexus-erp-f8q9.onrender.com/inventory/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            setResult(data);
            if (data.added > 0) onSuccess();
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">Bulk Upload Products</h2>
                {!result ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">Columns: Name, SKU, Category, Price, Quantity, Supplier, Supplier Contact, Supplier Email, Supplier Phone</p>
                        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={onClose} className="text-gray-500">Cancel</button>
                            <button onClick={handleUpload} disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded">
                                {uploading ? "Uploading..." : "Upload Unlimited"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="text-3xl">✅</div>
                        <h3 className="font-bold">Upload Complete</h3>
                        <p>Added: {result.added} products</p>
                        <p>Skipped: {result.skipped}</p>
                        <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
