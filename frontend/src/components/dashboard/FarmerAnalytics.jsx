import React from "react";

export default function FarmerAnalytics({ insights }) {
    return (
        <div className="space-y-10 animate-fade-in">
            {/* Summary strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Avg Rating", value: insights.rating.total > 0 ? `⭐ ${insights.rating.average}` : "No ratings", sub: `${insights.rating.total} review${insights.rating.total !== 1 ? 's' : ''}` },
                    { label: "Top Product", value: insights.topProducts[0]?.productName || "—", sub: insights.topProducts[0] ? `${insights.topProducts[0].totalSold} units sold` : "No data yet" },
                    { label: "Repeat Buyers", value: insights.repeatBuyers.length, sub: "ordered 2+ times" },
                    { label: "Active Days", value: insights.demandTrends.length, sub: "in last 30 days" },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-premium">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight truncate">{s.value}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{s.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top selling products */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">🏆 Top Selling Products</h3>
                    {insights.topProducts.length === 0 ? (
                        <div className="py-10 text-center">
                            <span className="text-4xl opacity-30">📦</span>
                            <p className="text-slate-400 text-sm mt-3">No sales data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {insights.topProducts.slice(0, 5).map((p, i) => {
                                const maxSold = insights.topProducts[0]?.totalSold || 1;
                                const pct = Math.round((p.totalSold / maxSold) * 100);
                                return (
                                    <div key={p._id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-black border border-brand-100">{i + 1}</span>
                                                <span className="text-sm font-bold text-slate-700 truncate max-w-[160px]">{p.productName}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-slate-900">{p.totalSold} <span className="text-[9px] text-slate-400 font-bold">units</span></span>
                                                <span className="ml-2 text-xs font-bold text-brand-600">₹{p.totalRevenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div className="bg-gradient-to-r from-brand-500 to-brand-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Category breakdown */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">📊 Revenue by Category</h3>
                    {insights.categoryBreakdown.length === 0 ? (
                        <div className="py-10 text-center">
                            <span className="text-4xl opacity-30">📊</span>
                            <p className="text-slate-400 text-sm mt-3">No category data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {(() => {
                                const maxRev = insights.categoryBreakdown[0]?.revenue || 1;
                                const catEmoji = { vegetables: '🥦', fruits: '🍎', milk: '🥛', eggs: '🥚', other: '📦' };
                                const catColors = [
                                    'from-brand-500 to-brand-400',
                                    'from-accent-500 to-accent-400',
                                    'from-blue-500 to-blue-400',
                                    'from-purple-500 to-purple-400',
                                    'from-rose-500 to-rose-400',
                                ];
                                return insights.categoryBreakdown.map((c, i) => (
                                    <div key={c._id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{catEmoji[c._id] || '📦'}</span>
                                                <span className="text-sm font-bold text-slate-700 capitalize">{c._id}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 font-bold">{c.totalSold} units</span>
                                                <span className="text-sm font-black text-slate-900">₹{c.revenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className={`bg-gradient-to-r ${catColors[i % catColors.length]} h-2 rounded-full transition-all duration-700`}
                                                style={{ width: `${Math.round((c.revenue / maxRev) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}
                </div>

                {/* Demand Trends: last 30 days */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">📈 Demand Trends (Last 30 Days)</h3>
                    {insights.demandTrends.length === 0 ? (
                        <div className="py-10 text-center">
                            <span className="text-4xl opacity-30">📈</span>
                            <p className="text-slate-400 text-sm mt-3">No orders in the last 30 days</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-end gap-1 h-24">
                                {(() => {
                                    const maxR = Math.max(...insights.demandTrends.map(d => d.revenue), 1);
                                    return insights.demandTrends.map((d, i) => (
                                        <div key={i} className="flex-1 group relative flex flex-col justify-end items-center">
                                            <div
                                                className="w-full rounded-t-md bg-brand-400 group-hover:bg-brand-500 transition-colors"
                                                style={{ height: `${Math.max(8, (d.revenue / maxR) * 88)}px` }}
                                            />
                                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                                                <div className="bg-slate-900 text-white text-[9px] font-bold rounded-lg px-2 py-1 whitespace-nowrap">
                                                    {d.date.slice(5)} · ₹{d.revenue.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-300 font-bold">
                                <span>{insights.demandTrends[0]?.date?.slice(5)}</span>
                                <span>{insights.demandTrends[insights.demandTrends.length - 1]?.date?.slice(5)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-2">
                                {[
                                    { label: 'Total Revenue', value: `₹${insights.demandTrends.reduce((s, d) => s + d.revenue, 0).toLocaleString()}` },
                                    { label: 'Orders', value: insights.demandTrends.reduce((s, d) => s + d.orders, 0) },
                                    { label: 'Units Sold', value: insights.demandTrends.reduce((s, d) => s + d.unitsSold, 0) },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                                        <p className="text-base font-black text-slate-900 mt-0.5">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Repeat Buyers */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">💚 Loyal Buyers</h3>
                    {insights.repeatBuyers.length === 0 ? (
                        <div className="py-10 text-center">
                            <span className="text-4xl opacity-30">🤝</span>
                            <p className="text-slate-400 text-sm mt-3">No repeat buyers yet — keep selling!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {insights.repeatBuyers.map((b, i) => (
                                <div key={b._id} className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-black">
                                            {b.buyerName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{b.buyerName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{b.buyerEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-xl">{b.orderCount} orders</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
