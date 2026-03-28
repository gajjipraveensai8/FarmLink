import React, { useState, useEffect } from "react";
import api from "../../api";
import { toast } from "react-hot-toast";

export default function FarmerReviewsInline({ farmerId }) {
    const [reviews, setReviews] = useState([]);
    const [avg, setAvg] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!farmerId) return;
        setLoading(true);
        api.get(`/api/reviews/farmer/${farmerId}`)
            .then(({ data }) => {
                setReviews(data.reviews || []);
                setAvg(data.averageRating || 0);
            })
            .catch((err) => { toast.error(err.response?.data?.message || "Failed to load reviews"); })
            .finally(() => setLoading(false));
    }, [farmerId]);

    if (loading) return <p className="text-xs text-slate-400 py-2">Loading reviews…</p>;
    if (reviews.length === 0) return <p className="text-xs text-slate-400 py-2 italic">No reviews yet for this farmer.</p>;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 font-black text-base">★</span>
                <span className="text-sm font-black text-slate-800">{avg.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
            {reviews.map((r) => (
                <div key={r._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">{r.buyer?.name || 'Buyer'}</span>
                        <span className="text-[10px] text-slate-300 font-medium">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-sm ${i < r.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                        ))}
                    </div>
                    {r.comment && <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>}
                    {r.farmerReply && (
                        <div className="mt-2 pl-3 border-l-2 border-brand-200">
                            <p className="text-[10px] font-black text-brand-600 uppercase tracking-wide">Farmer's Reply</p>
                            <p className="text-xs text-slate-500">{r.farmerReply}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
