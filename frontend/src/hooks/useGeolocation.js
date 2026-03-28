import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

export function useGeolocation() {
  const [lng, setLng] = useState(null);
  const [lat, setLat] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const requestLocation = useCallback((onSuccess) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      setGeoLoading(false);
      toast.error("Location request timed out. Using default location.");
      // Default fallback location
      const fallbackLng = "77.5946";
      const fallbackLat = "12.9716";
      setLng(fallbackLng);
      setLat(fallbackLat);
      if (onSuccess) onSuccess({ lng: fallbackLng, lat: fallbackLat });
    }, 5000); // 5 second timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        const nextLng = Number(position.coords.longitude).toFixed(6);
        const nextLat = Number(position.coords.latitude).toFixed(6);
        setLng(nextLng);
        setLat(nextLat);
        setGeoLoading(false);
        if (onSuccess) onSuccess({ lng: nextLng, lat: nextLat });
      },
      () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        setGeoLoading(false);
        toast.error("Unable to fetch your location");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLng(null);
    setLat(null);
  }, []);

  return {
    lng,
    setLng,
    lat,
    setLat,
    geoLoading,
    requestLocation,
    clearLocation
  };
}
