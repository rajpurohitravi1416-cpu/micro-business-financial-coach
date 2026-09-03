from pydantic import BaseModel


class CashFlowResponse(BaseModel):
    business_id: int
    cash_sales: float
    udhaar_collected: float
    cash_purchases: float
    cash_expenses: float
    net_cash_flow: float
    outstanding_udhaar: float
