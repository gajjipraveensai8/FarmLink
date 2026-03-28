import React from "react";

export default function FarmerProducts({ products, getUnit, handleDelete, setShowAddForm }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.length === 0 ? (
                <div className="col-span-full bg-white rounded-[3rem] p-32 text-center border border-slate-100 shadow-sm">
                    <div className="text-7xl mb-8 opacity-40">🚜</div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Empty Granary</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10">You haven't listed any products yet. Take the first step by listing your harvest.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-10 py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-100 hover:bg-brand-700 active:scale-95"
                    >
                        Start Selling
                    </button>
                </div>
            ) : products.map(p => (
                <div key={p._id} className="card-premium p-6 group relative">
                    {p.quantity <= 0 && (
                        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                            Sold Out
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-6">
                        <span className="bg-slate-50 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-widest leading-none">
                            {p.category}
                        </span>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-slate-900 tracking-tighter">₹{p.price}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">/ {getUnit(p.category)}</span>
                        </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-6 group-hover:text-brand-600 transition-colors tracking-tight line-clamp-2 h-14 uppercase">
                        {p.name}
                    </h3>

                    <div className="flex items-center gap-4 mb-4 bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">
                            {p.category === 'vegetables' ? '🥦' : '📦'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700">{p.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">{getUnit(p.category)}</span></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ready for sale</span>
                        </div>
                    </div>

                    {p.harvestDate && (
                        <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                            <span className="text-sm">🌾</span>
                            <div>
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest block">Harvested On</span>
                                <span className="text-[11px] font-black text-green-800">
                                    {new Date(p.harvestDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button className="flex-grow py-3.5 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95">EDIT</button>
                        <button onClick={() => handleDelete(p._id)} className="px-5 py-3.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95">DELETE</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
