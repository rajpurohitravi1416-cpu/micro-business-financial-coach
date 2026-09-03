import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, HandCoins, Lightbulb, Plus, Target, TrendingDown } from 'lucide-react';
import { api } from './services/api';
import type { ApiLoan } from './services/api';
import { Badge, Button, Card, Input, Modal } from './components/ui';
import { useLanguage } from './i18n';
import { getDebtText } from './debtI18n';

const money=(n:number)=>`₹${Math.round(n).toLocaleString('en-IN')}`;
const fill=(s:string, vars:Record<string,string>)=>s.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');

function LoanModal({close,save,lang}:{close:()=>void;save:(x:Record<string,unknown>)=>Promise<void>;lang:ReturnType<typeof useLanguage>}){
  const t=getDebtText(lang); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  return <Modal title={t.addLoanDebt} onClose={close}><form className="form-grid" onSubmit={async e=>{e.preventDefault();setError('');const f=new FormData(e.currentTarget);const data={lender:String(f.get('lender')),loan_type:String(f.get('loan_type')),original_amount:Number(f.get('original_amount')),outstanding_amount:Number(f.get('outstanding_amount')),interest_rate:Number(f.get('interest_rate')||0),monthly_emi:Number(f.get('monthly_emi')||0),next_due_date:String(f.get('next_due_date')||'')||null};if(data.outstanding_amount<=0){setError(t.enterOutstanding);return}setSaving(true);try{await save(data);close()}catch(err){setError(err instanceof Error?err.message:t.couldNotSave)}finally{setSaving(false)}}}>
    <label>{t.lender}<Input name="lender" required placeholder={t.lenderPlaceholder}/></label>
    <label>{t.loanType}<select name="loan_type" defaultValue={t.loanTypes.business}><option>{t.loanTypes.business}</option><option>{t.loanTypes.working}</option><option>{t.loanTypes.equipment}</option><option>{t.loanTypes.supplier}</option><option>{t.loanTypes.personal}</option><option>{t.loanTypes.other}</option></select></label>
    <label>{t.originalAmount}<Input name="original_amount" required min="1" type="number"/></label>
    <label>{t.currentOutstanding}<Input name="outstanding_amount" required min="1" type="number"/></label>
    <label>{t.interestRate}<Input name="interest_rate" min="0" step="0.01" type="number" placeholder="18"/></label>
    <label>{t.monthlyPayment}<Input name="monthly_emi" min="0" step="1" type="number" placeholder="5000"/></label>
    <label>{t.nextDue}<Input name="next_due_date" type="date"/></label>
    {error&&<div className="inventory-intro"><AlertTriangle size={17}/><p>{error}</p></div>}
    <div className="modal-actions"><Button variant="secondary" type="button" onClick={close}>{t.cancel}</Button><Button disabled={saving}>{saving?t.saving:t.addLoan}</Button></div>
  </form></Modal>
}

