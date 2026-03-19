import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";

function LocationMarker({ setLocation }) {

  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLocation(e.latlng);
    }
  });

  return position === null ? null : <Marker position={position} />;
}

export default function LocationMap({ setLocation }) {

  return (
    <MapContainer center={[52.1332, -106.6700]} zoom={13} style={{height:"300px"}}>

      <TileLayer
        attribution='OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker setLocation={setLocation}/>

    </MapContainer>
  );
}