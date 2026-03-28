import React from "react";
import { toast } from "react-hot-toast";

const MapPin = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);


export default function ProductCard({ product, onAddToCart, isBuyer, isLoggedIn }) {
    const {
        _id,
        name,
        price,
        quantity,
        category,
        freshnessStatus,
        distanceInKm,
        farmer,
        avgRating,
        reviewCount,
        imageUrl,
        harvestDate,
    } = product;

    const formattedPrice = new Intl.NumberFormat("en-IN").format(Number(price || 0));

    // Blinkit Category Unit Map
    const getUnit = (cat) => {
        switch (cat?.toLowerCase()) {
            case "vegetables": case "fruits": return "kg";
            case "milk": return "litre";
            case "eggs": return "unit";
            default: return "unit";
        }
    };

    // Humanize Harvest Date
    const getFreshnessText = (dateString) => {
        if (!dateString) return "Freshly Picked";
        
        const harvest = new Date(dateString);
        harvest.setHours(0, 0, 0, 0); // Normalize to midnight
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - harvest);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return "Harvested Today";
        if (diffDays === 1) return "Harvested Yesterday";
        return `Harvested ${diffDays} days ago`;
    };

    const getStockLabel = (qty, cat) => {
        if (qty <= 0) return "Out of stock";
        if (qty <= 3) return `Only ${qty} ${getUnit(cat)} left`;
        return `${qty} ${getUnit(cat)} available`;
    };

    const freshnessTone = freshnessStatus === "Fresh" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600";

    return (
        <div className="card-premium p-4 flex flex-col h-full group">

            {/* Image — show real photo if available, else category emoji */}
            <div className="aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-brand-50/50 transition-colors duration-500">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className="text-6xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 select-none w-full h-full flex items-center justify-center"
                    style={{ display: imageUrl ? 'none' : 'flex' }}
                >
                    {category === 'vegetables' ? '🥦' : category === 'fruits' ? '🍎' : category === 'milk' ? '🥛' : category === 'eggs' ? '🥚' : '📦'}
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-sm border border-slate-100">
                    {quantity > 0 ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-600 tracking-tight">{getFreshnessText(harvestDate)}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Sold Out</span>
                        </>
                    )}
                </div>

                {freshnessStatus ? (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${freshnessTone}`}>
                        {freshnessStatus}
                    </div>
                ) : null}

                {/* Distance Badge */}
                {distanceInKm && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/5 backdrop-blur-sm text-[9px] font-black text-slate-700 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {distanceInKm}km
                    </div>
                )}
            </div>

            <div className="flex flex-col flex-grow">
                {/* Product Name & Source */}
                <div className="mb-3">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug h-10 group-hover:text-brand-700 transition-colors">
                        {name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">By {farmer?.name || "Local Farmer"}</p>
                    {reviewCount > 0 && (
                        <div className="flex items-center gap-1 mt-1" aria-label={`${avgRating} out of 5 stars from ${reviewCount} reviews`}>
                            <span className="text-amber-400 text-[10px]">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                            <span className="text-[9px] text-slate-400 font-medium">({reviewCount})</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50 flex items-end justify-between gap-2">
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-900 leading-none tracking-tight">₹{formattedPrice}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{getStockLabel(quantity, category)}</span>
                    </div>

                    <button
                        onClick={() => {
                            if (!isBuyer) {
                                toast("Please login to add items to cart 🔒", {
                                    icon: '🛒',
                                    style: { borderRadius: '12px', fontWeight: 'bold' }
                                });
                                return;
                            }
                            if (quantity > 0) onAddToCart(product, 1);
                        }}
                        disabled={isBuyer && quantity <= 0}
                        aria-label={!isBuyer ? "Login to add to cart" : quantity > 0 ? `Add ${name} to cart` : `${name} is sold out`}
                        className={`px-5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all shadow-md active:scale-90 group/btn ${isBuyer && quantity > 0
                            ? "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-100"
                            : isBuyer && quantity <= 0
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"
                                : "bg-accent-500 hover:bg-accent-600 text-white shadow-accent-100"
                            }`}
                    >
                        {!isBuyer ? "Login" : quantity > 0 ? "Add" : "Sold"}
                    </button>
                </div>
            </div>
        </div>
    );
}
