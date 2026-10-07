'use client';

import 'leaflet/dist/leaflet.css';

import type { MapLocation } from 'src/models/analytics';

import { Tooltip, TileLayer, MapContainer, CircleMarker } from 'react-leaflet';

import { formatScore, formatNumber } from 'src/utils/format';

/** Peta sebaran peserta per wilayah. Ukuran lingkaran = peserta; warna = di atas/bawah rata-rata. */
export default function RegionalMap({
  locations,
  average,
}: {
  locations: MapLocation[];
  average: number;
}) {
  const maxParticipants = Math.max(1, ...locations.map((l) => l.participants));
  return (
    <MapContainer
      center={[-6.9, 109.4]}
      zoom={6}
      scrollWheelZoom={false}
      className="h-[360px] w-full rounded-xl"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((l) => {
        const above = l.average >= average;
        const color = above ? '#1a8a55' : '#c4472a';
        return (
          <CircleMarker
            key={l.name}
            center={[l.lat, l.lng]}
            radius={10 + (l.participants / maxParticipants) * 18}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.75 }}
          >
            <Tooltip>
              <strong>{l.name}</strong>
              <br />
              Rata-rata {formatScore(l.average)} ({above ? 'di atas' : 'di bawah'} rata-rata)
              <br />
              {formatNumber(l.participants)} peserta · {formatNumber(l.schools)} sekolah
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
