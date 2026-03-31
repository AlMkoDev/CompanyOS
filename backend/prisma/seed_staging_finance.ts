import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANY_NAME = 'Verdant Fields Staging';

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getCompanyContext() {
  const company = await prisma.company.findFirst({
    where: { name: COMPANY_NAME },
    include: {
      users: {
        orderBy: { created_at: 'asc' },
        take: 5,
      },
      departments: {
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!company) {
    throw new Error(`Company "${COMPANY_NAME}" was not found.`);
  }

  const primaryUser = company.users[0];
  if (!primaryUser) {
    throw new Error(`Company "${COMPANY_NAME}" has no users to attach seeded finance records to.`);
  }

  return {
    company,
    primaryUser,
    departmentId: company.departments[0]?.id ?? null,
  };
}

async function ensureGlAccount(companyId: string, code: string, name: string, type: string) {
  const existing = await prisma.gLAccount.findFirst({
    where: {
      company_id: companyId,
      code,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.gLAccount.create({
    data: {
      company_id: companyId,
      code,
      name,
      type,
    },
  });
}

async function main() {
  const now = new Date();
  const { company, primaryUser, departmentId } = await getCompanyContext();

  const cashAccount = await ensureGlAccount(company.id, '1000', 'Main Bank Account', 'asset');
  const arAccount = await ensureGlAccount(company.id, '1100', 'Accounts Receivable', 'asset');
  const apAccount = await ensureGlAccount(company.id, '2000', 'Accounts Payable', 'liability');
  const revenueAccount = await ensureGlAccount(company.id, '4000', 'Produce Sales', 'revenue');

  const vendor =
    (await prisma.vendor.findFirst({
      where: {
        company_id: company.id,
        name: 'Highveld Produce Suppliers',
      },
    })) ??
    (await prisma.vendor.create({
      data: {
        company_id: company.id,
        name: 'Highveld Produce Suppliers',
        registration_no: 'HV-REG-001',
        tax_pin: 'HV-TAX-001',
        payment_terms: 'Net 14',
        status: 'active',
        tier: 'Preferred',
        bank_details: {
          account_name: 'Highveld Produce Suppliers',
          account_number: '4500123456',
          bank_name: 'First National Bank',
          branch_code: '250655',
        },
      },
    }));

  const requisition =
    (await prisma.aPRequisition.findFirst({
      where: {
        company_id: company.id,
        requisition_no: 'APRQ-STG-001',
      },
    })) ??
    (await prisma.aPRequisition.create({
      data: {
        company_id: company.id,
        requisition_no: 'APRQ-STG-001',
        requester_id: primaryUser.id,
        approver_id: primaryUser.id,
        vendor_id: vendor.id,
        department_id: departmentId,
        title: 'Baby marrow packaging materials',
        justification: 'Packaging replenishment for week-ahead dispatches.',
        amount_estimate: 28750,
        status: 'pending_approval',
        requires_secondary_approval: true,
        line_items: [
          { description: 'Ventilated cartons', quantity: 250, unit_price: 85 },
          { description: 'Cooling liners', quantity: 100, unit_price: 75 },
        ],
      },
    }));

  const purchaseOrder =
    (await prisma.purchaseOrder.findFirst({
      where: {
        company_id: company.id,
        vendor_id: vendor.id,
        status: 'approved',
      },
      orderBy: { created_at: 'asc' },
    })) ??
    (await prisma.purchaseOrder.create({
      data: {
        company_id: company.id,
        vendor_id: vendor.id,
        raised_by: primaryUser.id,
        approved_by: primaryUser.id,
        status: 'approved',
        total: 28750,
        items: [
          { sku: 'PKG-CARTON', description: 'Ventilated cartons', quantity: 250, price: 85 },
          { sku: 'PKG-LINER', description: 'Cooling liners', quantity: 100, price: 75 },
        ],
      },
    }));

  const vendorBill =
    (await prisma.invoice.findFirst({
      where: {
        company_id: company.id,
        invoice_no: 'VB-STG-001',
      },
    })) ??
    (await prisma.invoice.create({
      data: {
        company_id: company.id,
        vendor_id: vendor.id,
        po_id: purchaseOrder.id,
        invoice_no: 'VB-STG-001',
        invoice_date: addDays(now, -4),
        due_date: addDays(now, 10),
        amount: 28750,
        status: 'matched',
      },
    }));

  const goodsReceipt =
    (await prisma.goodsReceipt.findFirst({
      where: {
        company_id: company.id,
        po_id: purchaseOrder.id,
      },
    })) ??
    (await prisma.goodsReceipt.create({
      data: {
        company_id: company.id,
        po_id: purchaseOrder.id,
        received_by: primaryUser.id,
        received_date: addDays(now, -3),
        items_received: [
          { sku: 'PKG-CARTON', quantity: 250 },
          { sku: 'PKG-LINER', quantity: 100 },
        ],
      },
    }));

  const paymentRun =
    (await prisma.paymentRun.findFirst({
      where: {
        company_id: company.id,
        run_date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
      orderBy: { created_at: 'asc' },
    })) ??
    (await prisma.paymentRun.create({
      data: {
        company_id: company.id,
        run_date: now,
        total_amount: 28750,
        status: 'approved',
        approved_by: primaryUser.id,
      },
    }));

  if (vendorBill.payment_run_id !== paymentRun.id) {
    await prisma.invoice.update({
      where: { id: vendorBill.id },
      data: { payment_run_id: paymentRun.id },
    });
  }

  const customerCurrent =
    (await prisma.customer.findFirst({
      where: {
        company_id: company.id,
        name: 'North Ledger Retail',
      },
    })) ??
    (await prisma.customer.create({
      data: {
        company_id: company.id,
        name: 'North Ledger Retail',
        tax_pin: 'NLR-TAX-001',
        payment_terms: 'Net 30',
        status: 'active',
        contact: {
          email: 'ap@northledger-retail.example',
          phone: '+27 11 555 0103',
        },
      },
    }));

  const customerOverdue =
    (await prisma.customer.findFirst({
      where: {
        company_id: company.id,
        name: 'North Ledger Overdue Buyer',
      },
    })) ??
    (await prisma.customer.create({
      data: {
        company_id: company.id,
        name: 'North Ledger Overdue Buyer',
        tax_pin: 'AR-DUNNING-001',
        payment_terms: 'Net 30',
        status: 'active',
        contact: {
          email: 'finance+overdue@example.com',
          phone: '+27 11 555 0102',
        },
      },
    }));

  const openInvoice =
    (await prisma.aRInvoice.findFirst({
      where: {
        company_id: company.id,
        invoice_no: 'AR-STG-OPEN-001',
      },
    })) ??
    (await prisma.aRInvoice.create({
      data: {
        company_id: company.id,
        customer_id: customerCurrent.id,
        invoice_no: 'AR-STG-OPEN-001',
        invoice_date: addDays(now, -5),
        due_date: addDays(now, 25),
        amount: 12400,
        paid_amount: 4000,
        status: 'partially_paid',
        sent_at: addDays(now, -5),
        delivered_at: addDays(now, -5),
        delivery_method: 'email',
        reminder_count: 0,
      },
    }));

  const openInvoicePayment =
    (await prisma.payment.findFirst({
      where: {
        company_id: company.id,
        invoice_id: openInvoice.id,
        reference: 'PAY-STG-OPEN-001',
      },
    })) ??
    (await prisma.payment.create({
      data: {
        company_id: company.id,
        invoice_id: openInvoice.id,
        amount: 4000,
        payment_date: addDays(now, -2),
        method: 'Bank Transfer',
        reference: 'PAY-STG-OPEN-001',
        recorded_by: primaryUser.id,
      },
    }));

  const overdueInvoice =
    (await prisma.aRInvoice.findFirst({
      where: {
        company_id: company.id,
        invoice_no: 'AR-STG-OVD-001',
      },
    })) ??
    (await prisma.aRInvoice.create({
      data: {
        company_id: company.id,
        customer_id: customerOverdue.id,
        invoice_no: 'AR-STG-OVD-001',
        invoice_date: addDays(now, -25),
        due_date: addDays(now, -17),
        amount: 18400,
        paid_amount: 0,
        status: 'overdue',
        sent_at: addDays(now, -25),
        delivered_at: addDays(now, -25),
        delivery_method: 'email',
        reminder_count: 1,
        last_reminder_at: addDays(now, -13),
      },
    }));

  const collectionCase =
    (await prisma.collectionCase.findFirst({
      where: {
        company_id: company.id,
        invoice_id: overdueInvoice.id,
      },
    })) ??
    (await prisma.collectionCase.create({
      data: {
        company_id: company.id,
        invoice_id: overdueInvoice.id,
        assigned_to: primaryUser.id,
        escalation_level: 1,
        last_action_date: addDays(now, -2),
        notes: 'Seeded live escalation case for overdue AR walkthrough.',
      },
    }));

  const overdueReminder =
    (await prisma.aRDunningEvent.findFirst({
      where: {
        company_id: company.id,
        invoice_id: overdueInvoice.id,
        event_type: 'reminder_sent',
      },
    })) ??
    (await prisma.aRDunningEvent.create({
      data: {
        company_id: company.id,
        invoice_id: overdueInvoice.id,
        event_type: 'reminder_sent',
        stage: 1,
        channel: 'email',
        performed_by: primaryUser.id,
        details: {
          template: 'ar-reminder-3-day',
          seeded: true,
        },
      },
    }));

  const disputeUnderReview =
    (await prisma.disputeCase.findFirst({
      where: { case_number: 'DSP-STG-001' },
    })) ??
    (await prisma.disputeCase.create({
      data: {
        company_id: company.id,
        invoice_id: overdueInvoice.id,
        customer_id: customerOverdue.id,
        case_number: 'DSP-STG-001',
        intake_channel: 'portal',
        submitter_name: 'Nomsa Dlamini',
        submitter_email: 'nomsa@northledger.example',
        submitter_phone: '+27 82 000 0001',
        status: 'UNDER_REVIEW',
        priority: 'HIGH',
        dispute_type: 'QUALITY',
        reason_code: 'OVERGROWN_MARROW',
        disputed_amount: 18400,
        due_date: addDays(now, 3),
        assigned_to: primaryUser.id,
        created_by: primaryUser.id,
        affects_revenue: true,
        blocks_payment: true,
        product_code: 'MARROW',
        evidence_required: ['PHOTO', 'COLD_CHAIN_LOG'],
        evidence_due_date: addDays(now, 2),
      },
    }));

  const evidencePendingDispute =
    (await prisma.disputeCase.findFirst({
      where: { case_number: 'DSP-STG-002' },
    })) ??
    (await prisma.disputeCase.create({
      data: {
        company_id: company.id,
        invoice_id: overdueInvoice.id,
        customer_id: customerOverdue.id,
        case_number: 'DSP-STG-002',
        intake_channel: 'portal',
        submitter_name: 'Nomsa Dlamini',
        submitter_email: 'nomsa@northledger.example',
        submitter_phone: '+27 82 000 0001',
        status: 'EVIDENCE_PENDING',
        priority: 'MEDIUM',
        dispute_type: 'QUANTITY',
        reason_code: 'MOISTURE_LOSS',
        disputed_amount: 6500,
        due_date: addDays(now, 7),
        assigned_to: primaryUser.id,
        created_by: primaryUser.id,
        affects_revenue: true,
        blocks_payment: true,
        product_code: 'POTATO',
        evidence_required: ['WEIGHBRIDGE_TICKET', 'POD'],
        evidence_due_date: addDays(now, 1),
      },
    }));

  const closedDispute =
    (await prisma.disputeCase.findFirst({
      where: { case_number: 'DSP-STG-003' },
    })) ??
    (await prisma.disputeCase.create({
      data: {
        company_id: company.id,
        invoice_id: openInvoice.id,
        customer_id: customerCurrent.id,
        case_number: 'DSP-STG-003',
        intake_channel: 'portal',
        submitter_name: 'Lebo Mokoena',
        submitter_email: 'accounts@northledger-retail.example',
        status: 'CLOSED',
        priority: 'LOW',
        dispute_type: 'PRICING',
        reason_code: 'CONTRACT_PRICE_VARIANCE',
        disputed_amount: 2400,
        resolved_amount: 2400,
        due_date: addDays(now, -8),
        resolved_date: addDays(now, -4),
        assigned_to: primaryUser.id,
        created_by: primaryUser.id,
        affects_revenue: true,
        blocks_payment: false,
        product_code: 'EGG',
        evidence_required: ['CONTRACT', 'EMAIL_THREAD'],
        evidence_due_date: addDays(now, -10),
        acceptance_required: false,
        acceptance_status: 'acknowledged',
        accepted_at: addDays(now, -3),
        closure_locked_until: addDays(now, 11),
        closure_survey_score: 4,
      },
    }));

  const acceptanceDispute =
    (await prisma.disputeCase.findFirst({
      where: { case_number: 'DSP-STG-004' },
    })) ??
    (await prisma.disputeCase.create({
      data: {
        company_id: company.id,
        invoice_id: openInvoice.id,
        customer_id: customerCurrent.id,
        case_number: 'DSP-STG-004',
        intake_channel: 'portal',
        submitter_name: 'Lebo Mokoena',
        submitter_email: 'accounts@northledger-retail.example',
        status: 'CLOSED',
        priority: 'CRITICAL',
        dispute_type: 'QUALITY',
        reason_code: 'DAMAGED_IN_TRANSIT',
        disputed_amount: 6200,
        resolved_amount: 6200,
        due_date: addDays(now, -1),
        resolved_date: now,
        assigned_to: primaryUser.id,
        created_by: primaryUser.id,
        affects_revenue: true,
        blocks_payment: true,
        product_code: 'EGG',
        evidence_required: ['PHOTO', 'POD'],
        evidence_due_date: addDays(now, -2),
        acceptance_required: true,
        acceptance_status: 'pending_customer',
        closure_locked_until: addDays(now, 14),
      },
    }));

  const disputeCases = [disputeUnderReview, evidencePendingDispute, closedDispute, acceptanceDispute];

  for (const dispute of disputeCases) {
    const existingCreated = await prisma.disputeActivity.findFirst({
      where: {
        dispute_id: dispute.id,
        activity_type: 'CASE_CREATED',
      },
    });

    if (!existingCreated) {
      await prisma.disputeActivity.create({
        data: {
          company_id: company.id,
          dispute_id: dispute.id,
          activity_type: 'CASE_CREATED',
          actor_user_id: primaryUser.id,
          customer_visible: true,
          notes: `Case ${dispute.case_number} was logged and routed for review.`,
          metadata: {
            seeded: true,
          },
        },
      });
    }
  }

  const underReviewAttachment =
    (await prisma.disputeAttachment.findFirst({
      where: {
        dispute_id: disputeUnderReview.id,
        file_name: 'dispatch-photos.pdf',
      },
    })) ??
    (await prisma.disputeAttachment.create({
      data: {
        company_id: company.id,
        dispute_id: disputeUnderReview.id,
        file_name: 'dispatch-photos.pdf',
        file_type: 'application/pdf',
        category: 'PHOTO',
        file_url: 'https://example.com/disputes/dispatch-photos.pdf',
        notes: 'Seeded intake evidence packet.',
        uploaded_by: primaryUser.id,
      },
    }));

  const evidencePendingAttachment =
    (await prisma.disputeAttachment.findFirst({
      where: {
        dispute_id: evidencePendingDispute.id,
        file_name: 'weighbridge-ticket.pdf',
      },
    })) ??
    (await prisma.disputeAttachment.create({
      data: {
        company_id: company.id,
        dispute_id: evidencePendingDispute.id,
        file_name: 'weighbridge-ticket.pdf',
        file_type: 'application/pdf',
        category: 'WEIGHBRIDGE_TICKET',
        file_url: 'https://example.com/disputes/weighbridge-ticket.pdf',
        notes: 'Awaiting signed POD from customer.',
        uploaded_by: primaryUser.id,
      },
    }));

  const closedResolution =
    (await prisma.disputeResolution.findFirst({
      where: { dispute_id: closedDispute.id },
    })) ??
    (await prisma.disputeResolution.create({
      data: {
        company_id: company.id,
        dispute_id: closedDispute.id,
        resolution_type: 'credit_note',
        credit_amount: 2400,
        status: 'APPROVED',
        posted_to_gl: true,
        approved_by: primaryUser.id,
        approval_chain: [
          {
            approver: `${primaryUser.first_name} ${primaryUser.last_name}`,
            level: 1,
            status: 'approved',
            timestamp: addDays(now, -4).toISOString(),
          },
        ],
      },
    }));

  const acceptanceResolution =
    (await prisma.disputeResolution.findFirst({
      where: { dispute_id: acceptanceDispute.id },
    })) ??
    (await prisma.disputeResolution.create({
      data: {
        company_id: company.id,
        dispute_id: acceptanceDispute.id,
        resolution_type: 'replacement_credit',
        credit_amount: 6200,
        status: 'APPROVED',
        posted_to_gl: true,
        approved_by: primaryUser.id,
        approval_chain: [
          {
            approver: `${primaryUser.first_name} ${primaryUser.last_name}`,
            level: 1,
            status: 'approved',
            timestamp: now.toISOString(),
          },
        ],
      },
    }));

  const closedDocuments = [
    {
      dispute: closedDispute,
      document_type: 'RESOLUTION_LETTER',
      title: 'Resolution Letter',
      customer_visible: true,
    },
    {
      dispute: closedDispute,
      document_type: 'CLOSURE_RECEIPT',
      title: 'Closure Receipt',
      customer_visible: true,
    },
    {
      dispute: closedDispute,
      document_type: 'COMPLIANCE_DOSSIER',
      title: 'Compliance Dossier',
      customer_visible: false,
    },
    {
      dispute: acceptanceDispute,
      document_type: 'RESOLUTION_LETTER',
      title: 'Resolution Letter',
      customer_visible: true,
    },
    {
      dispute: acceptanceDispute,
      document_type: 'CLOSURE_RECEIPT',
      title: 'Closure Receipt',
      customer_visible: true,
    },
  ];

  for (const document of closedDocuments) {
    const existing = await prisma.disputeDocument.findFirst({
      where: {
        dispute_id: document.dispute.id,
        document_type: document.document_type,
      },
    });

    if (!existing) {
      await prisma.disputeDocument.create({
        data: {
          company_id: company.id,
          dispute_id: document.dispute.id,
          document_type: document.document_type,
          title: document.title,
          file_url: `https://example.com/disputes/${document.dispute.case_number}/${document.document_type.toLowerCase()}.pdf`,
          template_version: 'staging-seed-v1',
          customer_visible: document.customer_visible,
          generated_by: primaryUser.id,
          metadata: {
            seeded: true,
          },
        },
      });
    }
  }

  const dossierActivity =
    (await prisma.disputeActivity.findFirst({
      where: {
        dispute_id: closedDispute.id,
        activity_type: 'DOSSIER_GENERATED',
      },
    })) ??
    (await prisma.disputeActivity.create({
      data: {
        company_id: company.id,
        dispute_id: closedDispute.id,
        activity_type: 'DOSSIER_GENERATED',
        actor_user_id: primaryUser.id,
        internal_only: true,
        notes: 'Compliance dossier generated for staging walkthrough.',
        metadata: {
          seeded: true,
        },
      },
    }));

  const period =
    (await prisma.accountingPeriod.findFirst({
      where: {
        company_id: company.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
    })) ??
    (await prisma.accountingPeriod.create({
      data: {
        company_id: company.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        status: 'open',
      },
    }));

  const journal =
    (await prisma.journalEntry.findFirst({
      where: {
        company_id: company.id,
        reference: 'JE-STG-001',
      },
      include: { lines: true },
    })) ??
    (await prisma.journalEntry.create({
      data: {
        company_id: company.id,
        entry_date: now,
        description: 'Seeded customer receipt and sales posting example',
        reference: 'JE-STG-001',
        status: 'posted',
        period_id: period.id,
        created_by: primaryUser.id,
        lines: {
          create: [
            {
              account_id: cashAccount.id,
              debit: 18400,
              credit: 0,
              narration: 'Cash received / expected collection movement',
            },
            {
              account_id: revenueAccount.id,
              debit: 0,
              credit: 18400,
              narration: 'Produce sales',
            },
          ],
        },
      },
      include: { lines: true },
    }));

  if (journal.lines.length < 2) {
    await prisma.journalLine.createMany({
      data: [
        {
          entry_id: journal.id,
          account_id: cashAccount.id,
          debit: 18400,
          credit: 0,
          narration: 'Cash received / expected collection movement',
        },
        {
          entry_id: journal.id,
          account_id: revenueAccount.id,
          debit: 0,
          credit: 18400,
          narration: 'Produce sales',
        },
      ],
      skipDuplicates: false,
    });
  }

  const bankStatement =
    (await prisma.bankStatement.findFirst({
      where: {
        company_id: company.id,
        file_url: 'seed://BS-STG-001',
      },
    })) ??
    (await prisma.bankStatement.create({
      data: {
        company_id: company.id,
        account_id: cashAccount.id,
        statement_date: now,
        opening_balance: 95000,
        closing_balance: 113400,
        file_url: 'seed://BS-STG-001',
      },
    }));

  const bankStatementLine =
    (await prisma.bankStatementLine.findFirst({
      where: {
        statement_id: bankStatement.id,
        reference: 'BS-STG-001-L1',
      },
    })) ??
    (await prisma.bankStatementLine.create({
      data: {
        statement_id: bankStatement.id,
        date: now,
        description: 'Customer receipt from North Ledger Overdue Buyer',
        amount: 18400,
        balance: 113400,
        reference: 'BS-STG-001-L1',
      },
    }));

  const reconciliationMatch =
    (await prisma.bankReconciliationMatch.findFirst({
      where: {
        company_id: company.id,
        line_id: bankStatementLine.id,
      },
    })) ??
    (await prisma.bankReconciliationMatch.create({
      data: {
        company_id: company.id,
        statement_id: bankStatement.id,
        line_id: bankStatementLine.id,
        journal_entry_id: journal.id,
        matched_by: primaryUser.id,
      },
    }));

  const summary = {
    company: company.name,
    vendor: vendor.name,
    requisition: requisition.requisition_no,
    vendorBill: vendorBill.invoice_no,
    paymentRun: paymentRun.id,
    openInvoice: openInvoice.invoice_no,
    overdueInvoice: overdueInvoice.invoice_no,
    collectionCase: collectionCase.id,
    disputes: disputeCases.map((dispute) => ({
      caseNumber: dispute.case_number,
      status: dispute.status,
    })),
    bankStatement: 'BS-STG-001',
    journal: 'JE-STG-001',
    period: `${period.year}-${String(period.month).padStart(2, '0')}`,
    createdArtifacts: {
      goodsReceipt: goodsReceipt.id,
      openInvoicePayment: openInvoicePayment.id,
      overdueReminder: overdueReminder.id,
      underReviewAttachment: underReviewAttachment.id,
      evidencePendingAttachment: evidencePendingAttachment.id,
      closedResolution: closedResolution.id,
      acceptanceResolution: acceptanceResolution.id,
      dossierActivity: dossierActivity.id,
      reconciliationMatch: reconciliationMatch.id,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
