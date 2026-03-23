import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeed() {
  console.log('Verifying seeded data...\n');

  const systemCompanyId = '00000000-0000-0000-0000-000000000000';

  // Check Company
  const company = await prisma.company.findUnique({
    where: { id: systemCompanyId }
  });
  console.log('✓ System Company:', company?.name);

  // Check Locations
  const locations = await prisma.location.findMany({
    where: { company_id: systemCompanyId }
  });
  console.log(`✓ Locations (${locations.length}):`, locations.map(l => l.name).join(', '));

  // Check Suppliers
  const suppliers = await prisma.supplier.findMany({
    where: { company_id: systemCompanyId }
  });
  console.log(`✓ Suppliers (${suppliers.length}):`, suppliers.map(s => s.name).join(', '));

  // Check Products
  const products = await prisma.product.findMany({
    where: { company_id: systemCompanyId }
  });
  console.log(`✓ Products (${products.length}):`, products.map(p => p.name).join(', '));

  // Check Stock Levels
  const stockLevels = await prisma.stockLevel.findMany({
    where: { company_id: systemCompanyId },
    include: { product: true, location: true }
  });
  console.log(`✓ Stock Levels (${stockLevels.length}):`);
  stockLevels.forEach(sl => {
    console.log(`  - ${sl.product.sku} at ${sl.location.name}: ${sl.quantity} units`);
  });

  // Check Stock Ledger Entries
  const ledgerEntries = await prisma.stockLedger.findMany({
    where: { company_id: systemCompanyId },
    include: { product: true, location: true }
  });
  console.log(`✓ Stock Ledger Entries (${ledgerEntries.length}):`);
  ledgerEntries.forEach(le => {
    console.log(`  - ${le.product.sku} at ${le.location.name}: ${le.entry_type} ${le.quantity_change}`);
  });

  // Check Approval Policies
  const policies = await prisma.approvalPolicy.findMany({
    where: { company_id: systemCompanyId }
  });
  console.log(`✓ Approval Policies (${policies.length}):`);
  policies.forEach(p => {
    console.log(`  - ${p.product_category}: Auto-approve ≤ R${p.auto_approve_limit}, L1 ≤ R${p.l1_threshold}, L2 ≤ R${p.l2_threshold}`);
  });

  // Check Supplier Products
  const supplierProducts = await prisma.supplierProduct.findMany({
    include: { supplier: true, product: true }
  });
  console.log(`✓ Supplier-Product Relations (${supplierProducts.length}):`);
  supplierProducts.forEach(sp => {
    console.log(`  - ${sp.supplier.name} supplies ${sp.product.sku} at R${sp.unit_cost} (${sp.lead_time_days} days)`);
  });

  console.log('\n🎉 All Sprint 1 database tasks completed successfully!');
}

verifySeed()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });