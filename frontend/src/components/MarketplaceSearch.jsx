import React, { useEffect, useState } from "react";

export default function MarketplaceSearch({
  onSearch,
  onUseLocation,
  geoLoading,
  initialQuery = "",
  initialRadius = "50",
}) {
  const [query, setQuery] = useState(initialQuery);
  const [radius, setRadius] = useState(initialRadius);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    setRadius(initialRadius ?? "50");
  }, [initialRadius]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, radius);
  };

  return (
    <div className="space-y-4 mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 w-full">
        <div className="relative flex-grow">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search fresh vegetables, milk, eggs..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 transition-all duration-200 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm"
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="20">Within 20 km</option>
            <option value="30">Within 30 km</option>
            <option value="50">Within 50 km</option>
          </select>

          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-700 transition-all duration-200 shadow-md shadow-brand-100 active:scale-95"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onUseLocation}
          disabled={geoLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-50 text-accent-700 text-xs font-bold border border-accent-100 hover:bg-accent-100 transition-all disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          {geoLoading ? "Getting Location..." : "Use My Location"}
        </button>
        <span className="text-[11px] text-slate-400 font-medium">Get near-me products with transparent farm distance.</span>
      </div>
    </div>
  );
}
