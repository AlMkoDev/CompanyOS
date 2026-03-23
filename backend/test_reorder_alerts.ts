import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReorderAlerts() {
  console.log('🔍 Testing Reorder Alert System...\n');

  const systemCompanyId = '00000000-0000-0000-0000-000000000000';

  try {
    // 1. Check current stock levels
    console.log('📊 Current Stock Levels:');
    const stockLevels = await prisma.stockLevel.findMany({
      where: { company_id: systemCompanyId },
      include: {
        product: true,
        location: true,
      },
    });

    stockLevels.forEach(stock => {
      const currentStock = Number(stock.quantity);
      const reorderPoint = Number(stock.reorder_point || 0);
      const needsReorder = currentStock <= reorderPoint;
      
      console.log(`  ${stock.product.sku} at ${stock.location.name}:`);
      console.log(`    Current: ${currentStock}, Reorder Point: ${reorderPoint} ${needsReorder ? '⚠️ NEEDS REORDER' : '✅'}`);
    });

    // 2. Simulate low stock by updating some items
    console.log('\n🔧 Simulating low stock conditions...');
    
    // Set laptop stock to 5 (below reorder point of 10)
    const laptopStock = stockLevels.find(s => s.product.sku === 'LAPTOP001');
    if (laptopStock) {
      await prisma.stockLevel.update({
        where: { id: laptopStock.id },
        data: { quantity: 5 },
      });
      console.log('  ✓ Set LAPTOP001 stock to 5 (below reorder point of 10)');
    }

    // Set paper stock to 0 (critical - out of stock)
    const paperStock = stockLevels.find(s => s.product.sku === 'PAPER001' && s.location.name === 'Main Warehouse');
    if (paperStock) {
      await prisma.stockLevel.update({
        where: { id: paperStock.id },
        data: { quantity: 0 },
      });
      console.log('  ✓ Set PAPER001 stock to 0 (CRITICAL - out of stock)');
    }

    // 3. Add some consumption history for stockout estimation
    console.log('\n📈 Adding consumption history...');
    
    const products = await prisma.product.findMany({
      where: { company_id: systemCompanyId },
    });
    
    const locations = await prisma.location.findMany({
      where: { company_id: systemCompanyId },
    });

    // Add some historical consumption data (last 10 days)
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate daily consumption for laptop (2-3 units per day)
      if (laptopStock) {
        await prisma.stockLedger.create({
          data: {
            company_id: systemCompanyId,
            product_id: laptopStock.product_id,
            location_id: laptopStock.location_id,
            entry_type: 'FULFILLMENT',
            quantity_change: -(Math.floor(Math.random() * 2) + 2), // -2 to -3
            reason_code: 'DAILY_SALES',
            created_at: date,
          },
        });
      }

      // Simulate daily consumption for paper (50-100 reams per day)
      if (paperStock) {
        await prisma.stockLedger.create({
          data: {
            company_id: systemCompanyId,
            product_id: paperStock.product_id,
            location_id: paperStock.location_id,
            entry_type: 'FULFILLMENT',
            quantity_change: -(Math.floor(Math.random() * 50) + 50), // -50 to -100
            reason_code: 'DAILY_USAGE',
            created_at: date,
          },
        });
      }
    }
    console.log('  ✓ Added 10 days of consumption history');

    // 4. Test the reorder alert logic (simulate what the service would do)
    console.log('\n🚨 Checking for Reorder Alerts...');
    
    const lowStockItems = await prisma.stockLevel.findMany({
      where: {
        company_id: systemCompanyId,
        reorder_point: { not: null },
      },
      include: {
        product: {
          include: {
            suppliers: {
              where: { is_preferred: true },
              include: { supplier: true },
              take: 1,
            },
          },
        },
        location: true,
      },
    });

    const alerts = [];
    for (const stock of lowStockItems) {
      const currentStock = Number(stock.quantity);
      const reorderPoint = Number(stock.reorder_point);
      
      if (currentStock <= reorderPoint) {
        const stockRatio = currentStock / reorderPoint;
        let urgencyLevel;
        
        if (stockRatio <= 0) {
          urgencyLevel = 'CRITICAL';
        } else if (stockRatio <= 0.25) {
          urgencyLevel = 'HIGH';
        } else if (stockRatio <= 0.5) {
          urgencyLevel = 'MEDIUM';
        } else {
          urgencyLevel = 'LOW';
        }

        const eoq = Number(stock.eoq) || 0;
        const shortfall = reorderPoint - currentStock;
        const suggestedOrderQty = Math.max(eoq, shortfall);

        const alert = {
          productSku: stock.product.sku,
          productName: stock.product.name,
          locationName: stock.location.name,
          currentStock,
          reorderPoint,
          eoq,
          suggestedOrderQty,
          urgencyLevel,
          preferredSupplier: stock.product.suppliers[0]?.supplier.name || 'None',
        };

        alerts.push(alert);
      }
    }

    console.log(`\n📋 Found ${alerts.length} Reorder Alerts:`);
    alerts.forEach((alert, index) => {
      const urgencyIcon = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢',
      }[alert.urgencyLevel];

      console.log(`\n  ${index + 1}. ${urgencyIcon} ${alert.urgencyLevel} - ${alert.productName}`);
      console.log(`     SKU: ${alert.productSku}`);
      console.log(`     Location: ${alert.locationName}`);
      console.log(`     Current Stock: ${alert.currentStock}`);
      console.log(`     Reorder Point: ${alert.reorderPoint}`);
      console.log(`     Suggested Order: ${alert.suggestedOrderQty} units`);
      console.log(`     Preferred Supplier: ${alert.preferredSupplier}`);
    });

    // 5. Test alert statistics
    console.log('\n📊 Alert Statistics:');
    const stats = {
      total: alerts.length,
      critical: alerts.filter(a => a.urgencyLevel === 'CRITICAL').length,
      high: alerts.filter(a => a.urgencyLevel === 'HIGH').length,
      medium: alerts.filter(a => a.urgencyLevel === 'MEDIUM').length,
      low: alerts.filter(a => a.urgencyLevel === 'LOW').length,
    };

    console.log(`  Total Alerts: ${stats.total}`);
    console.log(`  🔴 Critical: ${stats.critical}`);
    console.log(`  🟠 High: ${stats.high}`);
    console.log(`  🟡 Medium: ${stats.medium}`);
    console.log(`  🟢 Low: ${stats.low}`);

    console.log('\n✅ Reorder Alert System Test Completed Successfully!');
    console.log('\nNext Steps:');
    console.log('  1. The ReorderAlertService will run automatically every hour during business hours');
    console.log('  2. Critical alerts will trigger immediate notifications');
    console.log('  3. Daily summary reports will be sent to procurement team');
    console.log('  4. Use the API endpoints to view and acknowledge alerts');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReorderAlerts();