'use client';

import { useState } from 'react';
import api from '../lib/api';

interface MoveStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MoveStockModal({ isOpen, onClose, onSuccess }: MoveStockModalProps) {
    const [productId, setProductId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [type, setType] = useState('IN');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let qty = parseInt(quantity);
            if (type === 'OUT') qty = -qty;

            await api.post('/inventory/movements', {
                product_id: parseInt(productId),
                warehouse_id: parseInt(warehouseId),
                quantity_change: qty,
                movement_type: type
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            if (err.response && err.response.status === 400) {
                setError(err.response.data.detail || 'Insufficient stock or invalid request');
            } else {
                setError('Failed to move stock');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Move Stock</h2>

                {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-black bg-white"
                            >
                                <option value="IN">IN (Add)</option>
                                <option value="OUT">OUT (Remove)</option>
                                <option value="ADJUSTMENT">ADJUSTMENT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-black bg-white"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Product ID</label>
                        <input
                            type="number"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
                            required
                            placeholder="Product ID (e.g. 1)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse ID</label>
                        <input
                            type="number"
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
                            required
                            placeholder="Warehouse ID (e.g. 1)"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Confirm Move'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
