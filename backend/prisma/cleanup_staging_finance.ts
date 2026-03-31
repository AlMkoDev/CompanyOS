import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANY_NAME = 'Verdant Fields Staging';
const LEGACY_INVOICE_NUMBERS = ['AR-DEMO-764193', 'AR-DUN-445958'];
const LEGACY_CUSTOMER_NAMES = ['North Ledger Test Buyer'];

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: COMPANY_NAME },
  });

  if (!company) {
    throw new Error(`Company "${COMPANY_NAME}" was not found.`);
  }

  const legacyInvoices = await prisma.aRInvoice.findMany({
    where: {
      company_id: company.id,
      invoice_no: { in: LEGACY_INVOICE_NUMBERS },
    },
    include: {
      disputes: true,
    },
  });

  const legacyInvoiceIds = legacyInvoices.map((invoice) => invoice.id);
  const legacyDisputeIds = legacyInvoices.flatMap((invoice) =>
    invoice.disputes.map((dispute) => dispute.id),
  );

  if (legacyDisputeIds.length > 0) {
    await prisma.disputeDocument.deleteMany({
      where: { dispute_id: { in: legacyDisputeIds } },
    });

    await prisma.disputeAttachment.deleteMany({
      where: { dispute_id: { in: legacyDisputeIds } },
    });

    await prisma.disputeResolution.deleteMany({
      where: { dispute_id: { in: legacyDisputeIds } },
    });

    await prisma.disputeActivity.deleteMany({
      where: { dispute_id: { in: legacyDisputeIds } },
    });

    await prisma.disputeCase.deleteMany({
      where: { id: { in: legacyDisputeIds } },
    });
  }

  if (legacyInvoiceIds.length > 0) {
    await prisma.collectionCase.deleteMany({
      where: { invoice_id: { in: legacyInvoiceIds } },
    });

    await prisma.payment.deleteMany({
      where: { invoice_id: { in: legacyInvoiceIds } },
    });

    await prisma.aRDunningEvent.deleteMany({
      where: { invoice_id: { in: legacyInvoiceIds } },
    });

    await prisma.aRInvoice.deleteMany({
      where: { id: { in: legacyInvoiceIds } },
    });
  }

  const legacyCustomers = await prisma.customer.findMany({
    where: {
      company_id: company.id,
      name: { in: LEGACY_CUSTOMER_NAMES },
    },
    include: {
      invoices: true,
      disputes: true,
    },
  });

  const removableCustomerIds = legacyCustomers
    .filter((customer) => customer.invoices.length === 0 && customer.disputes.length === 0)
    .map((customer) => customer.id);

  if (removableCustomerIds.length > 0) {
    await prisma.customer.deleteMany({
      where: { id: { in: removableCustomerIds } },
    });
  }

  console.log(
    JSON.stringify(
      {
        company: company.name,
        removedInvoices: legacyInvoices.map((invoice) => invoice.invoice_no),
        removedCustomers: legacyCustomers
          .filter((customer) => removableCustomerIds.includes(customer.id))
          .map((customer) => customer.name),
        remainingLegacyInvoiceCount: await prisma.aRInvoice.count({
          where: {
            company_id: company.id,
            invoice_no: { in: LEGACY_INVOICE_NUMBERS },
          },
        }),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
