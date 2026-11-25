import json
import os
from datetime import datetime
from urllib.parse import urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Business, Product, Purchase, Sale, Expense, Udhaar, User

router = APIRouter(prefix="/coach", tags=["Coach"])


class CoachQuestion(BaseModel):
    message: str = Field(min_length=1, max_length=500)


def ollama_settings() -> tuple[str, str]:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    configured_model = os.getenv("OLLAMA_MODEL", "").strip()
    hostname = (urlparse(base_url).hostname or "").lower()
    local_default = "qwen3:8b" if hostname in {"localhost", "127.0.0.1", "host.docker.internal"} else ""
    model = configured_model or local_default
    return base_url, model


def ollama_headers(base_url: str) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("OLLAMA_API_KEY", "").strip()
    hostname = (urlparse(base_url).hostname or "").lower()
    if api_key and hostname in {"ollama.com", "www.ollama.com"}:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def ollama_status(base_url: str, model: str) -> dict:
    if not model:
        return {
            "configured": False,
            "available": False,
            "model": None,
            "message": "Ollama is not configured. Set OLLAMA_MODEL to a model supported by the selected Ollama service.",
        }
    try:
        with urlopen(Request(f"{base_url}/api/tags", headers=ollama_headers(base_url)), timeout=2) as response:
            models = json.loads(response.read().decode("utf-8")).get("models", [])
        names = {item.get("name") or item.get("model") for item in models}
        available = model in names or f"{model}:latest" in names
        return {
            "configured": True,
            "available": available,
            "model": model,
            "message": "Ollama is ready." if available else f"Model '{model}' is not available in Ollama.",
        }
    except HTTPError as error:
        if error.code in {401, 403}:
            message = "Ollama Cloud authentication failed. Check OLLAMA_API_KEY in the backend environment."
        else:
            message = "Ollama is unavailable. Check OLLAMA_BASE_URL and the selected model."
        return {
            "configured": True,
            "available": False,
            "model": model,
            "message": message,
        }
    except (URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError):
        return {
            "configured": True,
            "available": False,
            "model": model,
            "message": "Ollama is unavailable. Start Ollama and check OLLAMA_BASE_URL.",
        }


def business_ai_context(db: Session, business: Business) -> dict:
    business_id = business.id
    sales = db.query(Sale).filter(Sale.business_id == business_id).all()
    purchases = db.query(Purchase).filter(Purchase.business_id == business_id).all()
    expenses = db.query(Expense).filter(Expense.business_id == business_id).all()
    products = db.query(Product).filter(Product.business_id == business_id).all()
    udhaar_records = db.query(Udhaar).filter(Udhaar.business_id == business_id).all()
    open_udhaar = [
        record for record in udhaar_records
        if max(record.amount - record.amount_paid, 0) > 0
    ]
    today = datetime.utcnow().date()
    overdue = [
        record for record in open_udhaar
        if record.due_date is not None and record.due_date.date() < today
    ]
    return {
        "shop_name": business.name,
        "period": "All records currently stored for this shop",
        "sales": {
            "record_count": len(sales),
            "total_amount": round(sum(row.total_amount for row in sales), 2),
            "recorded_profit": round(sum(row.profit for row in sales), 2),
        },
        "purchases": {
            "record_count": len(purchases),
            "total_amount": round(sum(row.total_amount for row in purchases), 2),
        },
        "expenses": {
            "record_count": len(expenses),
            "total_amount": round(sum(row.amount for row in expenses), 2),
        },
        "inventory": [
            {
                "name": product.name,
                "category": product.category,
                "stock_quantity": product.stock_quantity,
                "minimum_stock": product.minimum_stock,
            }
            for product in products
        ],
        "udhaar": {
            "open_record_count": len(open_udhaar),
            "outstanding_amount": round(
                sum(max(row.amount - row.amount_paid, 0) for row in open_udhaar), 2
            ),
            "overdue_record_count": len(overdue),
            "overdue_amount": round(
                sum(max(row.amount - row.amount_paid, 0) for row in overdue), 2
            ),
        },
    }


