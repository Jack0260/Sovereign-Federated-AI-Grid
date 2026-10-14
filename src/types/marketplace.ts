export type ComputeType = 'GPU' | 'TPU' | 'CPU-cluster';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'open' | 'matched' | 'executing' | 'completed' | 'cancelled';
export type EnergySource = 'solar' | 'wind' | 'hydro' | 'nuclear' | 'natural_gas' | 'coal';

export interface ComputeListing {
  id: string;
  providerId: string;
  providerName: string;
  computeType: ComputeType;
  model: string;
  region: string;
  pricePerHour: number;
  carbonIntensity: number;
  energySource: EnergySource;
  availability: 'available' | 'busy' | 'reserved';
  totalHours: number;
  createdAt: number;
}

export interface ComputeOrder {
  id: string;
  listingId: string;
  orgId: string;
  side: OrderSide;
  computeType: ComputeType;
  hours: number;
  pricePerHour: number;
  totalCost: number;
  carbonEstimate: number;
  energySource: EnergySource;
  status: OrderStatus;
  createdAt: number;
  matchedAt: number | null;
  scheduledSlot: CarbonSlot | null;
}

export interface CarbonSlot {
  id: string;
  startTime: number;
  endTime: number;
  energySource: EnergySource;
  carbonIntensity: number;
  region: string;
  available: boolean;
}

export interface CarbonForecast {
  timestamp: number;
  region: string;
  solarMW: number;
  windMW: number;
  hydroMW: number;
  carbonIntensity: number;
  recommendedSlot: boolean;
}

export interface MarketplaceStats {
  totalListings: number;
  activeOrders: number;
  avgPricePerHour: number;
  totalCarbonSaved: number;
  totalRevenue: number;
  greenEnergyPct: number;
}
