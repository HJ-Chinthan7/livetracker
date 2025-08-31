import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LiveMap = () => {
  const [userMarkers, setUserMarkers] = useState({});
  const [currentPosition, setCurrentPosition] = useState([0, 0]);
  const socket = useRef(null);

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    socket.current = io(backendUrl);

    navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      setCurrentPosition([latitude, longitude]);
      socket.current.emit("send-Location", { latitude, longitude });
    },
  (error) => {
    console.error("Geolocation error:", error);
  },
  {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 1000
  });

    socket.current.on("receive-location", (data) => {
      setUserMarkers((prevMarkers) => ({
        ...prevMarkers,
        [data.id]: [data.latitude, data.longitude],
      }));
    });

    socket.current.on("user-disconnected", (id) => {
      setUserMarkers((prevMarkers) => {
        const newMarkers = { ...prevMarkers };
        delete newMarkers[id];
        return newMarkers;
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Auto-center map when position changes
  const mapRef = useRef();
  
  useEffect(() => {
    if (mapRef.current && currentPosition[0] !== 0 && currentPosition[1] !== 0) {
      mapRef.current.setView(currentPosition, 13);
    }
  }, [currentPosition]);

  return (
    <MapContainer 
      center={currentPosition} 
      zoom={5} 
      style={{ height: "100vh", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      {Object.entries(userMarkers).map(([id, position]) => (
        <Marker key={id} position={position}>
          <Popup>User ID: {id}</Popup>
        </Marker>
      ))}
      <Marker position={currentPosition}>
        <Popup>You are here</Popup>
      </Marker>
    </MapContainer>
  );
};

export default LiveMap;
