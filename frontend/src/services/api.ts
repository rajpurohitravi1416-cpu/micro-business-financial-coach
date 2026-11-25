const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
let selectedBusinessId: number | null = null;
let csrfToken: string | null = null;

export function setBusinessId(id: number | null) {
  selectedBusinessId = id;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

function currentBusinessId() {
  if (selectedBusinessId === null) {
    throw new Error("Create or select a shop before loading business records.");
  }
  return selectedBusinessId;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.text();
      if (body) {
        try {
          const error = JSON.parse(body);
          message = error.detail || error.message || body;
        } catch {
          message = body;
        }
      }
    } catch {
      // Keep the status-based message if the response body cannot be read.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "shop_owner";
}

export interface AuthResult {
  user: AuthUser;
  csrf_token: string;
}

export interface ApiBusiness {
  id: number;
  name: string;
  owner_name: string;
  phone: string | null;
  opening_cash: number;
}

export interface AdminOverview {
  user_count: number;
  shop_count: number;
  users: Array<{ id: number; name: string; email: string }>;
  unassigned_businesses: Array<{ id: number; name: string; owner_name: string }>;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<AuthResult>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
};

export interface DashboardData {
  total_sales: number;
  total_profit: number;
  total_purchases: number;
  total_expenses: number;
  net_profit: number;
  outstanding_udhaar: number;
  inventory_value: number;
  low_stock_products: number;
}

export interface CashFlowData {
  cash_sales: number;
  udhaar_collected: number;
  cash_purchases: number;
  cash_expenses: number;
  net_cash_flow: number;
  outstanding_udhaar: number;
}

export interface SafeToSpendData {
  opening_cash: number;
  cash_sales: number;
  udhaar_collected: number;
  cash_purchases: number;
  cash_expenses: number;
  current_cash: number;
  cash_reserve: number;
  safe_to_spend: number;
}

export interface ApiSale {
  id: number;
  business_id: number;
  product_id: number;
  quantity: number;
  selling_price: number;
  cost_price: number;
  total_amount: number;
  profit: number;
  payment_mode: string;
  created_at: string;
}

export interface ApiProduct {
  id: number;
  business_id: number;
  name: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
}

export interface ApiCustomer {
  id: number;
  business_id: number;
  name: string;
  phone: string | null;
  total_due: number;
}

export interface ApiPurchase {
  id: number;
  business_id: number;
  product_id: number;
  quantity: number;
  purchase_price: number;
  total_amount: number;
  payment_mode: string;
  created_at: string;
}

export interface ApiUdhaar {
  id: number;
  business_id: number;
  customer_id: number;
  amount: number;
  amount_paid: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface DayBookEntry {
  time: string;
  type: string;
  description: string;
  money_in: number;
  money_out: number;
  balance: number;
  reference_id: number;
}

export interface DayBookData {
  business_id: number;
  opening_balance: number;
  money_in: number;
  money_out: number;
  closing_balance: number;
  entries: DayBookEntry[];
}

export interface ApiLoan {
  id: number; business_id: number; lender: string; loan_type: string;
  original_amount: number; outstanding_amount: number; interest_rate: number;
  monthly_emi: number; next_due_date: string | null; created_at: string;
}

export interface CoachData {
  business_id: number;
  summary: DashboardData;
  insights: string[];
  low_stock_products: ApiProduct[];
}

export interface CoachStatus {
  configured: boolean;
  available: boolean;
  model: string | null;
  message: string;
}

export const api = {
  getMyBusinesses: () => request<ApiBusiness[]>("/businesses/mine"),

  postBusiness: (data: { name: string; owner_name: string; phone?: string; opening_cash?: number }) =>
    request<ApiBusiness>("/businesses/", { method: "POST", body: JSON.stringify(data) }),

  getAdminOverview: () => request<AdminOverview>("/admin/overview"),

  assignBusinessOwner: (businessId: number, email: string) =>
    request<{ message: string }>(`/admin/businesses/${businessId}/assign-owner`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  getBusiness: () =>
    request(`/businesses/${currentBusinessId()}`),

  getDashboard: () =>
    request<DashboardData>(
      `/analytics/business/${currentBusinessId()}`
    ),

  getCashFlow: () =>
    request<CashFlowData>(
      `/cashflow/business/${currentBusinessId()}`
    ),

  getSafeToSpend: () =>
    request<SafeToSpendData>(
      `/safe-to-spend/${currentBusinessId()}`
    ),

  getSales: () =>
    request<ApiSale[]>(
      `/sales/business/${currentBusinessId()}`
    ),

  postSale: (data: Record<string, unknown>) =>
    request<ApiSale>("/sales/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: currentBusinessId(),
      }),
    }),

  getPurchases: () =>
    request<ApiPurchase[]>(`/purchases/business/${currentBusinessId()}`),

  postPurchase: (data: Record<string, unknown>) =>
    request<ApiPurchase>("/purchases/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: currentBusinessId(),
      }),
    }),

  getProducts: () =>
    request<ApiProduct[]>(
      `/products/business/${currentBusinessId()}`
    ),

  getInventory: () =>
    request<ApiProduct[]>(
      `/products/business/${currentBusinessId()}`
    ),

  postProduct: (data: Record<string, unknown>) =>
    request<ApiProduct>("/products/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: currentBusinessId(),
      }),
    }),

  getExpenses: () =>
    request(`/expenses/business/${currentBusinessId()}`),

  postExpense: (data: Record<string, unknown>) =>
    request("/expenses/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: currentBusinessId(),
      }),
    }),

  getUdhaar: () =>
    request<ApiUdhaar[]>(
      `/udhaar/business/${currentBusinessId()}`
    ),

  postUdhaar: (data: Record<string, unknown>) =>
    request("/udhaar/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: currentBusinessId(),
      }),
    }),

  postUdhaarPayment: (
    id: string,
    data: Record<string, unknown>
  ) =>
    request(`/udhaar/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDayBook: () =>
    request<DayBookData>(`/daybook/business/${currentBusinessId()}`),

  getLoans: () => request<ApiLoan[]>(`/loans/business/${currentBusinessId()}`),
  postLoan: (data: Record<string, unknown>) => request<ApiLoan>("/loans/", { method: "POST", body: JSON.stringify({ ...data, business_id: currentBusinessId() }) }),
  postLoanPayment: (id: number, amount: number) => request<ApiLoan>(`/loans/${id}/payment`, { method: "POST", body: JSON.stringify({ amount }) }),

  getCustomers: () =>
    request<ApiCustomer[]>(
      `/customers/business/${currentBusinessId()}`
    ),

  getCoach: () =>
    request<CoachData>(
      `/coach/business/${currentBusinessId()}`
    ),

  getCoachStatus: () =>
    request<CoachStatus>(`/coach/business/${currentBusinessId()}/status`),

  postCoach: async (message: string) => {
    return request<{ message: string; response: string; source: string }>(`/coach/business/${currentBusinessId()}/ask`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};
