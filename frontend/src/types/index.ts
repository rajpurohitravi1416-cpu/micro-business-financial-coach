export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Udhaar'
export type StockStatus = 'Healthy' | 'Low' | 'Critical'
export interface Sale { id: string; time: string; product: string; quantity: number; amount: number; payment: PaymentMethod; customer: string; date: string }
export interface Product { id: string; name: string; category: string; purchaseCost: number; sellingPrice: number; stock: number; unit: string; supplier: string; demand: number; leadTime: number; safetyStock: number }
export interface Expense { id: string; category: string; description: string; amount: number; date: string }
export interface Customer { id: string; name: string; phone: string; totalPurchases: number; outstanding: number; lastPurchase: string; status: 'Active' | 'Due soon' | 'Overdue' }
export interface Udhaar { id: string; customer: string; amount: number; date: string; dueDate: string; status: 'Open' | 'Overdue' | 'Due soon'; daysOverdue: number }
export interface Purchase { id: string; supplier: string; product: string; quantity: number; costPerUnit: number; date: string }
export interface ChatMessage { id: string; role: 'assistant' | 'user'; text: string }
