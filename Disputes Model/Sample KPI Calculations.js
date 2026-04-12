// Revenue at Risk (displayed on Revenue KPI card tooltip)
revenueAtRisk = sum(disputes.where(status IN ['OPEN','UNDER_REVIEW']).disputed_amount)

// Collection Effectiveness Index (CEI) adjustment
adjustedCEI = (CashCollected + ResolvedDisputeAmount) / (OpeningAR + NewInvoices - ResolvedDisputeAmount) * 100

// Health Score penalty factor
healthPenalty = min(15, (overdueDisputeValue / totalAR) * 100) // max 15-point deduction