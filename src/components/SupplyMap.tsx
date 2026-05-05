import React, { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { Product } from "../lib/types";
import { MapPin, ShoppingBag } from "lucide-react";

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";

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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  if (!API_KEY) {
    return (
      <div className="h-[500px] bg-white/[0.02] flex items-center justify-center rounded-[32px] border-2 border-dashed border-white/10">
        <div className="text-center max-w-md px-6">
          <MapPin className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">خرائط Google غير مفعلة</h3>
          <p className="text-white/40 text-sm">لعرض الخريطة التفاعلية للأمن الغذائي، يرجى إضافة GOOGLE_MAPS_PLATFORM_KEY في الإعدادات.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-brand-sidebar">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 32.0339, lng: 1.6596 }} // Central Algeria
          defaultZoom={5}
          mapId="FOODSECURE_MAP"
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          className="w-full h-full grayscale-[0.5] invert-[0.05]"
        >
          {/* User Added Products */}
          {products.map((product) => (
            <AdvancedMarker
              key={product.id}
              position={product.location}
              onClick={() => setSelectedProduct(product)}
            >
              <Pin 
                background="#22c55e" 
                borderColor="#0a0f0b" 
                glyphColor="#0a0f0b"
              />
            </AdvancedMarker>
          ))}

          {/* Mock Strategic Hubs */}
          {MOCK_HUBS.map((hub) => (
            <AdvancedMarker
              key={hub.id}
              position={hub.location}
              onClick={() => setSelectedProduct(hub)}
            >
              <div className="relative group">
                <div className="absolute -inset-2 bg-brand-accent/20 rounded-full animate-ping"></div>
                <Pin 
                  background="#eab308" 
                  borderColor="#0a0f0b" 
                  glyphColor="#0a0f0b"
                  scale={0.8}
                />
              </div>
            </AdvancedMarker>
          ))}

          {selectedProduct && (
            <InfoWindow
              position={selectedProduct.location || selectedProduct.position}
              onCloseClick={() => setSelectedProduct(null)}
            >
              <div className="p-3 max-w-[240px] bg-brand-sidebar text-white shadow-2xl rounded-2xl border border-white/10" dir="rtl">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    className="w-full h-28 object-cover rounded-xl mb-3 border border-white/10" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-28 bg-brand-accent/10 rounded-xl mb-3 flex items-center justify-center border border-brand-accent/20">
                    <Leaf className="text-brand-accent w-10 h-10 opacity-50" />
                  </div>
                )}
                <h4 className="font-bold text-brand-success text-base mb-1">{selectedProduct.name}</h4>
                <p className="text-[10px] text-white/50 mb-3 uppercase tracking-widest leading-none">ولاية {selectedProduct.wilaya}</p>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="font-black text-brand-accent text-sm">
                    {selectedProduct.price ? `${selectedProduct.price} دج` : 'مركز استراتيجي'}
                  </span>
                  <button className="bg-white/5 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-white/10">
                    عرض البيانات
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
