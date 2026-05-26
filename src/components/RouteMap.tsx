"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MERCADOS_COORDS } from '@/data/mercados';
import { ChevronLeft, ChevronRight, MapPin, Clock, Navigation } from 'lucide-react';

// Fix for default marker icons in Next.js/Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapProps {
  markets: string[];
  showGuidedNav?: boolean;
}

interface RoutePoint {
  nome: string;
  coord: [number, number];
}


// Calculate distance between two coordinates in km
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RouteMap({ markets, showGuidedNav = false }: RouteMapProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStop, setCurrentStop] = useState(0);
  const [isGuidedMode, setIsGuidedMode] = useState(showGuidedNav);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsGuidedMode(showGuidedNav);
  }, [showGuidedNav]);

  useEffect(() => {
    if (!mounted || !isGuidedMode) return;
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada no seu navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        setLocationError(null);
        setCurrentStop(0);
      },
      () => {
        setLocationError('Não foi possível obter a localização atual. Verifique permissões ou tente novamente.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [isGuidedMode, mounted]);

  if (!mounted) return <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-3xl" />;

  const allMarketPoints: RoutePoint[] = Object.entries(MERCADOS_COORDS).map(([nome, coord]) => ({ nome, coord }));

  // Map markets to their coordinates, skipping unknowns
  const routePoints: RoutePoint[] = markets
    .map((m) => ({ nome: m, coord: MERCADOS_COORDS[m] }))
    .filter((m) => m.coord !== undefined);

  const highlightedNames = new Set(routePoints.map((point) => point.nome));
  const otherMarketPoints = allMarketPoints.filter((point) => !highlightedNames.has(point.nome));

  const routeCoordinates = routePoints.map((p) => p.coord);
  const guidedRouteCoordinates = currentLocation ? [currentLocation, ...routeCoordinates] : routeCoordinates;
  const center: [number, number] = currentLocation ?? (routeCoordinates.length > 0 ? routeCoordinates[0] : [-25.965, 32.575]);
  const bounds = currentLocation
    ? [...allMarketPoints.map((p) => p.coord), currentLocation]
    : allMarketPoints.map((p) => p.coord);
  const nextStop = currentStop < routePoints.length - 1 ? currentStop + 1 : null;
  const distanceToNext = isGuidedMode && currentStop === 0 && currentLocation
    ? calculateDistance(currentLocation, routePoints[0].coord)
    : nextStop !== null
    ? calculateDistance(routePoints[currentStop].coord, routePoints[nextStop].coord)
    : null;

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-md border border-gray-200">
      {isGuidedMode && (
        <>
          <div className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation size={24} className="animate-pulse" />
              <div>
                <p className="font-bold text-lg">Navegação Guiada Ativa</p>
                <p className="text-sm text-green-100">Siga as instruções para completar a sua rota</p>
              </div>
            </div>
            <button
              onClick={() => setIsGuidedMode(false)}
              className="text-green-100 hover:text-white font-semibold text-sm bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </div>
          {locationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 text-sm">
              {locationError}
            </div>
          )}
        </>
      )}
      <div className="flex flex-col lg:flex-row gap-0 h-auto lg:h-[600px]">
        {/* Map */}
        <div className="w-full lg:flex-1 h-[400px] lg:h-full">
          <MapContainer
            center={center}
            zoom={12}
            bounds={bounds}
            boundsOptions={{ padding: [40, 40] }}
            scrollWheelZoom={false}
            className="w-full h-full z-0 relative"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors — Maputo mercados e supermercados'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {otherMarketPoints.map((point) => (
              <Marker key={point.nome} position={point.coord}>
                <Popup>
                  <div className="font-bold text-gray-900">{point.nome}</div>
                  <div className="text-xs text-gray-500">Mercado/Supermercado de Maputo</div>
                </Popup>
              </Marker>
            ))}

            {currentLocation && isGuidedMode && (
              <Marker
                position={currentLocation}
                icon={L.divIcon({
                  className: 'current-location-icon',
                  html: '<div style="background-color:#1d4ed8;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;box-shadow:0 0 0 4px rgba(59,130,246,0.2);">V</div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>
                  <div className="font-bold text-gray-900">Você está aqui</div>
                  <div className="text-xs text-gray-500">Início da navegação</div>
                </Popup>
              </Marker>
            )}

            {routePoints.map((point, index) => {
              const isCurrentStop = index === currentStop;
              const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${isCurrentStop ? '#dc2626' : '#15803d'}; color: white; border-radius: 50%; width: ${isCurrentStop ? '36' : '28'}px; height: ${isCurrentStop ? '36' : '28'}px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 14px; transition: all 0.2s;">${index + 1}</div>`,
                iconSize: [isCurrentStop ? 36 : 28, isCurrentStop ? 36 : 28],
                iconAnchor: [isCurrentStop ? 18 : 14, isCurrentStop ? 18 : 14]
              });

              return (
                <Marker 
                  key={point.nome} 
                  position={point.coord} 
                  icon={customIcon}
                  eventHandlers={{
                    click: () => setCurrentStop(index),
                  }}
                >
                  <Popup>
                    <div className="font-bold text-gray-900">{point.nome}</div>
                    <div className="text-xs text-gray-500">Paragem {index + 1}</div>
                  </Popup>
                </Marker>
              );
            })}

            {(guidedRouteCoordinates.length > 1) && (
              <Polyline 
                positions={guidedRouteCoordinates} 
                pathOptions={{ color: '#15803d', weight: 4, dashArray: '8, 8' }} 
              />
            )}
          </MapContainer>
        </div>

        {/* Sidebar - Route Details */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto flex flex-col">
          {/* Current Stop Info */}
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-sm">
                  {currentStop + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{routePoints[currentStop].nome}</h3>
              </div>
              <p className="text-xs text-gray-500">Paragem {currentStop + 1} de {routePoints.length}</p>
            </div>

            {distanceToNext !== null && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <p className="text-xs text-blue-900 font-semibold flex items-center gap-2">
                  <Navigation size={14} />
                  {isGuidedMode && currentStop === 0 && currentLocation
                    ? `Primeira paragem: ${distanceToNext.toFixed(1)} km`
                    : `Próxima paragem: ${distanceToNext.toFixed(1)} km`}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStop(Math.max(0, currentStop - 1))}
                disabled={currentStop === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm text-gray-900 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              <button
                onClick={() => setCurrentStop(Math.min(routePoints.length - 1, currentStop + 1))}
                disabled={currentStop === routePoints.length - 1}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-800 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm text-white transition-colors"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* All Stops List */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Todas as Paragens</p>
            <div className="space-y-2">
              {routePoints.map((point, index) => (
                <button
                  key={point.nome}
                  onClick={() => setCurrentStop(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all border-2 ${
                    index === currentStop
                      ? 'bg-red-50 border-red-600 shadow-sm'
                      : 'bg-gray-50 border-gray-200 hover:border-green-800 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs mt-0.5 flex-shrink-0 ${
                      index === currentStop 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-300 text-gray-900'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${
                        index === currentStop ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {point.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {index < routePoints.length - 1 && (
                          <>
                            {calculateDistance(point.coord, routePoints[index + 1].coord).toFixed(1)} km até próxima
                          </>
                        )}
                        {index === routePoints.length - 1 && 'Última paragem'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Route Summary */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <p className="text-xs text-gray-600 mb-2">Distância total</p>
            <p className="text-2xl font-bold text-green-800">
              {guidedRouteCoordinates.length > 1
                ? guidedRouteCoordinates.reduce((sum, coord, i) =>
                    i === 0 ? sum : sum + calculateDistance(guidedRouteCoordinates[i - 1], coord), 0
                  ).toFixed(1)
                : '0'} km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
