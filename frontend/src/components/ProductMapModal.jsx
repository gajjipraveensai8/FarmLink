import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Fix default marker icons (Leaflet + bundlers issue) ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const farmerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const buyerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* ── Auto-fit bounds when both markers present ── */
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, bounds]);
  return null;
}

export default function ProductMapModal({
  isOpen,
  onClose,
  farmerCoords,   // [lng, lat]
  farmerName,
  productName,
  buyerLng,       // string | undefined
  buyerLat,       // string | undefined
}) {
  /* prevent background scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCoords =
    Array.isArray(farmerCoords) &&
    farmerCoords.length === 2 &&
    farmerCoords.every(Number.isFinite);

  if (!hasCoords) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}>
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-700 font-semibold">Location not available</p>
          <p className="text-gray-400 text-sm mt-1">This product has no coordinates set.</p>
          <button onClick={onClose}
            className="mt-5 rounded-xl bg-gray-100 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all duration-200">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Leaflet uses [lat, lng]
  const farmerPos = [farmerCoords[1], farmerCoords[0]];

  const hasBuyer = buyerLng && buyerLat;
  const buyerPos = hasBuyer
    ? [parseFloat(buyerLat), parseFloat(buyerLng)]
    : null;

  const bounds = hasBuyer
    ? L.latLngBounds([farmerPos, buyerPos])
    : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 text-base">{productName || "Product Location"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {farmerName ? `Sold by ${farmerName}` : "Farmer location"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-gray-500
                       transition-all duration-200 hover:scale-110 active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* map */}
        <div className="h-[350px] w-full">
          <MapContainer
            center={farmerPos}
            zoom={hasBuyer ? 10 : 13}
            scrollWheelZoom={true}
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {bounds && <FitBounds bounds={bounds} />}

            <Marker position={farmerPos} icon={farmerIcon}>
              <Popup>
                <span className="font-semibold">🌾 {farmerName || "Farmer"}</span>
                <br />
                <span className="text-xs text-gray-500">{productName}</span>
              </Popup>
            </Marker>

            {buyerPos && (
              <Marker position={buyerPos} icon={buyerIcon}>
                <Popup>
                  <span className="font-semibold">📍 Your Location</span>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/80">
          <p className="text-xs text-gray-400">
            {farmerCoords[1].toFixed(4)}°N, {farmerCoords[0].toFixed(4)}°E
          </p>
          {hasBuyer && (
            <p className="text-xs text-blue-500 font-medium">Your location shown</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
