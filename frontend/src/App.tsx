import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Bot, CalendarDays, CheckCircle2, CircleDollarSign, CreditCard, IndianRupee, Landmark, Mic, Minus, PackagePlus, Plus, Search, Send, ShieldCheck, ShoppingBag, TrendingUp, WalletCards } from 'lucide-react';
import { AppLayout } from './components/layout/AppLayout';
import { Badge, Button, Card, Input, Modal } from './components/ui';
import { customers, expenses as seedExpenses, initialSales, products, purchases, salesTrend } from './data/mockData';
import type { ChatMessage, Expense, PaymentMethod, Sale } from './types';
import { createWhatsAppReminder, openWhatsAppReminder } from './utils/whatsappReminder.js';
import { getTimeGreeting } from './utils/timeGreeting.js';
import { api } from './services/api';
import { SpeakButton, VoiceButton } from './components/VoiceButton';
import { getLanguage, getTranslations, useLanguage } from './i18n';
import{ DebtCoach } from './debtCoach';
import { AuthProvider, useAuth } from './auth/AuthContext';
import type { AdminOverview } from './services/api';
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const date = (x: string) => new Date(`${x}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const Header = ({ title, subtitle, action }: {
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}) => <div className="page-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>;
const Status = ({ status }: {
    status: string;
}) => <Badge tone={status === 'Healthy' || status === 'Active' ? 'green' : status === 'Low' || status === 'Due soon' ? 'amber' : 'red'}>{status}</Badge>;
const Stat = ({ icon, label, value, note, tone }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    note: string;
    tone?: string;
}) => <Card className={`stat-card ${tone ?? ''}`}><div className="stat-icon">{icon}</div><span>{label}</span><h2>{value}</h2><p>{note}</p></Card>;
function Table({ sales }: {
    sales: Sale[];
}) { return <><div className="table-scroll desktop-table"><table><thead><tr><th>Time</th><th>Product</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Customer</th></tr></thead><tbody>{sales.map(s => <tr key={s.id}><td>{s.time}</td><td><strong>{s.product}</strong></td><td>{s.quantity}</td><td><strong>{money(s.amount)}</strong></td><td><Badge tone={s.payment === 'Udhaar' ? 'amber' : 'green'}>{s.payment}</Badge></td><td>{s.customer}</td></tr>)}</tbody></table></div><div className="mobile-list">{sales.map(s => <div className="mobile-row" key={s.id}><div><strong>{s.product}</strong><span>{s.time} · {s.quantity} unit{s.quantity > 1 ? 's' : ''} · {s.customer}</span></div><div><strong>{money(s.amount)}</strong><Badge tone={s.payment === 'Udhaar' ? 'amber' : 'green'}>{s.payment}</Badge></div></div>)}</div></>; }
function LegacyDashboard({ sales }: {
    sales: Sale[];
}) { const navigate = useNavigate(); const { user } = useAuth(); return <><div className="welcome"><div><h2>{getTimeGreeting()}, {user?.name?.trim() || 'there'} 👋</h2><p>Here’s what needs your attention today.</p></div><Button variant="secondary"><CalendarDays size={16}/> Aug 29, 2026</Button></div><div className="stat-grid"><Stat icon={<WalletCards />} label="Safe to Spend" value="₹27,500" note="Available after upcoming payments & safety buffer"/><Stat icon={<CircleDollarSign />} label="Today’s Sales" value="₹12,400" note="↑ 12.4% more than yesterday"/><Stat icon={<TrendingUp />} label="Today’s Profit" value="₹3,100" note="↑ 25% average margin"/><Stat icon={<CreditCard />} label="Outstanding Udhaar" value="₹18,000" note="3 customers need follow-up" tone="amber"/></div><div className="quick-actions"><button onClick={() => navigate('/sales')}><Plus /> <span>Record Sale</span></button><button onClick={() => navigate('/expenses')}><Plus /> <span>Add Expense</span></button><button onClick={() => navigate('/udhaar')}><Plus /> <span>Add Udhaar</span></button><button onClick={() => navigate('/purchases')}><ShoppingBag /> <span>Add Purchase</span></button></div><div className="dashboard-grid"><Card className="sales-chart"><div className="card-title"><div><h3>Sales overview</h3><p>Last 7 days</p></div><strong>₹77,900 <small>↑ 14.8%</small></strong></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={salesTrend}><defs><linearGradient id="sales" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#176B5B" stopOpacity=".24"/><stop offset="1" stopColor="#176B5B" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#ebeeeb"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis tickFormatter={x => `₹${x / 1000}k`} axisLine={false} tickLine={false}/><Tooltip formatter={x => money(Number(x))}/><Area type="monotone" dataKey="sales" stroke="#176B5B" strokeWidth={3} fill="url(#sales)"/></AreaChart></ResponsiveContainer></div></Card><Card className="payments"><h3>Upcoming payments</h3>{[['Shree Traders', 'Supplier invoice', '₹15,000', 'Due in 3 days'], ['Shop rent', 'September rent', '₹12,000', 'Due in 5 days'], ['Electricity bill', 'Estimated', '₹2,450', 'Due in 9 days']].map(x => <div className="payment" key={x[0]}><span className="payment-icon"><IndianRupee size={17}/></span><div><strong>{x[0]}</strong><small>{x[1]}</small></div><div><strong>{x[2]}</strong><small>{x[3]}</small></div></div>)}</Card><Card className="business-watch"><h3>What needs your attention</h3>{[['Tur Dal margin dropped from 27% to 22%', 'Review supplier rates before restocking.'], ['₹18,000 customer udhaar is outstanding', 'Two payments are overdue.'], ['Rice stock may need replenishment soon', 'Only roughly 7 days of stock left.']].map(x => <div className="alert" key={x[0]}><AlertTriangle size={18}/><div><strong>{x[0]}</strong><p>{x[1]}</p></div></div>)}</Card><Card className="inventory-snapshot"><h3>Inventory warnings</h3><div className="mini-table"><div className="mini-head"><span>Product</span><span>Stock</span><span>Days</span><span>Buy</span></div>{products.slice(0, 3).map(p => { const d = p.stock / p.demand, b = Math.max(0, p.demand * (p.leadTime + 4) + p.safetyStock - p.stock); return <div className="mini-row" key={p.id}><strong>{p.name}</strong><span>{p.stock} {p.unit}</span><span>{d.toFixed(0)} days</span><b>{b ? `${b} ${p.unit}` : '—'}</b></div>; })}</div></Card><Card className="recent-sales"><h3>Recent sales</h3><Table sales={sales.slice(0, 4)}/></Card></div></>; }
void LegacyDashboard;

function SaleModal({ close, save }: {
    close: () => void;
    save: (x: Sale) => void;
}) { const [p, setP] = useState('Rice'), [q, setQ] = useState(1), [price, setPrice] = useState(68), [customer, setC] = useState('Walk-in'), [payment, setPay] = useState<PaymentMethod>('Cash'); return <Modal title="Add sale" onClose={close}><form className="form-grid sale-form" onSubmit={e => { e.preventDefault(); save({ id: crypto.randomUUID(), time: 'Just now', product: p, quantity: q, amount: q * price, payment, customer, date: '2026-08-29' }); close(); }}><label>Product<select value={p} onChange={e => setP(e.target.value)}>{products.map(x => <option key={x.id}>{x.name}</option>)}</select></label><label className="quantity-field">Quantity<div className="stepper"><button type="button" onClick={() => setQ(x => Math.max(1, x - 1))} aria-label="Decrease quantity"><Minus size={18}/></button><strong>{q}</strong><button type="button" onClick={() => setQ(x => x + 1)} aria-label="Increase quantity"><Plus size={18}/></button></div></label><label>Selling price<Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))}/></label><label>Customer<Input value={customer} onChange={e => setC(e.target.value)}/></label><fieldset className="payment-methods"><legend>Payment method</legend>{(['Cash', 'UPI', 'Card', 'Udhaar'] as PaymentMethod[]).map(x => <button className={payment === x ? 'selected' : ''} type="button" onClick={() => setPay(x)} key={x}>{x}</button>)}</fieldset><label>Date<Input type="date" defaultValue="2026-08-29"/></label><div className="form-total">Sale total <strong>{money(q * price)}</strong></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={close}>Cancel</Button><Button>Save sale</Button></div></form></Modal>; }
function Sales({ sales, setSales }: {
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}) { const [m, setM] = useState(false), [q, setQ] = useState(''), [pay, setPay] = useState('All'); const list = sales.filter(x => (x.product + x.customer).toLowerCase().includes(q.toLowerCase()) && (pay === 'All' || x.payment === pay)); return <><Header title="Sales" subtitle="Record and review every sale in one place." action={<Button onClick={() => setM(true)}><Plus size={17}/> Add sale</Button>}/><Card><div className="filters"><div className="search"><Search size={18}/><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search product or customer"/></div><select value={pay} onChange={e => setPay(e.target.value)}>{['All', 'Cash', 'UPI', 'Card', 'Udhaar'].map(x => <option key={x}>{x}</option>)}</select></div><Table sales={list}/></Card>{m && <SaleModal close={() => setM(false)} save={x => setSales(y => [x, ...y])}/>}</>; }
function PurchaseModal({ close, save }: {
    close: () => void;
    save: (x: { id: string; supplier: string; product: string; quantity: number; costPerUnit: number; date: string }) => void;
}) { const [supplier, setSupplier] = useState(''), [product, setProduct] = useState(products[0]?.name ?? ''), [quantity, setQuantity] = useState(1), [cost, setCost] = useState(products[0]?.purchaseCost ?? 0); return <Modal title="Add purchase" onClose={close}><form className="form-grid" onSubmit={e => { e.preventDefault(); save({ id: crypto.randomUUID(), supplier: supplier.trim() || 'Supplier', product, quantity: Math.max(1, quantity), costPerUnit: Math.max(0, cost), date: new Date().toISOString().slice(0, 10) }); close(); }}><label>Supplier<Input required value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name"/></label><label>Product<select value={product} onChange={e => { const name = e.target.value; setProduct(name); const selected = products.find(x => x.name === name); if (selected) setCost(selected.purchaseCost); }}>{products.map(x => <option key={x.id}>{x.name}</option>)}</select></label><label>Quantity<Input required min="1" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))}/></label><label>Cost / unit<Input required min="0" type="number" value={cost} onChange={e => setCost(Number(e.target.value))}/></label><div className="form-total">Purchase total <strong>{money(Math.max(1, quantity) * Math.max(0, cost))}</strong></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={close}>Cancel</Button><Button type="submit">Save purchase</Button></div></form></Modal>; }
function Purchases() { const [m, setM] = useState(false), [rows, setRows] = useState(purchases); return <><Header title="Purchases" subtitle="Track supplier purchases and inventory costs." action={<Button onClick={() => setM(true)}><Plus size={17}/> Add purchase</Button>}/><Card><div className="table-scroll"><table><thead><tr><th>Supplier</th><th>Product</th><th>Quantity</th><th>Cost / unit</th><th>Total cost</th><th>Date</th></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td><strong>{p.supplier}</strong></td><td>{p.product}</td><td>{p.quantity}</td><td>{money(p.costPerUnit)}</td><td><strong>{money(p.quantity * p.costPerUnit)}</strong></td><td>{date(p.date)}</td></tr>)}</tbody></table></div></Card>{m && <PurchaseModal close={() => setM(false)} save={x => setRows(y => [x, ...y])}/>}</>; }
function SimpleModal({ title, close, fields }: {
    title: string;
    close: () => void;
    fields: string[];
}) { return <Modal title={title} onClose={close}><form className="form-grid" onSubmit={e => { e.preventDefault(); close(); }}>{fields.map(x => <label key={x}>{x}<Input required type={x.includes('cost') || x === 'Amount' ? 'number' : 'text'}/></label>)}<div className="modal-actions"><Button variant="secondary" type="button" onClick={close}>Cancel</Button><Button>Save</Button></div></form></Modal>; }
function Products() { const [m, setM] = useState(false); return <><Header title="Products" subtitle="Your catalogue, prices, margins and suppliers." action={<Button onClick={() => setM(true)}><PackagePlus size={17}/> Add product</Button>}/><div className="product-grid">{products.map(p => { const margin = Math.round((p.sellingPrice - p.purchaseCost) / p.sellingPrice * 100); return <Card className="product-card" key={p.id}><div className="product-top"><span className="product-icon"><PackagePlus size={18}/></span><Status status={p.stock / p.demand < 8 ? 'Low' : 'Healthy'}/></div><h3>{p.name}</h3><p>{p.category} · {p.supplier}</p><div className="price-row"><span>Buy<strong>{money(p.purchaseCost)}</strong></span><span>Sell<strong>{money(p.sellingPrice)}</strong></span></div><div className="product-footer"><span><b>{margin}%</b> margin</span><span><b>{p.stock} {p.unit}</b> in stock</span></div></Card>; })}</div>{m && <SimpleModal title="Add product" close={() => setM(false)} fields={['Product name', 'Category', 'Purchase cost', 'Selling price', 'Current stock', 'Supplier']}/>}</>; }
function Inventory() { const rows = products.map(p => { const d = p.stock / p.demand, b = Math.max(0, p.demand * (p.leadTime + 4) + p.safetyStock - p.stock), s = d < p.leadTime + 2 ? 'Critical' : d < 10 ? 'Low' : 'Healthy'; return { p, d, b, s }; }); return <><Header title="Inventory intelligence" subtitle="Know what to buy, when to buy it, and why."/><div className="inventory-intro"><Bot size={21}/><p><b>Recommendation is based on recent sales, current stock, supplier lead time and safety stock.</b> These are mock calculations, not AI-generated advice.</p></div><Card className="desktop-table"><div className="table-scroll"><table><thead><tr><th>Product</th><th>Current stock</th><th>Daily velocity</th><th>Days remaining</th><th>Lead time</th><th>Safety stock</th><th>Status</th><th>Recommended purchase</th></tr></thead><tbody>{rows.map(({ p, d, b, s }) => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.stock} {p.unit}</td><td>{p.demand} {p.unit}/day</td><td>{d.toFixed(1)} days</td><td>{p.leadTime} days</td><td>{p.safetyStock} {p.unit}</td><td><Status status={s}/></td><td><b>{b ? `Buy ${b} ${p.unit}` : 'No purchase needed'}</b></td></tr>)}</tbody></table></div></Card><div className="inventory-mobile-list">{rows.map(({ p, d, b, s }) => <Card className="inventory-mobile-card" key={p.id}><div><strong>{p.name}</strong><Status status={s}/></div><span>{p.stock} {p.unit} in stock</span><span>{d.toFixed(0)} days remaining</span><b>Recommended: {b ? `Buy ${b} ${p.unit}` : 'No purchase needed'}</b></Card>)}</div></>; }
function Expenses({ items, setItems }: {
    items: Expense[];
    setItems: React.Dispatch<React.SetStateAction<Expense[]>>;
}) { const [m, setM] = useState(false), total = items.reduce((a, x) => a + x.amount, 0); return <><Header title="Expenses" subtitle="Keep operating costs visible and under control." action={<Button onClick={() => setM(true)}><Plus size={17}/> Add expense</Button>}/><div className="expense-stats"><Stat icon={<TrendingUp />} label="Total expenses" value={money(total)} note="This month"/><Stat icon={<CircleDollarSign />} label="Largest expense" value="₹12,000" note="Rent · 79% of total"/><Stat icon={<WalletCards />} label="Operating ratio" value="12.6%" note="of monthly sales"/></div><Card><div className="table-scroll"><table><thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td><Badge>{x.category}</Badge></td><td>{x.description}</td><td><strong>{money(x.amount)}</strong></td><td>{date(x.date)}</td></tr>)}</tbody></table></div></Card>{m && <SimpleModal title="Add expense" close={() => { setItems(x => [...x, { id: crypto.randomUUID(), category: 'Other', description: 'New expense', amount: 0, date: '2026-08-29' }]); setM(false); }} fields={['Category', 'Description', 'Amount']}/>}</>; }
function Udhaar() {
  const [m, setM] = useState(false);
  const [records, setRecords] = useState<Array<{ entry: import('./services/api').ApiUdhaar; customer: import('./services/api').ApiCustomer | undefined }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { activeBusiness } = useAuth();

  useEffect(() => {
    let active = true;
    Promise.all([api.getUdhaar(), api.getCustomers()])
      .then(([entries, savedCustomers]) => {
        if (!active) return;
        const byId = new Map(savedCustomers.map(customer => [customer.id, customer]));
        setRecords(entries.map(entry => ({ entry, customer: byId.get(entry.customer_id) })));
      })
      .catch(err => active && setError(err instanceof Error ? err.message : 'Could not load Udhaar records.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = records.map(({ entry, customer }) => {
    const balance = Math.max(0, entry.amount - entry.amount_paid);
    const dueDate = entry.due_date ? new Date(`${entry.due_date.slice(0, 10)}T00:00:00`) : null;
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / 86400000) : null;
    const status = balance <= 0 ? 'Paid' : daysUntilDue !== null && daysUntilDue < 0 ? 'Overdue' : daysUntilDue !== null && daysUntilDue <= 3 ? 'Due soon' : 'Open';
    const daysOverdue = status === 'Overdue' && daysUntilDue !== null ? Math.abs(daysUntilDue) : 0;
    return { entry, customer, balance, dueDate: entry.due_date, status, daysOverdue };
  });
  const total = rows.reduce((sum, row) => sum + row.balance, 0);
  const overdue = rows.filter(row => row.status === 'Overdue').reduce((sum, row) => sum + row.balance, 0);
  const dueSoon = rows.filter(row => row.status === 'Due soon').reduce((sum, row) => sum + row.balance, 0);

  const sendReminder = (row: typeof rows[number]) => {
    setError('');
    setNotice('');
    try {
      const reminder = createWhatsAppReminder({
        phone: row.customer?.phone,
        customerName: row.customer?.name ?? '',
        shopName: activeBusiness?.name ?? '',
        outstandingAmount: row.balance,
        dueDate: row.dueDate,
      });
      openWhatsAppReminder(reminder.url);
      setNotice('WhatsApp should open with a draft. Review the details and press Send in WhatsApp when ready.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare a WhatsApp reminder.');
    }
  };

  const displayDate = (value: string | null) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
  const statusTone = (status: string) => status === 'Paid' ? 'green' : status === 'Overdue' ? 'red' : status === 'Due soon' ? 'amber' : 'neutral';

  return <>
    <Header title="Udhaar" subtitle="Stay on top of money owed to your business." action={<div className="header-actions"><Button variant="secondary" onClick={() => setM(true)}><CheckCircle2 size={17}/> Record payment</Button><Button onClick={() => setM(true)}><Plus size={17}/> Record udhaar</Button></div>}/>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
    <div className="expense-stats"><Stat icon={<WalletCards />} label="Total outstanding" value={money(total)} note={`${rows.filter(row => row.balance > 0).length} open records`} tone="amber"/><Stat icon={<AlertTriangle />} label="Overdue amount" value={money(overdue)} note="Past due date" tone="amber"/><Stat icon={<CalendarDays />} label="Due soon" value={money(dueSoon)} note="Due within 3 days"/></div>
    {loading ? <Card className="settings-card">Loading Udhaar records...</Card> : <>
      <Card className="desktop-table"><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Phone</th><th>Outstanding</th><th>Date</th><th>Due date</th><th>Status</th><th>Days overdue</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.entry.id}><td><strong>{row.customer?.name ?? 'Customer record unavailable'}</strong></td><td>{row.customer?.phone || 'No saved number'}</td><td><strong>{money(row.balance)}</strong></td><td>{displayDate(row.entry.created_at)}</td><td>{displayDate(row.dueDate)}</td><td><Badge tone={statusTone(row.status)}>{row.status}</Badge></td><td>{row.daysOverdue ? `${row.daysOverdue} days` : '-'}</td><td><div className="udhaar-actions"><button className="text-button" onClick={() => setM(true)}>Record payment</button><Button variant="secondary" disabled={row.balance <= 0} onClick={() => sendReminder(row)}>Send WhatsApp Reminder</Button></div></td></tr>)}</tbody></table></div></Card>
      <div className="udhaar-mobile-list">{rows.map(row => <Card className="udhaar-mobile-card" key={row.entry.id}><div><strong>{row.customer?.name ?? 'Customer record unavailable'}</strong><Badge tone={statusTone(row.status)}>{row.status}</Badge></div><span>{row.customer?.phone || 'No saved number'}</span><b>{money(row.balance)}</b><span>Due {displayDate(row.dueDate)}{row.daysOverdue ? ` - ${row.daysOverdue} days overdue` : ''}</span><Button variant="secondary" disabled={row.balance <= 0} onClick={() => sendReminder(row)}>Send WhatsApp Reminder</Button><button className="text-button" onClick={() => setM(true)}>Record payment</button></Card>)}</div>
      {!rows.length && <Card className="settings-card">No Udhaar records have been saved for this shop yet.</Card>}
    </>}
    {m && <SimpleModal title="Record udhaar or payment" close={() => setM(false)} fields={['Customer', 'Amount']}/>}
  </>;
}
function Customers() { const [s, setS] = useState<typeof customers[number] | null>(null); return <><Header title="Customers" subtitle="Understand customer relationships and credit exposure."/><Card><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Phone</th><th>Total purchases</th><th>Outstanding udhaar</th><th>Last purchase</th><th>Status</th></tr></thead><tbody>{customers.map(x => <tr className="click-row" onClick={() => setS(x)} key={x.id}><td><strong>{x.name}</strong></td><td>{x.phone}</td><td>{money(x.totalPurchases)}</td><td><strong>{money(x.outstanding)}</strong></td><td>{x.lastPurchase}</td><td><Status status={x.status}/></td></tr>)}</tbody></table></div></Card>{s && <Modal title={s.name} onClose={() => setS(null)}><div className="customer-detail"><div className="detail-avatar">{s.name.split(' ').map(x => x[0]).join('')}</div><p>{s.phone}</p><div><span>Total purchases</span><strong>{money(s.totalPurchases)}</strong></div><div><span>Outstanding udhaar</span><strong>{money(s.outstanding)}</strong></div><Button onClick={() => setS(null)}>Close details</Button></div></Modal>}</>; }
function Coach() {
  const [msg, setMsg] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', text: 'Hello! Ask about your shop, recorded sales, inventory or Udhaar. Answers use the records saved for your shop.' }]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [modelLabel, setModelLabel] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const sentPromptKey = useRef('');

  useEffect(() => {
    let active = true;
    api.getCoachStatus()
      .then(status => {
        if (!active) return;
        setOllamaAvailable(status.available);
        setModelLabel(status.model ? ` ? ${status.model}` : '');
      })
      .catch(() => active && setOllamaAvailable(false));
    return () => { active = false; };
  }, []);

  const send = async (text = draft) => {
    const question = text.trim();
    if (!question || sending) return;
    setMsg(current => [...current, { id: crypto.randomUUID(), role: 'user', text: question }]);
    setDraft('');
    setSending(true);
    try {
      const result = await api.postCoach(question);
      setMsg(current => [...current, { id: crypto.randomUUID(), role: 'assistant', text: result.response }]);
      setOllamaAvailable(true);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Check that Ollama is running and configured.';
      setMsg(current => [...current, { id: crypto.randomUUID(), role: 'assistant', text: `The AI assistant is unavailable right now. ${reason}` }]);
      setOllamaAvailable(false);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const prompt = (location.state as { prompt?: unknown } | null)?.prompt;
    if (typeof prompt === 'string' && prompt.trim() && sentPromptKey.current !== location.key) {
      sentPromptKey.current = location.key;
      void send(prompt);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key, location.pathname, location.state, navigate]);

  const questions = ['Aaj business mein kya important hai?', 'Kitna safely spend kar sakta hoon?', 'Kaunsa stock kharidna chahiye?', 'Kis customer ka udhaar pending hai?'];
  return <><Header title="Your Business Coach" subtitle="Ask about your sales, cash, inventory or customers."/><div className="mobile-question-chips">{questions.map(x => <button key={x} onClick={() => void send(x)}>{x}</button>)}</div><div className="coach-layout"><Card className="coach-chat"><div className="coach-label"><Bot size={18}/>MysHopUpdates Coach <Badge tone={ollamaAvailable ? 'green' : 'amber'}>{ollamaAvailable === null ? 'Checking Ollama' : ollamaAvailable ? `Ollama ready${modelLabel}` : 'AI unavailable'}</Badge></div><div className="messages" aria-live="polite">{msg.map(x => <div className={`message ${x.role}`} key={x.id}>{x.role === 'assistant' && <span className="bot-dot"><Bot size={15}/></span>}<p>{x.text}</p>{x.role === 'assistant' && <SpeakButton text={x.text}/>}</div>)}{sending && <p className="voice-note" role="status">Checking your shop data...</p>}</div><div className="chat-input"><VoiceButton onText={t => { setDraft(t); void send(t); }} /><Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && void send()} placeholder="Ask about your business..."/><Button disabled={sending || !draft.trim()} onClick={() => void send()} aria-label="Send message"><Send size={18}/></Button></div><small className="voice-note">Speak in your selected language. Browser voice support may vary by device.</small></Card><aside className="question-panel"><h3>Try asking</h3>{questions.map(x => <button key={x} onClick={() => void send(x)}>{x}</button>)}<div className="coach-security"><ShieldCheck size={19}/><span><b>Your data stays yours.</b><br />Only this shop's recorded business data is sent to your configured Ollama service.</span></div></aside></div></>;
}
function GovernmentSchemes() {
  const [business, setBusiness] = useState<any>(null);
  useEffect(() => { api.getBusiness().then(setBusiness).catch(()=>{}); }, []);
  const schemes = [
    { name:'PMEGP', tag:'New micro-enterprise', desc:'Credit-linked support for eligible new micro-enterprises in the non-farm sector.', why:'Useful when you are starting or expanding a qualifying micro enterprise.', url:'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp' },
    { name:'CGTMSE', tag:'Credit support', desc:'Credit guarantee support that can help eligible micro and small enterprises access institutional credit.', why:'Relevant when working capital or business finance is needed without relying only on collateral.', url:'https://www.cgtmse.in/' },
    { name:'Udyam Registration', tag:'MSME foundation', desc:'Official MSME registration that can be important for accessing benefits and schemes.', why:'A useful first step for many eligible micro and small businesses.', url:'https://udyamregistration.gov.in/' },
  ];
  const language = getLanguage();
  return <><Header title="Government Schemes" subtitle="Discover schemes that may fit your business profile."/><Card className="scheme-hero"><div className="scheme-icon"><Landmark size={26}/></div><div><span className="eyebrow">MysHopUpdates BENEFITS INTELLIGENCE</span><h2>Government support, explained for your business</h2><p>{business?.name ? `${business.name} · ${business.owner_name ?? 'Business owner'}` : 'Your business profile'} · Language: {language === 'hi' ? 'हिन्दी' : language}</p><small>We show potential matches, not guaranteed eligibility. Final eligibility is decided by the official department, bank or implementing agency.</small></div></Card><div className="scheme-grid">{schemes.map(s=><Card className="scheme-card" key={s.name}><div className="scheme-card-top"><Badge tone="green">{s.tag}</Badge><span>Potential match</span></div><h3>{s.name}</h3><p>{s.desc}</p><div className="scheme-why"><strong>Why it may matter</strong><span>{s.why}</span></div><a className="button button-secondary" href={s.url} target="_blank" rel="noreferrer">View official information ↗</a></Card>)}</div><Card className="scheme-note"><strong>Planned intelligence layer</strong><span>Next: match Central + State schemes to business type, location, stage and eligibility signals, then explain required documents and application steps in text and voice.</span></Card></>;
}

function Settings() { const { user, activeBusiness } = useAuth(); return <><Header title="Settings" subtitle="MysHopUpdates business details and preferences."/><Card className="settings-card"><form className="settings-form"><h3>Business profile</h3><label>Business name<Input defaultValue={activeBusiness?.name ?? ''}/></label><label>Owner name<Input defaultValue={user?.name ?? ''}/></label><label>Business type<select><option>Kirana store</option><option>Retail shop</option></select></label><label>Preferred language<select><option>English</option><option>Hindi</option><option>Hinglish</option><option>Kannada</option></select></label><label>Currency<select><option>Indian Rupee (₹)</option></select></label><h3>Notifications</h3>{['Payment reminders', 'Inventory alerts'].map(x => <label className="toggle-row" key={x}><span><b>{x}</b><small>Receive useful business alerts.</small></span><input type="checkbox" defaultChecked/></label>)}<div><Button>Save changes</Button></div></form></Card></>; }
function Auth({ register = false }: { register?: boolean }) {
  const nav = useNavigate();
  const { login, register: createAccount } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    try {
      const user = register
        ? await createAccount(name, email, password)
        : await login(email, password);
      nav(register ? '/setup-shop' : user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="auth-page"><div className="auth-brand"><span className="brand-mark">M</span><strong>MysHopUpdates</strong></div><Card className="auth-card"><span className="eyebrow">WELCOME TO MYSHOPUPDATES</span><h1>{register ? 'Create your account.' : 'Welcome back.'}</h1><p>{register ? 'Create an account to set up your shop.' : 'Sign in to continue to your shop.'}</p><form className="auth-form" onSubmit={submit}>{register && <label>Name<Input name="name" required autoComplete="name" maxLength={150}/></label>}<label>Email<Input name="email" type="email" required autoComplete="email" maxLength={255} placeholder="you@example.com"/></label><label>Password<Input name="password" type="password" required autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} maxLength={128}/></label>{error && <p className="auth-error" role="alert">{error}</p>}<Button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}</Button></form><p className="auth-switch">{register ? 'Already have an account?' : 'New to MysHopUpdates?'} <a href={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</a></p></Card><p className="auth-tagline">Your business. Smarter decisions.</p></div>;
}

function ProtectedShopRoute({ children }: { children: React.ReactNode }) {
  const { user, businesses, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="auth-page"><p>Loading your session…</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
  if (user.role === 'admin') return <Navigate to="/admin" replace/>;
  if (!businesses.length && location.pathname !== '/setup-shop') return <Navigate to="/setup-shop" replace/>;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><p>Loading your session…</p></div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'admin') return <Navigate to={user.role === 'shop_owner' ? '/dashboard' : '/login'} replace/>;
  return <>{children}</>;
}

function ShopSetup() {
  const nav = useNavigate();
  const { user, businesses, refreshBusinesses } = useAuth();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (businesses.length) return <Navigate to="/dashboard" replace/>;
  return <div className="auth-page"><Card className="auth-card"><span className="eyebrow">SHOP SETUP</span><h1>Your account is ready.</h1><p>Create your shop to open your business dashboard.</p><form className="auth-form" onSubmit={async event => { event.preventDefault(); setError(''); setSaving(true); const form = new FormData(event.currentTarget); try { await api.postBusiness({ name: String(form.get('shop_name')).trim(), owner_name: String(form.get('owner_name')).trim() }); await refreshBusinesses(); nav('/dashboard'); } catch (err) { setError(err instanceof Error ? err.message : 'Could not create your shop.'); } finally { setSaving(false); } }}><label>Shop name<Input name="shop_name" required maxLength={150}/></label><label>Owner name<Input name="owner_name" required maxLength={150} defaultValue={user?.name}/></label>{error && <p className="auth-error" role="alert">{error}</p>}<Button className="auth-submit" disabled={saving}>{saving ? 'Creating shop…' : 'Create shop'}</Button></form></Card></div>;
}

function AdminDashboard() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const nav = useNavigate();
  const load = () => api.getAdminOverview().then(setData).catch(err => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  return <main className="admin-page"><header className="admin-header"><div><span className="eyebrow">MYSHOPUPDATES</span><h1>Admin dashboard</h1><p>Manage accounts and assign existing shops to their owners.</p></div><Button variant="secondary" onClick={async () => { await logout(); nav('/login'); }}>Log out</Button></header>{message && <p className="auth-success" role="status">{message}</p>}{error && <p className="auth-error" role="alert">{error}</p>}{loading ? <p>Loading admin dashboard…</p> : data && <><div className="admin-stats"><Card><span>Registered accounts</span><strong>{data.user_count}</strong></Card><Card><span>Shops</span><strong>{data.shop_count}</strong></Card><Card><span>Unassigned legacy shops</span><strong>{data.unassigned_businesses.length}</strong></Card></div><Card className="admin-card"><h2>Unassigned existing shops</h2>{data.unassigned_businesses.length ? <div className="table-scroll"><table><thead><tr><th>Shop</th><th>Previous owner name</th><th>Assign to account</th><th></th></tr></thead><tbody>{data.unassigned_businesses.map(shop => <tr key={shop.id}><td>{shop.name}</td><td>{shop.owner_name}</td><td><select value={assignments[shop.id] ?? ''} onChange={event => setAssignments(value => ({ ...value, [shop.id]: event.target.value }))}><option value="">Select shop owner</option>{data.users.map(owner => <option key={owner.id} value={owner.email}>{owner.name} · {owner.email}</option>)}</select></td><td><Button disabled={!assignments[shop.id]} onClick={async () => { setError(''); setMessage(''); try { const result = await api.assignBusinessOwner(shop.id, assignments[shop.id]); setMessage(result.message); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not assign shop.'); } }}>{'Assign'}</Button></td></tr>)}</tbody></table></div> : <p className="admin-empty">No unassigned shops. New owners create shops from their setup screen.</p>}</Card></>}</main>;
}

function RoutesApp() {
  const [sales, setSales] = useState(initialSales), [items, setItems] = useState(seedExpenses);
  const page = (x: React.ReactNode) => <ProtectedShopRoute><AppLayout>{x}</AppLayout></ProtectedShopRoute>;
  return <Routes><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route path="/login" element={<Auth />}/><Route path="/register" element={<Auth register/>}/><Route path="/setup-shop" element={<ProtectedShopRoute><ShopSetup/></ProtectedShopRoute>}/><Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>}/><Route path="/dashboard" element={page(<Dashboard sales={sales}/>)}/><Route path="/sales" element={page(<Sales sales={sales} setSales={setSales}/>)}/><Route path="/purchases" element={page(<Purchases />)}/><Route path="/products" element={page(<Products />)}/><Route path="/inventory" element={page(<Inventory />)}/><Route path="/expenses" element={page(<Expenses items={items} setItems={setItems}/>)}/><Route path="/udhaar" element={page(<Udhaar />)}/><Route path="/customers" element={page(<Customers />)}/><Route path="/debt" element={page(<DebtCoach />)} /><Route path="/schemes" element={page(<GovernmentSchemes />)}/><Route path="/coach" element={page(<Coach />)}/><Route path="/settings" element={page(<Settings />)}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes>;
}
export default function App() { return <BrowserRouter><AuthProvider><RoutesApp /></AuthProvider></BrowserRouter>; }
function InsightDashboard({ sales }: {
    sales: Sale[];
}) {
    useLanguage();
    const t = getTranslations();
    const navigate = useNavigate();
    const { user, activeBusiness } = useAuth();
    const displayName = user?.name?.trim() || user?.email || 'there';
    const greeting = getTimeGreeting();
    const [draft, setDraft] = useState('');
    const ask = (question = draft.trim()) => navigate('/coach', { state: { prompt: question } });
    const attention = [
        { label: 'TUR DAL', title: 'Margin fell from 27% to 22%', why: 'Your supplier cost may be reducing your profit.', action: 'Review supplier price', button: 'Review Product →', to: '/products' },
        { label: 'UDHAAR', title: '₹18,000 is outstanding', why: '3 customers have pending payments.', action: 'Follow up with customers', button: 'View Udhaar →', to: '/udhaar' },
        { label: 'RICE', title: 'Only 7 days of stock remaining', why: 'Recent sales are averaging about 5 kg/day.', action: 'Recommended purchase: 15 kg', button: 'Review Purchase →', to: '/purchases' }
    ];
    return <><section className="dashboard-greeting"><div><span className="eyebrow">MysHopUpdates | {activeBusiness?.name ?? 'MysHopUpdates'} | {t.common.today}</span><h2>{greeting}, {displayName}</h2><p>{t.dashboard.subtitle}</p></div></section><section className="cash-hero"><div><span>{t.dashboard.safeToSpend.toUpperCase()}</span><h1>₹27,500</h1><p>After upcoming payments and safety buffer</p><button onClick={() => navigate('/expenses')}>View cash breakdown →</button></div><div className="cash-breakdown"><div><span>{t.dashboard.cashAvailable}</span><strong>₹54,000</strong></div><div><span>Upcoming obligations</span><strong>− ₹15,000</strong></div><div><span>Safety buffer</span><strong>− ₹11,500</strong></div></div></section><section className="quick-actions insight-actions"><h3>{t.dashboard.quickActions}</h3><div><button onClick={() => navigate('/sales')}><Plus />{t.actions.recordSale}</button><button onClick={() => navigate('/expenses')}><Plus />{t.actions.addExpense}</button><button onClick={() => navigate('/udhaar')}><Plus />{t.actions.addUdhaar}</button><button onClick={() => navigate('/purchases')}><ShoppingBag />{t.actions.addPurchase}</button></div></section><section className="brains-insight"><div className="insight-mark"><Bot size={22}/></div><div><span className="eyebrow">{t.dashboard.mysHopUpdatesSays}</span><h2>Your biggest priority today is collecting udhaar.</h2><p>₹18,000 is pending from 3 customers. Collecting this will improve your available cash before the next supplier payment.</p><Button onClick={() => navigate('/udhaar')}>{t.actions.viewUdhaar} →</Button></div></section><section className="attention-section"><div className="section-heading"><div><span className="eyebrow">{t.dashboard.insightAction}</span><h2>{t.dashboard.whatNeedsAttention}</h2></div><p>Every signal comes with a recommended next step.</p></div><div className="attention-grid">{attention.map(item => <article className="attention-item" key={item.label}><span className="attention-label">{item.label}</span><h3>{item.title}</h3><div><span>Why it matters</span><p>{item.why}</p></div><div><span>Recommended action</span><strong>{item.action}</strong></div><button onClick={() => navigate(item.to)}>{item.button}</button></article>)}</div></section><section className="business-section"><div className="section-heading"><div><span className="eyebrow">TODAY’S BUSINESS</span><h2>Keep the essentials in view</h2></div></div><div className="today-grid"><div className="today-stat"><CircleDollarSign /><span>{t.dashboard.recordedSales}</span><strong>₹12,400</strong><small>↑ 12.4% from yesterday</small></div><div className="today-stat"><TrendingUp /><span>{t.dashboard.recordedProfit}</span><strong>₹3,100</strong><small>25% average margin</small></div><div className="today-stat"><CreditCard /><span>{t.dashboard.outstandingUdhaar}</span><strong>₹18,000</strong><small>3 customers to follow up</small></div></div><div className="dashboard-grid insight-grid"><Card className="sales-chart"><div className="card-title"><div><h3>Sales movement</h3><p>Last 7 days</p></div><strong>₹77,900 <small>↑ 14.8%</small></strong></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={salesTrend}><defs><linearGradient id="salesInsight" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#176B5B" stopOpacity=".24"/><stop offset="1" stopColor="#176B5B" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#ebeeeb"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis tickFormatter={x => `₹${x / 1000}k`} axisLine={false} tickLine={false}/><Tooltip formatter={x => money(Number(x))}/><Area type="monotone" dataKey="sales" stroke="#176B5B" strokeWidth={3} fill="url(#salesInsight)"/></AreaChart></ResponsiveContainer></div></Card><div className="inventory-brief"><div><span className="eyebrow">STOCK TO WATCH</span><h3>Rice needs attention soon</h3><p><b>35 kg</b> in stock · <b>7 days</b> remaining</p></div><Button variant="secondary" onClick={() => navigate('/inventory')}>{t.actions.reviewStock} →</Button></div></div></section><section className="dashboard-coach"><div><span className="eyebrow">🧠 {t.dashboard.askMysHopUpdates}</span><h2>Aaj business mein kya important hai?</h2><p>Ask about sales, cash, stock or customers.</p></div><div className="dashboard-ask"><button className="icon-button" onClick={() => ask()} aria-label="Voice input"><Mic size={20}/></button><Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder={t.coach.placeholder}/><Button onClick={() => ask()} aria-label={t.actions.askMysHopUpdates}><Send size={17}/></Button></div><div className="dashboard-prompts"><button onClick={() => ask(t.coach.todayImportant)}>{t.coach.todayImportant}</button><button onClick={() => ask(t.coach.safeSpendQuestion)}>{t.coach.safeSpendQuestion}</button><button onClick={() => ask(t.coach.stockQuestion)}>{t.coach.stockQuestion}</button><button onClick={() => ask(t.coach.udhaarQuestion)}>{t.coach.udhaarQuestion}</button></div></section><section className="recent-sales insight-recent"><div className="section-heading"><div><span className="eyebrow">{t.dashboard.latestSales}</span><h2>{t.dashboard.recentSales}</h2></div><button className="text-button" onClick={() => navigate('/sales')}>{t.common.viewAll} sales →</button></div><Table sales={sales.slice(0, 4)}/></section></>; }

const Dashboard = InsightDashboard;
