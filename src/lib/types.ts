export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  wilaya: string;
  farmerId: string;
  farmerName: string;
  imageUrl: string;
  createdAt: number;
  available: boolean;
}

export interface PriceReport {
  id: string;
  productName: string;
  price: number;
  wilaya: string;
  type: "shortage" | "price_hike" | "normal";
  userId: string;
  timestamp: number;
}

export type AppView = "marketplace" | "map" | "tracking" | "reports";