export function DebtCoach(){
 const lang=useLanguage(); const t=getDebtText(lang);
const [loans, setLoans] = useState<ApiLoan[]>([]);
const [m, setM] = useState(false);
const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
const [paymentLoan, setPaymentLoan] = useState<ApiLoan | null>(null);
const [payment, setPayment] = useState('');
const [, setError] = useState('');
 const load=()=>api.getLoans().then(setLoans).catch(e=>setError(e.message)); useEffect(()=>{load()},[]);
 const total=useMemo(()=>loans.reduce((a,l)=>a+l.outstanding_amount,0),[loans]);
 const emi=useMemo(()=>loans.reduce((a,l)=>a+l.monthly_emi,0),[loans]);
 const weighted=total?loans.reduce((a,l)=>a+l.outstanding_amount*l.interest_rate,0)/total:0;
 const ranked=[...loans].sort((a,b)=>strategy==='avalanche'?b.interest_rate-a.interest_rate||b.outstanding_amount-a.outstanding_amount:a.outstanding_amount-b.outstanding_amount);
 const highest=loans.reduce<ApiLoan|null>((best,l)=>!best||l.interest_rate>best.interest_rate?l:best,null);
 const ideas:string[]=[];
 if(!loans.length) ideas.push(t.addLoansFirst);
 else { if(highest&&highest.interest_rate>=15) ideas.push(fill(t.prioritize,{lender:highest.lender,rate:String(highest.interest_rate)})); if(loans.length>1) ideas.push(t.minimumPayments); ideas.push(t.surplusCash); ideas.push(t.collectUdhaar); if(weighted>=18) ideas.push(t.refinance); ideas.push(t.avoidShortTerm); }
 return <><div className="debt-hero"><div className="debt-hero-icon"><HandCoins/></div><div><span className="eyebrow">{t.heroEyebrow}</span><h2>{t.heroTitle}</h2><p>{t.heroDesc}</p></div><Button onClick={()=>setM(true)}><Plus size={17}/>{t.addLoan}</Button></div>
 <div className="debt-stats"><Card><span>{t.totalOutstanding}</span><strong>{money(total)}</strong><small>{loans.length} {loans.length===1?t.activeLoan:t.activeLoans}</small></Card><Card><span>{t.monthlyEmi}</span><strong>{money(emi)}</strong><small>{t.minPayments}</small></Card><Card><span>{t.weightedInterest}</span><strong>{weighted.toFixed(1)}%</strong><small>{t.acrossDebt}</small></Card><Card className={total?'debt-focus':''}><span>{t.strategy}</span><strong>{strategy==='avalanche'?t.highInterest:t.smallestBalance}</strong><small>{t.chooseStrategy}</small></Card></div>
 <div className="debt-layout"><Card className="debt-plan"><div className="section-heading"><div><span className="eyebrow">{t.repaymentPlan}</span><h2>{t.whereExtra}</h2></div><div className="strategy-toggle"><button className={strategy==='avalanche'?'selected':''} onClick={()=>setStrategy('avalanche')}>{t.highInterest}</button><button className={strategy==='snowball'?'selected':''} onClick={()=>setStrategy('snowball')}>{t.smallestBalance}</button></div></div>
 {ranked.length?<div className="debt-list">{ranked.map((l,i)=><div className="debt-row" key={l.id}><div className="debt-rank">{i+1}</div><div className="debt-main"><strong>{l.lender}</strong><span>{l.loan_type} · {l.interest_rate}% · EMI {money(l.monthly_emi)}</span><div className="debt-progress"><i style={{width:`${Math.min(100,Math.max(3,(l.outstanding_amount/Math.max(l.original_amount,1))*100))}%`}}/></div></div><div className="debt-amount"><strong>{money(l.outstanding_amount)}</strong><small>{t.outstanding}</small><button onClick={()=>{setPaymentLoan(l);setPayment('')}}>{t.recordPayment}</button></div></div>)}</div>:<div className="empty-state"><HandCoins size={30}/><strong>{t.noLoans}</strong><span>{t.addLoanPlan}</span><Button onClick={()=>setM(true)}>{t.addFirstLoan}</Button></div>}
 </Card>
 <Card className="debt-ideas"><div className="coach-label"><Lightbulb size={18}/>{t.ideas} <Badge tone="green">{t.actionable}</Badge></div>{ideas.map((x,i)=><div className="debt-idea" key={i}><CheckCircle2 size={17}/><span>{x}</span></div>)}<div className="debt-rule"><Target size={18}/><div><strong>{t.rule}</strong><p>{t.ruleText}</p></div></div></Card></div>
 <Card className="debt-next"><div><span className="eyebrow">{t.nextStep}</span><h2>{t.nextTitle}</h2><p>{t.nextDesc}</p></div><TrendingDown size={38}/></Card>
 {m&&<LoanModal lang={lang} close={()=>setM(false)} save={async x=>{await api.postLoan(x);await load()}}/>}
 {paymentLoan&&<Modal title={fill(t.paymentTitle,{lender:paymentLoan.lender})} onClose={()=>setPaymentLoan(null)}><form className="form-grid" onSubmit={async e=>{e.preventDefault();const amount=Number(payment);if(!amount||amount<=0)return;await api.postLoanPayment(paymentLoan.id,amount);setPaymentLoan(null);await load()}}><label>{t.paymentAmount}<Input type="number" min="1" max={paymentLoan.outstanding_amount} value={payment} onChange={e=>setPayment(e.target.value)} required/></label><div className="inventory-intro"><CheckCircle2 size={17}/><p>{t.paymentNote}</p></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setPaymentLoan(null)}>{t.cancel}</Button><Button>{t.recordPaymentBtn}</Button></div></form></Modal>}
 </>;
}
