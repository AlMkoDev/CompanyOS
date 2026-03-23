import { PrismaClient, SupplierStatus, LedgerEntryType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSupplyChain() {
  console.log('Seeding Supply Chain data...');

  const systemCompanyId = '00000000-0000-0000-0000-000000000000';

  // 1. Create Sample Locations
  const locations = [
    { name: 'Main Warehouse', address: '123 Industrial Park, Johannesburg' },
    { name: 'Cape Town Branch', address: '456 Business District, Cape Town' },
    { name: 'Durban Depot', address: '789 Port Road, Durban' },
  ];

  const createdLocations = [];
  for (const location of locations) {
    // Check if location already exists
    const existing = await prisma.location.findFirst({
      where: { 
        company_id: systemCompanyId, 
        name: location.name 
      }
    });

    if (!existing) {
      const created = await prisma.location.create({
        data: {
          company_id: systemCompanyId,
          ...location,
        },
      });
      createdLocations.push(created);
    } else {
      createdLocations.push(existing);
    }
  }

  // 2. Create Sample Suppliers
  const suppliers = [
    {
      supplier_code: 'SUP001',
      name: 'TechCorp Solutions',
      status: SupplierStatus.ACTIVE,
      contact_info: {
        email: 'orders@techcorp.co.za',
        phone: '+27 11 123 4567',
        address: '100 Tech Street, Sandton'
      },
      bank_details: {
        account_name: 'TechCorp Solutions (Pty) Ltd',
        account_number: '1234567890',
        bank_name: 'Standard Bank',
        branch_code: '051001'
      }
    },
    {
      supplier_code: 'SUP002', 
      name: 'Office Supplies Co',
      status: SupplierStatus.ACTIVE,
      contact_info: {
        email: 'sales@officesupplies.co.za',
        phone: '+27 21 987 6543',
        address: '200 Commerce Ave, Cape Town'
      }
    },
    {
      supplier_code: 'SUP003',
      name: 'Industrial Materials Ltd',
      status: SupplierStatus.ACTIVE,
      contact_info: {
        email: 'procurement@industrial.co.za', 
        phone: '+27 31 555 0123',
        address: '300 Factory Road, Durban'
      }
    }
  ];

  const createdSuppliers = [];
  for (const supplier of suppliers) {
    const created = await prisma.supplier.upsert({
      where: { 
        company_id_supplier_code: { 
          company_id: systemCompanyId, 
          supplier_code: supplier.supplier_code 
        } 
      },
      update: {},
      create: {
        company_id: systemCompanyId,
        ...supplier,
      },
    });
    createdSuppliers.push(created);
  }

  // 3. Create Sample Products
  const products = [
    {
      sku: 'LAPTOP001',
      name: 'Dell Latitude 5520 Laptop',
      description: 'Business laptop with Intel i5, 8GB RAM, 256GB SSD',
      category: 'IT Equipment',
      unit_of_measure: 'Each',
      abc_class: 'A',
      xyz_class: 'X'
    },
    {
      sku: 'PAPER001',
      name: 'A4 Copy Paper',
      description: '80gsm white copy paper, 500 sheets per ream',
      category: 'Office Supplies',
      unit_of_measure: 'Ream',
      abc_class: 'B',
      xyz_class: 'Y'
    },
    {
      sku: 'STEEL001',
      name: 'Steel Rod 12mm',
      description: 'Mild steel reinforcement rod, 12mm diameter, 6m length',
      category: 'Raw Materials',
      unit_of_measure: 'Piece',
      abc_class: 'A',
      xyz_class: 'Z'
    },
    {
      sku: 'CHAIR001',
      name: 'Ergonomic Office Chair',
      description: 'Adjustable height office chair with lumbar support',
      category: 'Office Furniture',
      unit_of_measure: 'Each',
      abc_class: 'C',
      xyz_class: 'Y'
    },
    {
      sku: 'INK001',
      name: 'Printer Ink Cartridge',
      description: 'Black ink cartridge for HP LaserJet printers',
      category: 'Office Supplies',
      unit_of_measure: 'Each',
      abc_class: 'B',
      xyz_class: 'X'
    }
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { 
        company_id_sku: { 
          company_id: systemCompanyId, 
          sku: product.sku 
        } 
      },
      update: {},
      create: {
        company_id: systemCompanyId,
        ...product,
      },
    });
    createdProducts.push(created);
  }

  // 4. Create Supplier-Product relationships
  const supplierProducts = [
    { supplier_code: 'SUP001', sku: 'LAPTOP001', unit_cost: 15000, lead_time_days: 7, is_preferred: true },
    { supplier_code: 'SUP001', sku: 'INK001', unit_cost: 450, lead_time_days: 3, is_preferred: false },
    { supplier_code: 'SUP002', sku: 'PAPER001', unit_cost: 85, lead_time_days: 2, is_preferred: true },
    { supplier_code: 'SUP002', sku: 'CHAIR001', unit_cost: 2500, lead_time_days: 14, is_preferred: true },
    { supplier_code: 'SUP002', sku: 'INK001', unit_cost: 420, lead_time_days: 1, is_preferred: true },
    { supplier_code: 'SUP003', sku: 'STEEL001', unit_cost: 180, lead_time_days: 5, is_preferred: true },
  ];

  for (const sp of supplierProducts) {
    const supplier = createdSuppliers.find(s => s.supplier_code === sp.supplier_code);
    const product = createdProducts.find(p => p.sku === sp.sku);
    
    if (supplier && product) {
      await prisma.supplierProduct.upsert({
        where: { 
          supplier_id_product_id: { 
            supplier_id: supplier.id, 
            product_id: product.id 
          } 
        },
        update: {},
        create: {
          supplier_id: supplier.id,
          product_id: product.id,
          unit_cost: sp.unit_cost,
          lead_time_days: sp.lead_time_days,
          is_preferred: sp.is_preferred,
        },
      });
    }
  }

  // 5. Create Initial Stock Levels
  const stockLevels = [
    { sku: 'LAPTOP001', location: 'Main Warehouse', quantity: 25, reorder_point: 10, eoq: 50 },
    { sku: 'PAPER001', location: 'Main Warehouse', quantity: 500, reorder_point: 100, eoq: 1000 },
    { sku: 'STEEL001', location: 'Main Warehouse', quantity: 1200, reorder_point: 200, eoq: 2000 },
    { sku: 'CHAIR001', location: 'Cape Town Branch', quantity: 15, reorder_point: 5, eoq: 25 },
    { sku: 'INK001', location: 'Main Warehouse', quantity: 80, reorder_point: 20, eoq: 100 },
    { sku: 'PAPER001', location: 'Cape Town Branch', quantity: 200, reorder_point: 50, eoq: 500 },
  ];

  for (const stock of stockLevels) {
    const product = createdProducts.find(p => p.sku === stock.sku);
    const location = createdLocations.find(l => l.name === stock.location);
    
    if (product && location) {
      await prisma.stockLevel.upsert({
        where: { 
          company_id_product_id_location_id: { 
            company_id: systemCompanyId,
            product_id: product.id, 
            location_id: location.id 
          } 
        },
        update: {},
        create: {
          company_id: systemCompanyId,
          product_id: product.id,
          location_id: location.id,
          quantity: stock.quantity,
          reorder_point: stock.reorder_point,
          eoq: stock.eoq,
        },
      });

      // Create corresponding opening balance ledger entries
      await prisma.stockLedger.create({
        data: {
          company_id: systemCompanyId,
          product_id: product.id,
          location_id: location.id,
          entry_type: LedgerEntryType.OPENING_BALANCE,
          quantity_change: stock.quantity,
          reason_code: 'INITIAL_STOCK',
        },
      });
    }
  }

  // 6. Create Sample Approval Policies (Enhanced from existing)
  const approvalPolicies = [
    { product_category: 'IT Equipment', auto_approve_limit: 500, l1_threshold: 5000, l2_threshold: 50000 },
    { product_category: 'Office Supplies', auto_approve_limit: 200, l1_threshold: 1000, l2_threshold: 5000 },
    { product_category: 'Raw Materials', auto_approve_limit: 1000, l1_threshold: 10000, l2_threshold: 100000 },
    { product_category: 'Office Furniture', auto_approve_limit: 0, l1_threshold: 3000, l2_threshold: 15000 },
    { product_category: 'Services', auto_approve_limit: 0, l1_threshold: 2000, l2_threshold: 20000 },
    { product_category: 'Maintenance', auto_approve_limit: 300, l1_threshold: 2500, l2_threshold: 12000 },
  ];

  for (const policy of approvalPolicies) {
    await prisma.approvalPolicy.upsert({
      where: { 
        company_id_product_category: { 
          company_id: systemCompanyId, 
          product_category: policy.product_category 
        } 
      },
      update: {},
      create: {
        company_id: systemCompanyId,
        ...policy,
      },
    });
  }

  // 7. Create Sample Supplier Risk Records
  const supplierRisks = [
    { supplier_code: 'SUP001', risk_score: 85, category: 'financial', details: 'Strong financial position, low risk' },
    { supplier_code: 'SUP002', risk_score: 70, category: 'quality', details: 'Good quality track record, medium risk' },
    { supplier_code: 'SUP003', risk_score: 60, category: 'single_source', details: 'Limited alternative suppliers available' },
  ];

  for (const risk of supplierRisks) {
    const supplier = createdSuppliers.find(s => s.supplier_code === risk.supplier_code);
    
    if (supplier) {
      await prisma.supplierRisk.create({
        data: {
          supplier_id: supplier.id,
          risk_score: risk.risk_score,
          category: risk.category,
          details: risk.details,
        },
      });
    }
  }

  console.log('Supply Chain seeding complete.');
  console.log(`Created ${createdLocations.length} locations`);
  console.log(`Created ${createdSuppliers.length} suppliers`);
  console.log(`Created ${createdProducts.length} products`);
  console.log(`Created ${stockLevels.length} stock level records`);
  console.log(`Created ${approvalPolicies.length} approval policies`);
}

export { seedSupplyChain };

// Run directly if this file is executed
if (require.main === module) {
  seedSupplyChain()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}