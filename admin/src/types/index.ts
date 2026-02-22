export interface BotUser {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isBlocked: boolean;
  lastActiveAt?: string;
  createdAt: string;
  subscriptions?: Subscription[];
}

export interface Subscription {
  id: number;
  planType: PlanType;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type PlanType = 'TRIAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'GRANDFATHER';

export interface Payment {
  id: number;
  telegramId: string;
  planType: PlanType;
  amount: number;
  paymentMethod: 'CLICK' | 'PAYME' | 'MANUAL' | 'REFERRAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  user?: { telegramId: string; firstName?: string; username?: string };
}

export interface VipUser {
  id: number;
  telegramId: string;
  vipCode: string;
  isActive: boolean;
  totalEarnings: number;
  totalReferrals: number;
  createdAt: string;
  user?: { firstName?: string; username?: string; telegramId: string };
}

export interface DashboardStats {
  users: { total: number; active: number; blocked: number };
  subscriptions: { total: number; active: number; byPlan: Record<string, number> };
  payments: { total: number; completed: number; totalRevenue: number };
  vip: { total: number; active: number; remaining: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
