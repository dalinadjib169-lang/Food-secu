import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Product } from "../lib/types";
import { Leaf } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Mock data for strategic food hubs in Algeria
const MOCK_HUBS = [
  { id: 'h1', name: 'مخازن الحبوب الاستراتيجية', location: { lat: 36.1898, lng: 5.4108 }, type: 'grain', wilaya: 'سطيف' },
  { id: 'h2', name: 'بيوت بلاستيكية كبرى', location: { lat: 34.8516, lng: 5.7281 }, type: 'veg', wilaya: 'بسكرة' },
  { id: 'h3', name: 'إنتاج الحمضيات المحلي', location: { lat: 36.4702, lng: 2.8273 }, type: 'fruit', wilaya: 'البليدة' },
  { id: 'h4', name: 'مزارع النخيل والتمور', location: { lat: 32.4909, lng: 3.6735 }, type: 'dates', wilaya: 'غرداية' },
  { id: 'h5', name: 'منطقة إنتاج البطاطس الموسمية', location: { lat: 35.3782, lng: 0.1423 }, type: 'veg', wilaya: 'معسكر' },
  { id: 'h6', name: 'مشروع القمح الصحراوي', location: { lat: 27.8825, lng: -0.2847 }, type: 'grain', wilaya: 'أدرار' },
];

interface SupplyMapProps {
  products: Product[];
}

export function SupplyMap({ products }: SupplyMapProps) {
  return (
    <div className="w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-[#0a0f0b] relative z-0">
      <MapContainer 
        center={[28.0339, 1.6596]} 
        zoom={5} 
        style={{ height: "100%", width: "100%", background: "#0a0f0b" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* User Added Products */}
        {products.map((product) => (
          <Marker 
            key={product.id} 
            position={[product.location?.lat || 36.75, product.location?.lng || 3.05]}
          >
            <Popup>
              <div className="p-2 max-w-[200px] text-right font-sans" dir="rtl">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    className="w-full h-24 object-cover rounded-xl mb-2 border border-white/10" 
                    referrerPolicy="no-referrer"
                    alt={product.name}
                  />
                )}
                <h4 className="font-bold text-emerald-600 text-sm mb-1">{product.name}</h4>
                <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest">{product.wilaya}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="font-black text-emerald-700 text-sm">{product.price} دج</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Strategic Hubs */}
        {MOCK_HUBS.map((hub) => (
          <Marker 
            key={hub.id} 
            position={[hub.location.lat, hub.location.lng]}
          >
            <Popup>
              <div className="p-2 max-w-[200px] text-right font-sans" dir="rtl">
                <div className="w-full h-20 bg-amber-50 rounded-xl mb-2 flex items-center justify-center border border-amber-200">
                  <Leaf className="text-amber-500 w-8 h-8 opacity-50" />
                </div>
                <h4 className="font-bold text-amber-600 text-sm mb-1">{hub.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">ولاية {hub.wilaya}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-brand-sidebar/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl hidden md:block">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">دليل الخريطة</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-bold text-white/80">عرض فلاحي مباشر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            <span className="text-[10px] font-bold text-white/80">مركز تخزين استراتيجي</span>
          </div>
        </div>
      </div>
    </div>
  );
}

