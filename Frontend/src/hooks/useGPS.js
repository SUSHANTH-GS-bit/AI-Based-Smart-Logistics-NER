import { useState, useEffect } from 'react';

export function useGPS(isSimulated = true) {
  const [gpsData, setGpsData] = useState({
    latitude: 26.1445,
    longitude: 91.7362,
    accuracy: 8,
    speed: 52,
    heading: 145,
    timestamp: new Date().toISOString(),
    gpsAvailable: true,
    locationName: 'Guwahati Express Highway',
  });

  useEffect(() => {
    if (!isSimulated && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 10,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 45,
            heading: position.coords.heading || 120,
            timestamp: new Date(position.timestamp).toISOString(),
            gpsAvailable: true,
            locationName: 'Live Geolocation Fix',
          });
        },
        (error) => {
          console.warn('Geolocation Error:', error.message);
          setGpsData((prev) => ({ ...prev, gpsAvailable: false }));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      // Gentle simulation movement for realistic demo experience
      const interval = setInterval(() => {
        setGpsData((prev) => {
          const deltaLat = (Math.random() - 0.5) * 0.001;
          const deltaLng = (Math.random() - 0.5) * 0.001;
          return {
            ...prev,
            latitude: Number((prev.latitude + deltaLat).toFixed(6)),
            longitude: Number((prev.longitude + deltaLng).toFixed(6)),
            timestamp: new Date().toISOString(),
          };
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isSimulated]);

  return gpsData;
}