@router.get("/business/{business_id}")
def get_business_coach(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    sales = (
        db.query(Sale)
        .filter(Sale.business_id == business_id)
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(Expense.business_id == business_id)
        .all()
    )

    udhaar_records = (
        db.query(Udhaar)
        .filter(Udhaar.business_id == business_id)
        .all()
    )

    products = (
        db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    )

    total_sales = sum(sale.total_amount for sale in sales)
    total_profit = sum(sale.profit for sale in sales)
    total_expenses = sum(expense.amount for expense in expenses)

    net_profit = total_profit - total_expenses

    outstanding_udhaar = sum(
        max(udhaar.amount - udhaar.amount_paid, 0)
        for udhaar in udhaar_records
    )

    low_stock_products = [
        {
            "id": product.id,
            "name": product.name,
            "stock_quantity": product.stock_quantity,
            "minimum_stock": product.minimum_stock,
        }
        for product in products
        if product.stock_quantity <= product.minimum_stock
    ]

    insights = []

    # Profit insight
    if net_profit < 0:
        insights.append(
            "Your business is currently running at a loss. "
            "Review expenses and improve profit margins."
        )
    elif net_profit == 0:
        insights.append(
            "Your business is currently breaking even. "
            "Focus on increasing margins and controlling expenses."
        )
    else:
        insights.append(
            "Your business is profitable. "
            "Continue monitoring expenses and margins."
        )

    # Expense insight
    if total_sales > 0 and total_expenses > total_sales:
        insights.append(
            "Your expenses are higher than your sales revenue. "
            "Identify and reduce unnecessary expenses."
        )

    # Udhaar insight
    if outstanding_udhaar > 0:
        insights.append(
            f"You have ₹{outstanding_udhaar:.0f} in outstanding Udhaar. "
            "Follow up with customers to improve cash flow."
        )

    # Low stock insight
    if low_stock_products:
        insights.append(
            f"{len(low_stock_products)} product(s) are at or below "
            "their minimum stock level. Consider restocking."
        )
    else:
        insights.append(
            "Your current inventory has no products below the "
            "minimum stock level."
        )

    # Sales insight
    if total_sales == 0:
        insights.append(
            "No sales have been recorded yet."
        )
    elif total_profit / total_sales < 0.10:
        insights.append(
            "Your current profit margin is below 10%. "
            "Review product pricing and purchase costs."
        )
    else:
        insights.append(
            "Your current sales are generating a reasonable "
            "gross profit margin."
        )

    return {
        "business_id": business_id,
        "summary": {
            "total_sales": total_sales,
            "total_profit": total_profit,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "outstanding_udhaar": outstanding_udhaar,
        },
        "insights": insights,
        "low_stock_products": low_stock_products,
    }


@router.get("/business/{business_id}/status")
def get_ollama_status(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    base_url, model = ollama_settings()
    return ollama_status(base_url, model)


@router.post("/business/{business_id}/ask")
def ask_business_coach(
    business_id: int,
    question: CoachQuestion,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business_access(db, current_user, business_id)
    base_url, model = ollama_settings()
    if not model:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not configured. Set OLLAMA_MODEL to a model supported by the selected Ollama service.",
        )

    context = business_ai_context(db, business)
    payload = {
        "model": model,
        "stream": False,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are the MysHopUpdates shop assistant. Answer shop-management questions "
                    "using only the factual shop data supplied in the user's message. Do not "
                    "invent sales, balances, stock, customer details, dates, or statistics. If "
                    "the data does not answer a question, say what is missing. Clearly label "
                    "advice as a suggestion, and keep the answer short and practical."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Shop data (JSON): {json.dumps(context, ensure_ascii=False)}\n\n"
                    f"Shop owner's question: {question.message.strip()}"
                ),
            },
        ],
    }
    request = Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers=ollama_headers(base_url),
        method="POST",
    )
    try:
        with urlopen(request, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code in {401, 403}:
            detail = "Ollama Cloud authentication failed. Check OLLAMA_API_KEY in the backend environment."
        elif error.code == 404:
            detail = f"Ollama could not find model '{model}'. Pull that model and try again."
        else:
            detail = "Ollama could not complete the request. Check that the server and model are running."
        raise HTTPException(status_code=503, detail=detail) from error
    except (URLError, TimeoutError, OSError) as error:
        raise HTTPException(
            status_code=503,
            detail="Ollama is unavailable. Start Ollama and check OLLAMA_BASE_URL.",
        ) from error
    except (ValueError, TypeError) as error:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned a response the assistant could not read.",
        ) from error

    if result.get("error"):
        raise HTTPException(
            status_code=503,
            detail=f"Ollama model '{model}' is unavailable. Check that the model is installed.",
        )
    answer = result.get("message", {}).get("content", "").strip()
    if not answer:
        raise HTTPException(status_code=502, detail="Ollama returned an empty answer.")
    return {"message": question.message, "response": answer, "source": "ollama", "model": model}
