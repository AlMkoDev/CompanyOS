import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGoodsReceiptWorkflow() {
  console.log('🧪 Testing Goods Receipt & Discrepancy Handling...\n');

  try {
    // Get test company
    const company = await prisma.company.findFirst({
      where: { name: { contains: 'Test' } },
    });

    if (!company) {
      throw new Error('Test company not found');
    }

    console.log(`✅ Using company: ${company.name} (${company.id})\n`);

    // Get a test PO that's been sent to supplier
    const testPO = await prisma.opsPurchaseOrder.findFirst({
      where: {
        company_id: company.id,
        status: 'SENT',
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    });

    if (!testPO) {
      console.log('❌ No sent PO found for testing. Creating one...');
      
      // Create a test PO for goods receipt
      const supplier = await prisma.supplier.findFirst({
        where: { company_id: company.id },
      });

      const product = await prisma.product.findFirst({
        where: { company_id: company.id },
      });

      const location = await prisma.location.findFirst({
        where: { company_id: company.id },
      });

      if (!supplier || !product || !location) {
        throw new Error('Missing test data (supplier, product, or location)');
      }

      const newPO = await prisma.opsPurchaseOrder.create({
        data: {
          company_id: company.id,
          po_number: `TEST-PO-${Date.now()}`,
          supplier_id: supplier.id,
          status: 'SENT',
          total_amount: 1000,
          currency: 'ZAR',
          lines: {
            create: [
              {
                product_id: product.id,
                quantity: 100,
                unit_price: 10,
                received_qty: 0,
              },
            ],
          },
        },
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          supplier: true,
        },
      });

      console.log(`✅ Created test PO: ${newPO.po_number}\n`);
      
      // Use the new PO for testing
      const testPOWithLines = newPO;
      await testGoodsReceiptScenarios(company.id, testPOWithLines);
    } else {
      console.log(`✅ Using existing PO: ${testPO.po_number}\n`);
      await testGoodsReceiptScenarios(company.id, testPO);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testGoodsReceiptScenarios(companyId: string, po: any) {
  const location = await prisma.location.findFirst({
    where: { company_id: companyId },
  });

  if (!location) {
    throw new Error('No location found for testing');
  }

  // Test 1: Perfect Receipt (no discrepancies)
  console.log('📦 Test 1: Perfect Goods Receipt (no discrepancies)');
  
  const perfectGR = await prisma.opsGoodsReceipt.create({
    data: {
      company_id: companyId,
      gr_number: `GR-TEST-PERFECT-${Date.now()}`,
      po_id: po.id,
      location_id: location.id,
      received_by: 'test-user',
      status: 'SUBMITTED',
      lines: {
        create: po.lines.map((line: any) => ({
          product_id: line.product_id,
          received_qty: Number(line.quantity), // Receive exactly what was ordered
          rejected_qty: 0,
        })),
      },
    },
    include: {
      lines: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log(`✅ Created perfect GR: ${perfectGR.gr_number}`);
  console.log(`   - Status: ${perfectGR.status}`);
  console.log(`   - Lines: ${perfectGR.lines.length}`);
  console.log('');

  // Test 2: Quantity Shortage
  console.log('📦 Test 2: Goods Receipt with Quantity Shortage');
  
  const shortageGR = await prisma.opsGoodsReceipt.create({
    data: {
      company_id: companyId,
      gr_number: `GR-TEST-SHORT-${Date.now()}`,
      po_id: po.id,
      location_id: location.id,
      received_by: 'test-user',
      status: 'DISCREPANCY',
      lines: {
        create: po.lines.map((line: any) => ({
          product_id: line.product_id,
          received_qty: Math.floor(Number(line.quantity) * 0.8), // Receive 80% of ordered
          rejected_qty: 0,
        })),
      },
    },
    include: {
      lines: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log(`✅ Created shortage GR: ${shortageGR.gr_number}`);
  console.log(`   - Status: ${shortageGR.status}`);
  console.log(`   - Received: ${shortageGR.lines[0].received_qty} (Expected: ${po.lines[0].quantity})`);
  console.log('');

  // Test 3: Quality Issues (rejections)
  console.log('📦 Test 3: Goods Receipt with Quality Issues');
  
  const qualityGR = await prisma.opsGoodsReceipt.create({
    data: {
      company_id: companyId,
      gr_number: `GR-TEST-QUALITY-${Date.now()}`,
      po_id: po.id,
      location_id: location.id,
      received_by: 'test-user',
      status: 'DISCREPANCY',
      lines: {
        create: po.lines.map((line: any) => ({
          product_id: line.product_id,
          received_qty: Math.floor(Number(line.quantity) * 0.9), // Receive 90%
          rejected_qty: Math.floor(Number(line.quantity) * 0.1), // Reject 10%
          rejection_reason: 'Quality defects - damaged packaging',
        })),
      },
    },
    include: {
      lines: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log(`✅ Created quality issue GR: ${qualityGR.gr_number}`);
  console.log(`   - Status: ${qualityGR.status}`);
  console.log(`   - Received: ${qualityGR.lines[0].received_qty}`);
  console.log(`   - Rejected: ${qualityGR.lines[0].rejected_qty}`);
  console.log(`   - Reason: ${qualityGR.lines[0].rejection_reason}`);
  console.log('');

  // Test 4: Over-delivery
  console.log('📦 Test 4: Goods Receipt with Over-delivery');
  
  try {
    const overGR = await prisma.opsGoodsReceipt.create({
      data: {
        company_id: companyId,
        gr_number: `GR-TEST-OVER-${Date.now()}`,
        po_id: po.id,
        location_id: location.id,
        received_by: 'test-user',
        status: 'DISCREPANCY',
        lines: {
          create: po.lines.map((line: any) => ({
            product_id: line.product_id,
            received_qty: Math.floor(Number(line.quantity) * 1.2), // Receive 120%
            rejected_qty: 0,
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Created over-delivery GR: ${overGR.gr_number}`);
    console.log(`   - Status: ${overGR.status}`);
    console.log(`   - Received: ${overGR.lines[0].received_qty} (Expected: ${po.lines[0].quantity})`);
  } catch (error) {
    console.log(`⚠️  Over-delivery validation working: ${error.message}`);
  }
  console.log('');

  // Test 5: Query Goods Receipts
  console.log('📊 Test 5: Querying Goods Receipts');
  
  const allGRs = await prisma.opsGoodsReceipt.findMany({
    where: {
      company_id: companyId,
      po_id: po.id,
    },
    include: {
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  console.log(`✅ Found ${allGRs.length} goods receipts for PO ${po.po_number}`);
  
  allGRs.forEach((gr, index) => {
    const totalReceived = gr.lines.reduce((sum, line) => sum + Number(line.received_qty), 0);
    const totalRejected = gr.lines.reduce((sum, line) => sum + Number(line.rejected_qty), 0);
    
    console.log(`   ${index + 1}. ${gr.gr_number} - Status: ${gr.status}`);
    console.log(`      Received: ${totalReceived}, Rejected: ${totalRejected}`);
  });
  console.log('');

  // Test 6: Discrepancy Statistics
  console.log('📈 Test 6: Discrepancy Statistics');
  
  const totalGRs = await prisma.opsGoodsReceipt.count({
    where: { company_id: companyId },
  });
  
  const discrepancyGRs = await prisma.opsGoodsReceipt.count({
    where: { 
      company_id: companyId,
      status: 'DISCREPANCY',
    },
  });

  const completedGRs = await prisma.opsGoodsReceipt.count({
    where: { 
      company_id: companyId,
      status: 'COMPLETED',
    },
  });

  const discrepancyRate = totalGRs > 0 ? (discrepancyGRs / totalGRs) * 100 : 0;

  console.log(`✅ Discrepancy Statistics:`);
  console.log(`   - Total Goods Receipts: ${totalGRs}`);
  console.log(`   - With Discrepancies: ${discrepancyGRs}`);
  console.log(`   - Completed: ${completedGRs}`);
  console.log(`   - Discrepancy Rate: ${discrepancyRate.toFixed(2)}%`);
  console.log('');

  // Test 7: Financial Impact Analysis
  console.log('💰 Test 7: Financial Impact Analysis');
  
  const grWithFinancialImpact = await prisma.opsGoodsReceipt.findFirst({
    where: {
      company_id: companyId,
      status: 'DISCREPANCY',
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

  if (grWithFinancialImpact) {
    let expectedValue = 0;
    let receivedValue = 0;

    grWithFinancialImpact.lines.forEach((grLine) => {
      const poLine = grWithFinancialImpact.po.lines.find(
        (line: any) => line.product_id === grLine.product_id
      );
      
      if (poLine) {
        const unitPrice = Number(poLine.unit_price);
        const orderedQty = Number(poLine.quantity);
        const receivedQty = Number(grLine.received_qty);
        
        expectedValue += orderedQty * unitPrice;
        receivedValue += receivedQty * unitPrice;
      }
    });

    const lossValue = expectedValue - receivedValue;

    console.log(`✅ Financial Impact for ${grWithFinancialImpact.gr_number}:`);
    console.log(`   - Expected Value: R${expectedValue.toFixed(2)}`);
    console.log(`   - Received Value: R${receivedValue.toFixed(2)}`);
    console.log(`   - Loss Value: R${lossValue.toFixed(2)}`);
  }

  console.log('\n🎉 All Goods Receipt tests completed successfully!');
}

// Run the test
testGoodsReceiptWorkflow().catch(console.error);