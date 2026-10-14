export interface Invoice {
  id: string;
  orgId: string;
  roundId: string | null;
  computeCost: number;
  carbonCost: number;
  tokenCost: number;
  totalCost: number;
  carbonKg: number;
  energySource: string;
  timestamp: number;
  paid: boolean;
}

export interface TokenLedgerEntry {
  id: string;
  orgId: string;
  type: 'credit' | 'debit' | 'reward' | 'penalty';
  amount: number;
  reason: string;
  balanceAfter: number;
  timestamp: number;
}

export interface OrgEconomics {
  orgId: string;
  tokenBalance: number;
  totalSpent: number;
  totalCarbonKg: number;
  totalRounds: number;
  avgCostPerRound: number;
  carbonSavedKg: number;
  costSaved: number;
  invoices: Invoice[];
}

export interface CarbonReport {
  id: string;
  roundId: string;
  orgId: string;
  carbonKg: number;
  energySource: string;
  carbonIntensity: number;
  computeHours: number;
  region: string;
  timestamp: number;
}

export interface EconomicsSummary {
  totalComputeCost: number;
  totalCarbonCost: number;
  totalTokenCost: number;
  grandTotal: number;
  totalCarbonKg: number;
  carbonSavedKg: number;
  costSavedPct: number;
  carbonSavedPct: number;
}
