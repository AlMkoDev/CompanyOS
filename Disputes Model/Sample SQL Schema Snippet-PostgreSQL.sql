CREATE TABLE dispute_case (
    dispute_id VARCHAR(20) PRIMARY KEY,
    invoice_id VARCHAR(20) NOT NULL REFERENCES invoice(invoice_id),
    customer_id VARCHAR(20) NOT NULL REFERENCES customer(customer_id),
    status VARCHAR(20) CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','ESCALATED','CLOSED')),
    priority VARCHAR(10) CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    dispute_type VARCHAR(30) NOT NULL,
    disputed_amount DECIMAL(12,2) NOT NULL CHECK (disputed_amount > 0),
    resolved_amount DECIMAL(12,2) CHECK (resolved_amount >= 0),
    raised_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL, -- SLA target
    resolved_date DATE,
    root_cause_code VARCHAR(50),
    resolution_notes TEXT,
    assigned_to VARCHAR(20) REFERENCES users(user_id),
    created_by VARCHAR(20) REFERENCES users(user_id) DEFAULT CURRENT_USER,
    affects_revenue BOOLEAN DEFAULT true,
    blocks_payment BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for North Ledger dashboard performance
CREATE INDEX idx_dispute_status_priority ON dispute_case(status, priority);
CREATE INDEX idx_dispute_customer ON dispute_case(customer_id, raised_date);
CREATE INDEX idx_dispute_revenue_impact ON dispute_case(affects_revenue, disputed_amount) WHERE status IN ('OPEN','UNDER_REVIEW');