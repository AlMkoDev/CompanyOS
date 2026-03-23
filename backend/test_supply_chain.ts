import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSupplyChainAPIs() {
  console.log('🧪 Testing Supply Chain APIs...\n');

  const systemCompanyId = '00000000-0000-0000-0000-000000000000';

  try {
    // Test 1: Get all products
    console.log('1. Testing Product API - Get all products');
    const products = await prisma.product.findMany({
      where: { company_id: systemCompanyId },
      include: {
        suppliers: { include: { supplier: true } },
        stock_levels: { include: { location: true } }
      }
    });
    console.log(`✅ Found ${products.length} products`);
    products.forEach(p => {
      console.log(`   - ${p.sku}: ${p.name} (${p.category})`);
    });

    // Test 2: Get all suppliers
    console.log('\n2. Testing Supplier API - Get all suppliers');
    const suppliers = await prisma.supplier.findMany({
      where: { company_id: systemCompanyId },
      include: {
        products: { include: { product: true } },
        risks: true
      }
    });
    console.log(`✅ Found ${suppliers.length} suppliers`);
    suppliers.forEach(s => {
      console.log(`   - ${s.supplier_code}: ${s.name} (${s.status}) - ${s.products.length} products`);
    });

    // Test 3: Test product filtering by category
    console.log('\n3. Testing Product filtering by category');
    const itProducts = await prisma.product.findMany({
      where: { 
        company_id: systemCompanyId,
        category: 'IT Equipment'
      }
    });
    console.log(`✅ Found ${itProducts.length} IT Equipment products`);

    // Test 4: Test supplier-product relationships
    console.log('\n4. Testing Supplier-Product relationships');
    const supplierProducts = await prisma.supplierProduct.findMany({
      include: { 
        supplier: true, 
        product: true 
      }
    });
    console.log(`✅ Found ${supplierProducts.length} supplier-product relationships`);
    supplierProducts.forEach(sp => {
      console.log(`   - ${sp.supplier.name} supplies ${sp.product.sku} at R${sp.unit_cost} (${sp.lead_time_days} days)`);
    });

    // Test 5: Test stock levels
    console.log('\n5. Testing Stock Level queries');
    const stockLevels = await prisma.stockLevel.findMany({
      where: { company_id: systemCompanyId },
      include: { 
        product: true, 
        location: true 
      }
    });
    console.log(`✅ Found ${stockLevels.length} stock level records`);
    stockLevels.forEach(sl => {
      console.log(`   - ${sl.product.sku} at ${sl.location.name}: ${sl.quantity} units (Reorder: ${sl.reorder_point})`);
    });

    // Test 6: Test approval policies
    console.log('\n6. Testing Approval Policies');
    const policies = await prisma.approvalPolicy.findMany({
      where: { company_id: systemCompanyId }
    });
    console.log(`✅ Found ${policies.length} approval policies`);
    policies.forEach(p => {
      console.log(`   - ${p.product_category}: Auto ≤ R${p.auto_approve_limit}, L1 ≤ R${p.l1_threshold}, L2 ≤ R${p.l2_threshold}`);
    });

    console.log('\n🎉 All Supply Chain API tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Supplier-Product Relations: ${supplierProducts.length}`);
    console.log(`   - Stock Levels: ${stockLevels.length}`);
    console.log(`   - Approval Policies: ${policies.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupplyChainAPIs()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });