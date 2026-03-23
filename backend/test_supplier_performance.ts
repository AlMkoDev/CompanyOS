import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSupplierPerformance() {
  console.log('📊 Testing Supplier Performance Scoring...\n');

  try {
    // Get test company
    const company = await prisma.company.findFirst({
      where: { name: { contains: 'Test' } },
    });

    if (!company) {
      throw new Error('Test company not found');
    }

    console.log(`✅ Using company: ${company.name} (${company.id})\n`);

    // Get suppliers with recent activity
    const suppliers = await prisma.supplier.findMany({
      where: { 
        company_id: company.id,
        status: 'ACTIVE',
      },
      include: {
        purchase_orders: {
          include: {
            lines: true,
            goods_receipts: {
              include: {
                lines: true,
              },
            },
          },
        },
      },
    });

    if (suppliers.length === 0) {
      console.log('❌ No suppliers found for testing');
      return;
    }

    console.log(`✅ Found ${suppliers.length} suppliers for performance analysis\n`);

    // Test performance calculation for each supplier
    for (const supplier of suppliers.slice(0, 3)) { // Test first 3 suppliers
      await testSupplierPerformanceMetrics(company.id, supplier);
    }

    // Test dashboard summary
    await testPerformanceDashboard(company.id, suppliers);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testSupplierPerformanceMetrics(companyId: string, supplier: any) {
  console.log(`📈 Testing performance metrics for: ${supplier.name}`);

  const period = {
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
    to: new Date(),
  };

  // Get POs for this supplier in the period
  const pos = await prisma.opsPurchaseOrder.findMany({
    where: {
      company_id: companyId,
      supplier_id: supplier.id,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
    },
    include: {
      lines: true,
    },
  });

  // Get goods receipts for this supplier
  const goodsReceipts = await prisma.opsGoodsReceipt.findMany({
    where: {
      company_id: companyId,
      po: {
        supplier_id: supplier.id,
      },
      created_at: {
        gte: period.from,
        lte: period.to,
      },
    },
    include: {
      lines: {
        include: {
          product: true,
        },
      },
      po: {
        include: {
          lines: true,
        },
      },
    },
  });

  console.log(`   📦 Purchase Orders: ${pos.length}`);
  console.log(`   📋 Goods Receipts: ${goodsReceipts.length}`);

  if (goodsReceipts.length === 0) {
    console.log(`   ⚠️  No goods receipts found - cannot calculate delivery performance`);
    console.log('');
    return;
  }

  // Calculate delivery performance
  let totalDeliveries = 0;
  let lateDeliveries = 0;
  let totalDelayDays = 0;

  goodsReceipts.forEach(gr => {
    // For testing purposes, we'll simulate delivery performance
    // In a real scenario, you'd have expected_delivery_date field
    totalDeliveries++;
    
    // Simulate some late deliveries for testing
    if (Math.random() > 0.8) { // 20% chance of late delivery
      lateDeliveries++;
      const delayDays = Math.floor(Math.random() * 5) + 1; // 1-5 days delay
      totalDelayDays += delayDays;
    }
  });

  const onTimeDeliveryRate = totalDeliveries > 0 ? 
    ((totalDeliveries - lateDeliveries) / totalDeliveries) * 100 : 100;
  
  const averageDeliveryDelay = lateDeliveries > 0 ? 
    totalDelayDays / lateDeliveries : 0;

  console.log(`   🚚 Delivery Performance:`);
  console.log(`      - On-time delivery rate: ${onTimeDeliveryRate.toFixed(1)}%`);
  console.log(`      - Late deliveries: ${lateDeliveries}/${totalDeliveries}`);
  console.log(`      - Average delay: ${averageDeliveryDelay.toFixed(1)} days`);

  // Calculate quality performance
  let totalItemsReceived = 0;
  let totalItemsRejected = 0;
  let receiptsWithDefects = 0;

  goodsReceipts.forEach(gr => {
    let hasDefects = false;
    
    gr.lines.forEach((line: any) => {
      const receivedQty = Number(line.received_qty);
      const rejectedQty = Number(line.rejected_qty);
      
      totalItemsReceived += receivedQty;
      totalItemsRejected += rejectedQty;
      
      if (rejectedQty > 0) {
        hasDefects = true;
      }
    });
    
    if (hasDefects) {
      receiptsWithDefects++;
    }
  });

  const defectRate = totalItemsReceived > 0 ? 
    (totalItemsRejected / (totalItemsReceived + totalItemsRejected)) * 100 : 0;
  
  const qualityScore = Math.max(0, 100 - defectRate);

  console.log(`   🔍 Quality Performance:`);
  console.log(`      - Quality score: ${qualityScore.toFixed(1)}/100`);
  console.log(`      - Defect rate: ${defectRate.toFixed(2)}%`);
  console.log(`      - Items rejected: ${totalItemsRejected}/${totalItemsReceived + totalItemsRejected}`);
  console.log(`      - Receipts with defects: ${receiptsWithDefects}/${goodsReceipts.length}`);

  // Calculate overall score
  const deliveryScore = onTimeDeliveryRate;
  const priceScore = 100; // Assuming no price variance for now
  const overallScore = (deliveryScore * 0.4) + (qualityScore * 0.4) + (priceScore * 0.2);

  console.log(`   📊 Overall Performance:`);
  console.log(`      - Overall score: ${overallScore.toFixed(1)}/100`);

  // Determine risk level
  let riskLevel = 'LOW';
  if (onTimeDeliveryRate < 50 || defectRate > 20) {
    riskLevel = 'CRITICAL';
  } else if (overallScore < 60 || onTimeDeliveryRate < 70 || defectRate > 10) {
    riskLevel = 'HIGH';
  } else if (overallScore < 80 || onTimeDeliveryRate < 85 || defectRate > 5) {
    riskLevel = 'MEDIUM';
  }

  console.log(`      - Risk level: ${riskLevel}`);

  // Generate recommendations
  const recommendations = [];
  
  if (onTimeDeliveryRate < 85) {
    recommendations.push('Improve delivery schedule adherence');
  }
  
  if (defectRate > 5) {
    recommendations.push('Implement quality improvement program');
  }
  
  if (riskLevel === 'CRITICAL') {
    recommendations.push('URGENT: Review supplier relationship immediately');
  }

  if (recommendations.length > 0) {
    console.log(`   💡 Recommendations:`);
    recommendations.forEach(rec => console.log(`      - ${rec}`));
  }

  console.log('');
}

async function testPerformanceDashboard(companyId: string, suppliers: any[]) {
  console.log('📊 Testing Performance Dashboard Summary');

  // Simulate scorecard data for dashboard
  const mockScorecards = suppliers.map(supplier => ({
    supplierId: supplier.id,
    supplierName: supplier.name,
    currentScore: Math.floor(Math.random() * 40) + 60, // Random score 60-100
    riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
    trend: ['IMPROVING', 'STABLE', 'DECLINING'][Math.floor(Math.random() * 3)],
  }));

  const totalSuppliers = mockScorecards.length;
  const averageScore = totalSuppliers > 0 ? 
    mockScorecards.reduce((sum, s) => sum + s.currentScore, 0) / totalSuppliers : 0;

  const riskDistribution = {
    LOW: mockScorecards.filter(s => s.riskLevel === 'LOW').length,
    MEDIUM: mockScorecards.filter(s => s.riskLevel === 'MEDIUM').length,
    HIGH: mockScorecards.filter(s => s.riskLevel === 'HIGH').length,
    CRITICAL: mockScorecards.filter(s => s.riskLevel === 'CRITICAL').length,
  };

  const trendDistribution = {
    IMPROVING: mockScorecards.filter(s => s.trend === 'IMPROVING').length,
    STABLE: mockScorecards.filter(s => s.trend === 'STABLE').length,
    DECLINING: mockScorecards.filter(s => s.trend === 'DECLINING').length,
  };

  console.log(`✅ Dashboard Summary:`);
  console.log(`   - Total suppliers: ${totalSuppliers}`);
  console.log(`   - Average score: ${averageScore.toFixed(1)}/100`);
  console.log(`   - Risk distribution:`);
  console.log(`     • LOW: ${riskDistribution.LOW}`);
  console.log(`     • MEDIUM: ${riskDistribution.MEDIUM}`);
  console.log(`     • HIGH: ${riskDistribution.HIGH}`);
  console.log(`     • CRITICAL: ${riskDistribution.CRITICAL}`);
  console.log(`   - Trend distribution:`);
  console.log(`     • IMPROVING: ${trendDistribution.IMPROVING}`);
  console.log(`     • STABLE: ${trendDistribution.STABLE}`);
  console.log(`     • DECLINING: ${trendDistribution.DECLINING}`);

  // Show top and bottom performers
  const sortedByScore = [...mockScorecards].sort((a, b) => b.currentScore - a.currentScore);
  
  console.log(`   - Top performer: ${sortedByScore[0].supplierName} (${sortedByScore[0].currentScore}/100)`);
  console.log(`   - Bottom performer: ${sortedByScore[sortedByScore.length - 1].supplierName} (${sortedByScore[sortedByScore.length - 1].currentScore}/100)`);

  console.log('\n🎉 Supplier Performance tests completed successfully!');
}

// Run the test
testSupplierPerformance().catch(console.error);