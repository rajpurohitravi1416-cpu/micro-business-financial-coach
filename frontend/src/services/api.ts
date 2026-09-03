const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const BUSINESS_ID = 1;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API ${response.status}: ${error}`);
  }

  return response.json();
}

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
  phone: string;
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

export const api = {
  getBusiness: () =>
    request(`/businesses/${BUSINESS_ID}`),

  getDashboard: () =>
    request<DashboardData>(
      `/analytics/business/${BUSINESS_ID}`
    ),

  getCashFlow: () =>
    request<CashFlowData>(
      `/cashflow/business/${BUSINESS_ID}`
    ),

  getSafeToSpend: () =>
    request<SafeToSpendData>(
      `/safe-to-spend/${BUSINESS_ID}`
    ),

  getSales: () =>
    request<ApiSale[]>(
      `/sales/business/${BUSINESS_ID}`
    ),

  postSale: (data: Record<string, unknown>) =>
    request<ApiSale>("/sales/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: BUSINESS_ID,
      }),
    }),

  getPurchases: () =>
    request<ApiPurchase[]>(`/purchases/business/${BUSINESS_ID}`),

  postPurchase: (data: Record<string, unknown>) =>
    request<ApiPurchase>("/purchases/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: BUSINESS_ID,
      }),
    }),

  getProducts: () =>
    request<ApiProduct[]>(
      `/products/business/${BUSINESS_ID}`
    ),

  getInventory: () =>
    request<ApiProduct[]>(
      `/products/business/${BUSINESS_ID}`
    ),

  postProduct: (data: Record<string, unknown>) =>
    request<ApiProduct>("/products/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: BUSINESS_ID,
      }),
    }),

  getExpenses: () =>
    request(`/expenses/business/${BUSINESS_ID}`),

  postExpense: (data: Record<string, unknown>) =>
    request("/expenses/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: BUSINESS_ID,
      }),
    }),

  getUdhaar: () =>
    request<ApiUdhaar[]>(
      `/udhaar/business/${BUSINESS_ID}`
    ),

  postUdhaar: (data: Record<string, unknown>) =>
    request("/udhaar/", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        business_id: BUSINESS_ID,
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
    request<DayBookData>(`/daybook/business/${BUSINESS_ID}`),

  getLoans: () => request<ApiLoan[]>(`/loans/business/${BUSINESS_ID}`),
  postLoan: (data: Record<string, unknown>) => request<ApiLoan>("/loans/", { method: "POST", body: JSON.stringify({ ...data, business_id: BUSINESS_ID }) }),
  postLoanPayment: (id: number, amount: number) => request<ApiLoan>(`/loans/${id}/payment`, { method: "POST", body: JSON.stringify({ amount }) }),

  getCustomers: () =>
    request<ApiCustomer[]>(
      `/customers/business/${BUSINESS_ID}`
    ),

  getCoach: () =>
    request<CoachData>(
      `/coach/business/${BUSINESS_ID}`
    ),

  postCoach: async (message: string) => {
    return request<{ message: string; response: string; source: string }>(`/coach/business/${BUSINESS_ID}/ask`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};
