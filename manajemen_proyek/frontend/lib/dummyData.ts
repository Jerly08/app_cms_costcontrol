// Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  customer?: string;
  city?: string;
  address?: string;
  projectType?: 'New Build' | 'Renovation' | 'Expansion';
  estimatedCost: number;
  actualCost: number;
  progress: number;
  status: 'On Track' | 'Warning' | 'Over Budget';
  startDate: string;
  endDate: string;
  deadline?: string;
  progressBreakdown?: {
    foundation: number;
    utilities: number;
    interior: number;
    equipment: number;
  };
}

export interface Purchase {
  id: number;
  projectId: number;
  projectName: string;
  material: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  actualPrice: number;
  vendor: string;
  date: string;
}

export interface CashflowItem {
  id: number;
  projectId: number;
  projectName: string;
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface BudgetControl {
  id: number;
  projectId: number;
  material: string;
  estimatedVolume: number;
  actualVolume: number;
  unit: string;
}

// Projects Data
export const projects: Project[] = [
  {
    id: 1,
    name: 'Proyek Jalan Tol Semarang',
    estimatedCost: 450000000,
    actualCost: 470000000,
    progress: 85,
    status: 'Warning',
    startDate: '2025-01-15',
    endDate: '2025-12-31',
  },
  {
    id: 2,
    name: 'Pembangunan Gedung Perkantoran',
    estimatedCost: 850000000,
    actualCost: 820000000,
    progress: 65,
    status: 'On Track',
    startDate: '2025-03-01',
    endDate: '2026-03-01',
  },
  {
    id: 3,
    name: 'Renovasi Jembatan Prambanan',
    estimatedCost: 320000000,
    actualCost: 355000000,
    progress: 92,
    status: 'Over Budget',
    startDate: '2025-02-10',
    endDate: '2025-11-30',
  },
  {
    id: 4,
    name: 'Perumahan Griya Asri',
    estimatedCost: 1200000000,
    actualCost: 1150000000,
    progress: 48,
    status: 'On Track',
    startDate: '2025-04-01',
    endDate: '2026-06-30',
  },
  {
    id: 5,
    name: 'Pembangunan Mall Central Plaza',
    estimatedCost: 2500000000,
    actualCost: 2480000000,
    progress: 55,
    status: 'On Track',
    startDate: '2025-01-20',
    endDate: '2026-12-31',
  },
];

// Purchasing Data
export const purchases: Purchase[] = [
  {
    id: 1,
    projectId: 1,
    projectName: 'Proyek Jalan Tol Semarang',
    material: 'Semen Portland',
    quantity: 500,
    unit: 'sak',
    estimatedPrice: 65000,
    actualPrice: 68000,
    vendor: 'PT Semen Indonesia',
    date: '2025-09-15',
  },
  {
    id: 2,
    projectId: 1,
    projectName: 'Proyek Jalan Tol Semarang',
    material: 'Besi Beton 12mm',
    quantity: 2000,
    unit: 'kg',
    estimatedPrice: 13500,
    actualPrice: 13200,
    vendor: 'CV Jaya Besi',
    date: '2025-09-20',
  },
  {
    id: 3,
    projectId: 2,
    projectName: 'Pembangunan Gedung Perkantoran',
    material: 'Kaca Tempered 8mm',
    quantity: 150,
    unit: 'm²',
    estimatedPrice: 450000,
    actualPrice: 470000,
    vendor: 'PT Asahimas',
    date: '2025-10-01',
  },
  {
    id: 4,
    projectId: 2,
    projectName: 'Pembangunan Gedung Perkantoran',
    material: 'Cat Tembok Premium',
    quantity: 200,
    unit: 'liter',
    estimatedPrice: 85000,
    actualPrice: 82000,
    vendor: 'Dulux Indonesia',
    date: '2025-10-05',
  },
  {
    id: 5,
    projectId: 3,
    projectName: 'Renovasi Jembatan Prambanan',
    material: 'Beton Ready Mix K350',
    quantity: 80,
    unit: 'm³',
    estimatedPrice: 850000,
    actualPrice: 920000,
    vendor: 'PT Pionir Beton',
    date: '2025-10-10',
  },
  {
    id: 6,
    projectId: 4,
    projectName: 'Perumahan Griya Asri',
    material: 'Genteng Beton',
    quantity: 5000,
    unit: 'pcs',
    estimatedPrice: 8500,
    actualPrice: 8300,
    vendor: 'CV Genteng Mitra',
    date: '2025-10-12',
  },
  {
    id: 7,
    projectId: 5,
    projectName: 'Pembangunan Mall Central Plaza',
    material: 'Keramik Granit 60x60',
    quantity: 800,
    unit: 'm²',
    estimatedPrice: 180000,
    actualPrice: 185000,
    vendor: 'PT Roman Ceramic',
    date: '2025-10-15',
  },
];

// Cashflow Data (by month)
export const cashflows: CashflowItem[] = [
  {
    id: 1,
    projectId: 1,
    projectName: 'Proyek Jalan Tol Semarang',
    month: 'Jan 2025',
    income: 100000000,
    expense: 85000000,
    balance: 15000000,
  },
  {
    id: 2,
    projectId: 1,
    projectName: 'Proyek Jalan Tol Semarang',
    month: 'Feb 2025',
    income: 120000000,
    expense: 105000000,
    balance: 15000000,
  },
  {
    id: 3,
    projectId: 1,
    projectName: 'Proyek Jalan Tol Semarang',
    month: 'Mar 2025',
    income: 80000000,
    expense: 95000000,
    balance: -15000000,
  },
  {
    id: 4,
    projectId: 2,
    projectName: 'Pembangunan Gedung Perkantoran',
    month: 'Aug 2025',
    income: 200000000,
    expense: 180000000,
    balance: 20000000,
  },
  {
    id: 5,
    projectId: 2,
    projectName: 'Pembangunan Gedung Perkantoran',
    month: 'Sep 2025',
    income: 180000000,
    expense: 165000000,
    balance: 15000000,
  },
  {
    id: 6,
    projectId: 3,
    projectName: 'Renovasi Jembatan Prambanan',
    month: 'Aug 2025',
    income: 80000000,
    expense: 90000000,
    balance: -10000000,
  },
  {
    id: 7,
    projectId: 4,
    projectName: 'Perumahan Griya Asri',
    month: 'Sep 2025',
    income: 300000000,
    expense: 280000000,
    balance: 20000000,
  },
  {
    id: 8,
    projectId: 5,
    projectName: 'Pembangunan Mall Central Plaza',
    month: 'Sep 2025',
    income: 500000000,
    expense: 485000000,
    balance: 15000000,
  },
];

// Budget Control Data
export const budgetControls: BudgetControl[] = [
  {
    id: 1,
    projectId: 1,
    material: 'Beton Ready Mix K300',
    estimatedVolume: 1500,
    actualVolume: 1420,
    unit: 'm³',
  },
  {
    id: 2,
    projectId: 1,
    material: 'Aspal Hotmix',
    estimatedVolume: 800,
    actualVolume: 850,
    unit: 'ton',
  },
  {
    id: 3,
    projectId: 2,
    material: 'Besi Beton Total',
    estimatedVolume: 45000,
    actualVolume: 43500,
    unit: 'kg',
  },
  {
    id: 4,
    projectId: 3,
    material: 'Beton Struktural K400',
    estimatedVolume: 300,
    actualVolume: 320,
    unit: 'm³',
  },
];

// Helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const calculateVariance = (estimated: number, actual: number): number => {
  return ((actual - estimated) / estimated) * 100;
};

export const getVarianceColor = (variance: number): string => {
  if (variance > 5) return 'text-red-600';
  if (variance > 0) return 'text-yellow-600';
  return 'text-green-600';
};
