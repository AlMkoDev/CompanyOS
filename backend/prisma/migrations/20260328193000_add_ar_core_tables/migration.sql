-- Bootstrap legacy AR core tables for staging databases that never received
-- the receivables schema through Prisma migrations.
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tax_pin" TEXT,
    "contact" JSONB,
    "credit_limit" DECIMAL(15,2),
    "payment_terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ARInvoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ARInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "recorded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreditMemo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "issued_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditMemo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CollectionCase" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "assigned_to" UUID,
    "escalation_level" INTEGER NOT NULL DEFAULT 1,
    "last_action_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionCase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Customer_company_id_idx" ON "Customer"("company_id");
CREATE INDEX IF NOT EXISTS "ARInvoice_company_id_idx" ON "ARInvoice"("company_id");
CREATE INDEX IF NOT EXISTS "ARInvoice_customer_id_idx" ON "ARInvoice"("customer_id");
CREATE INDEX IF NOT EXISTS "ARInvoice_due_date_idx" ON "ARInvoice"("due_date");
CREATE INDEX IF NOT EXISTS "Payment_company_id_idx" ON "Payment"("company_id");
CREATE INDEX IF NOT EXISTS "Payment_invoice_id_idx" ON "Payment"("invoice_id");
CREATE INDEX IF NOT EXISTS "CreditMemo_company_id_idx" ON "CreditMemo"("company_id");
CREATE INDEX IF NOT EXISTS "CreditMemo_customer_id_idx" ON "CreditMemo"("customer_id");
CREATE INDEX IF NOT EXISTS "CreditMemo_invoice_id_idx" ON "CreditMemo"("invoice_id");
CREATE INDEX IF NOT EXISTS "CollectionCase_company_id_idx" ON "CollectionCase"("company_id");
CREATE INDEX IF NOT EXISTS "CollectionCase_invoice_id_idx" ON "CollectionCase"("invoice_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Customer_company_id_fkey'
          AND table_name = 'Customer'
    ) THEN
        ALTER TABLE "Customer"
        ADD CONSTRAINT "Customer_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ARInvoice_company_id_fkey'
          AND table_name = 'ARInvoice'
    ) THEN
        ALTER TABLE "ARInvoice"
        ADD CONSTRAINT "ARInvoice_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ARInvoice_customer_id_fkey'
          AND table_name = 'ARInvoice'
    ) THEN
        ALTER TABLE "ARInvoice"
        ADD CONSTRAINT "ARInvoice_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Payment_company_id_fkey'
          AND table_name = 'Payment'
    ) THEN
        ALTER TABLE "Payment"
        ADD CONSTRAINT "Payment_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Payment_invoice_id_fkey'
          AND table_name = 'Payment'
    ) THEN
        ALTER TABLE "Payment"
        ADD CONSTRAINT "Payment_invoice_id_fkey"
        FOREIGN KEY ("invoice_id") REFERENCES "ARInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CreditMemo_company_id_fkey'
          AND table_name = 'CreditMemo'
    ) THEN
        ALTER TABLE "CreditMemo"
        ADD CONSTRAINT "CreditMemo_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CreditMemo_customer_id_fkey'
          AND table_name = 'CreditMemo'
    ) THEN
        ALTER TABLE "CreditMemo"
        ADD CONSTRAINT "CreditMemo_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CreditMemo_invoice_id_fkey'
          AND table_name = 'CreditMemo'
    ) THEN
        ALTER TABLE "CreditMemo"
        ADD CONSTRAINT "CreditMemo_invoice_id_fkey"
        FOREIGN KEY ("invoice_id") REFERENCES "ARInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CollectionCase_company_id_fkey'
          AND table_name = 'CollectionCase'
    ) THEN
        ALTER TABLE "CollectionCase"
        ADD CONSTRAINT "CollectionCase_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CollectionCase_invoice_id_fkey'
          AND table_name = 'CollectionCase'
    ) THEN
        ALTER TABLE "CollectionCase"
        ADD CONSTRAINT "CollectionCase_invoice_id_fkey"
        FOREIGN KEY ("invoice_id") REFERENCES "ARInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
