import React, { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../api";
import { CATEGORIES } from "../../utils/constants";
import { useProductStore } from "../../store/productStore";
import { useGeolocation } from "../../hooks/useGeolocation";

export default function AddProductModal({ showAddForm, setShowAddForm, getUnit, fetchData }) {
    const [formLoading, setFormLoading] = useState(false);
    const { geoLoading, requestLocation } = useGeolocation();
    const [form, setForm] = useState({
        name: "", price: "", quantity: "", category: "vegetables",
        harvestDate: new Date().toISOString().split('T')[0],
        freshnessExpiryDays: "3",
        coordinates: null,
        imageUrl: ""
    });

    if (!showAddForm) return null;

    const handleGetLocation = () => {
        requestLocation((coords) => {
            setForm(prev => ({ ...prev, coordinates: [coords.lng, coords.lat] }));
            toast.success("Location captured!");
        });
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!form.coordinates) return toast.error("Please add farm location");
        setFormLoading(true);
        try {
            const res = await api.post("/api/products", {
                ...form,
                price: Number(form.price),
                quantity: Number(form.quantity),
                freshnessExpiryDays: Number(form.freshnessExpiryDays)
            });
            if (res?.data?.success) {
                toast.success("Product listed successfully!");
                setForm({
                    name: "", price: "", quantity: "", category: "vegetables",
                    harvestDate: new Date().toISOString().split('T')[0],
                    freshnessExpiryDays: "3",
                    coordinates: form.coordinates,
                    imageUrl: ""
                });
                setShowAddForm(false);
                
                // Refresh global state correctly
                useProductStore.getState().fetchProducts();
                if (fetchData) fetchData();
            }
        } catch (err) {
            if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
            toast.error(err.response?.data?.message || "Listing failed");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-lg">
                    <div className="h-full flex flex-col bg-white shadow-2xl rounded-l-[3rem] overflow-hidden border-l border-slate-100">
                        <div className="p-12 flex flex-col h-full overflow-y-auto">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">New <span className="text-brand-600">Harvest</span></h2>
                                    <p className="text-sm font-medium text-slate-400 mt-1">List your fresh produce in the marketplace</p>
                                </div>
                                <button onClick={() => setShowAddForm(false)} className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all font-bold text-slate-400 shadow-sm border border-slate-100">✕</button>
                            </div>

                            <form onSubmit={handleAddProduct} className="flex-grow space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Produce Category</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setForm({ ...form, category: cat.id })}
                                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2 ${form.category === cat.id
                                                    ? 'bg-brand-50 shadow-md border-brand-500 text-brand-700'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-brand-200 hover:text-brand-600'
                                                    }`}
                                            >
                                                <span className="text-xl">{cat.img}</span>
                                                {cat.label.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Produce Name</label>
                                    <input
                                        type="text" required value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Heirloom Organic Tomatoes"
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold placeholder:text-slate-300 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Image URL <span className="text-slate-300 normal-case">(optional)</span></label>
                                    <input
                                        type="url"
                                        value={form.imageUrl}
                                        onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold placeholder:text-slate-300 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none transition-all"
                                    />
                                    {form.imageUrl && (
                                        <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                                            <img src={form.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-brand-200" onError={(e) => { e.target.style.display = 'none'; }} />
                                            <span className="text-xs font-bold text-brand-700">Image preview</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                                        <input
                                            type="number" required value={form.price}
                                            onChange={e => setForm({ ...form, price: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4 relative">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                        <input
                                            type="number" required value={form.quantity}
                                            onChange={e => setForm({ ...form, quantity: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none transition-all"
                                        />
                                        <span className="absolute right-4 bottom-4 text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-brand-200">{getUnit(form.category)}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Date of Harvest
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.harvestDate}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm({ ...form, harvestDate: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50 focus:outline-none transition-all"
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 ml-1">📅 When was this produce harvested?</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={geoLoading}
                                        className={`w-full py-8 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.98] ${form.coordinates
                                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-lg'
                                            : 'border-slate-200 text-slate-400 hover:border-brand-400 hover:bg-brand-50/30 hover:text-brand-600'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${form.coordinates ? 'bg-brand-500 text-white scale-110' : 'bg-slate-100'}`}>
                                            {form.coordinates ? "✓" : "📍"}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest">
                                            {geoLoading ? "Capturing Location..." : form.coordinates ? "FARM LOCATION SAVED" : "TAP TO ADD FARM LOCATION"}
                                        </span>
                                    </button>
                                </div>

                                <div className="pt-8">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-black text-lg tracking-tight shadow-xl shadow-brand-100 hover:bg-brand-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {formLoading ? "PUBLISHING..." : "LIST PRODUCE NOW"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
