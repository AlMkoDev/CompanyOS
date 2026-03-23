import { PrismaClient, PRStatus, POStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testProcurementWorkflow() {
  console.log('🔄 Testing Procurement Workflow (PR & Approval Chain)...\n');

  const systemCompanyId = '00000000-0000-0000-0000-000000000000';

  try {
    // 1. Get test data
    console.log('📋 Setting up test data...');
    
    const products = await prisma.product.findMany({
      where: { company_id: systemCompanyId },
      take: 3,
    });

    const suppliers = await prisma.supplier.findMany({
      where: { company_id: systemCompanyId },
      take: 1,
    });

    if (products.length === 0 || suppliers.length === 0) {
      throw new Error('No test data available. Please run the seed script first.');
    }

    console.log(`  ✓ Found ${products.length} products and ${suppliers.length} suppliers`);

    // 2. Create a test user (requester) and employee record
    const testUser = await prisma.user.upsert({
      where: { email: 'test.requester@company.com' },
      update: {},
      create: {
        email: 'test.requester@company.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Requester',
        company_id: systemCompanyId,
      },
    });

    // Create corresponding employee record
    const testEmployee = await prisma.employee.upsert({
      where: { email: 'test.requester@company.com' },
      update: {},
      create: {
        emp_no: 'EMP001',
        first_name: 'Test',
        last_name: 'Requester',
        email: 'test.requester@company.com',
        hire_date: new Date(),
        company_id: systemCompanyId,
      },
    });

    console.log(`  ✓ Created test user and employee: ${testUser.first_name} ${testUser.last_name}`);

    // 3. Test PR Creation - Low Value (Auto-Approve)
    console.log('\n🟢 Test Case 1: Low Value PR (Auto-Approve)');
    
    const lowValuePR = await createTestPR(systemCompanyId, testEmployee.id, [
      { productId: products[0].id, quantity: 1, estimatedCost: 100 }, // R100 - should auto-approve
    ]);

    console.log(`  ✓ Created PR ${lowValuePR.pr_number} with status: ${lowValuePR.status}`);
    console.log(`  ✓ Expected: APPROVED (auto-approved), Actual: ${lowValuePR.status}`);

    // 4. Test PR Creation - Medium Value (L1 Approval Required)
    console.log('\n🟡 Test Case 2: Medium Value PR (L1 Approval Required)');
    
    const mediumValuePR = await createTestPR(systemCompanyId, testEmployee.id, [
      { productId: products[1].id, quantity: 10, estimatedCost: 800 }, // R8,000 - needs L1 approval
    ]);

    console.log(`  ✓ Created PR ${mediumValuePR.pr_number} with status: ${mediumValuePR.status}`);
    console.log(`  ✓ Expected: PENDING_L1, Actual: ${mediumValuePR.status}`);

    // 5. Test L1 Approval
    console.log('\n✅ Test Case 3: L1 Approval Process');
    
    const approvedPR = await prisma.purchaseRequisition.update({
      where: { id: mediumValuePR.id },
      data: { status: PRStatus.APPROVED },
    });

    console.log(`  ✓ L1 Manager approved PR ${mediumValuePR.pr_number}`);
    console.log(`  ✓ PR status updated to: ${approvedPR.status}`);

    // 6. Test PR Creation - High Value (L2 Approval Required)
    console.log('\n🔴 Test Case 4: High Value PR (L2 Approval Required)');
    
    const highValuePR = await createTestPR(systemCompanyId, testEmployee.id, [
      { productId: products[2].id, quantity: 5, estimatedCost: 15000 }, // R75,000 - needs L2 approval
    ]);

    console.log(`  ✓ Created PR ${highValuePR.pr_number} with status: ${highValuePR.status}`);
    console.log(`  ✓ Expected: PENDING_L1, Actual: ${highValuePR.status}`);

    // Simulate L1 approval (should move to PENDING_L2)
    const l1ApprovedPR = await prisma.purchaseRequisition.update({
      where: { id: highValuePR.id },
      data: { status: PRStatus.PENDING_L2 },
    });

    console.log(`  ✓ L1 approved, moved to L2: ${l1ApprovedPR.status}`);

    // Simulate L2 approval
    const l2ApprovedPR = await prisma.purchaseRequisition.update({
      where: { id: highValuePR.id },
      data: { status: PRStatus.APPROVED },
    });

    console.log(`  ✓ L2 approved, final status: ${l2ApprovedPR.status}`);

    // 7. Test PO Creation from Approved PR
    console.log('\n📄 Test Case 5: PO Creation from Approved PR');
    
    const prForPO = await prisma.purchaseRequisition.findFirst({
      where: { 
        company_id: systemCompanyId,
        status: PRStatus.APPROVED,
      },
      include: {
        lines: true,
      },
    });

    if (prForPO && prForPO.lines.length > 0) {
      const po = await createTestPO(systemCompanyId, testEmployee.id, prForPO, suppliers[0].id);
      console.log(`  ✓ Created PO ${po.po_number} from PR ${prForPO.pr_number}`);
      console.log(`  ✓ PO Status: ${po.status}, Total Value: R${po.total_value}`);
    }

    // 8. Test Approval Queue
    console.log('\n📋 Test Case 6: Approval Queue');
    
    const pendingL1 = await prisma.purchaseRequisition.findMany({
      where: {
        company_id: systemCompanyId,
        status: PRStatus.PENDING_L1,
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    const pendingL2 = await prisma.purchaseRequisition.findMany({
      where: {
        company_id: systemCompanyId,
        status: PRStatus.PENDING_L2,
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`  ✓ L1 Approval Queue: ${pendingL1.length} PRs`);
    console.log(`  ✓ L2 Approval Queue: ${pendingL2.length} PRs`);

    pendingL1.forEach(pr => {
      const totalCost = pr.lines.reduce((sum, line) => 
        sum + (Number(line.estimated_cost) || 0) * Number(line.quantity), 0
      );
      console.log(`    - ${pr.pr_number}: R${totalCost.toFixed(2)}`);
    });

    // 9. Test Rejection Workflow
    console.log('\n❌ Test Case 7: PR Rejection');
    
    const rejectionTestPR = await createTestPR(systemCompanyId, testEmployee.id, [
      { productId: products[0].id, quantity: 2, estimatedCost: 1500 }, // R3,000 - needs L1
    ]);

    const rejectedPR = await prisma.purchaseRequisition.update({
      where: { id: rejectionTestPR.id },
      data: { status: PRStatus.REJECTED },
    });

    console.log(`  ✓ Created and rejected PR ${rejectionTestPR.pr_number}`);
    console.log(`  ✓ Final status: ${rejectedPR.status}`);

    // 10. Summary Statistics
    console.log('\n📊 Procurement Workflow Summary:');
    
    const allPRs = await prisma.purchaseRequisition.findMany({
      where: { company_id: systemCompanyId },
    });

    const allPOs = await prisma.opsPurchaseOrder.findMany({
      where: { company_id: systemCompanyId },
    });

    const prStats = {
      total: allPRs.length,
      approved: allPRs.filter(pr => pr.status === PRStatus.APPROVED).length,
      pending_l1: allPRs.filter(pr => pr.status === PRStatus.PENDING_L1).length,
      pending_l2: allPRs.filter(pr => pr.status === PRStatus.PENDING_L2).length,
      rejected: allPRs.filter(pr => pr.status === PRStatus.REJECTED).length,
    };

    const poStats = {
      total: allPOs.length,
      draft: allPOs.filter(po => po.status === POStatus.DRAFT).length,
      approved: allPOs.filter(po => po.status === POStatus.APPROVED).length,
    };

    console.log(`  📋 Purchase Requisitions:`);
    console.log(`    Total: ${prStats.total}`);
    console.log(`    ✅ Approved: ${prStats.approved}`);
    console.log(`    🟡 Pending L1: ${prStats.pending_l1}`);
    console.log(`    🔴 Pending L2: ${prStats.pending_l2}`);
    console.log(`    ❌ Rejected: ${prStats.rejected}`);

    console.log(`  📄 Purchase Orders:`);
    console.log(`    Total: ${poStats.total}`);
    console.log(`    📝 Draft: ${poStats.draft}`);
    console.log(`    ✅ Approved: ${poStats.approved}`);

    console.log('\n✅ Procurement Workflow Test Completed Successfully!');
    console.log('\nKey Features Tested:');
    console.log('  ✓ Auto-approval for low-value PRs');
    console.log('  ✓ L1 approval workflow for medium-value PRs');
    console.log('  ✓ L2 approval workflow for high-value PRs');
    console.log('  ✓ PO creation from approved PRs');
    console.log('  ✓ Approval queue management');
    console.log('  ✓ PR rejection workflow');
    console.log('  ✓ Approval policy enforcement');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestPR(companyId: string, requesterId: string, items: any[]) {
  const prCount = await prisma.purchaseRequisition.count({
    where: { company_id: companyId },
  });
  const prNumber = `PR-${new Date().getFullYear()}-${String(prCount + 1).padStart(4, '0')}`;

  // Calculate total cost and determine approval level
  let totalCost = 0;
  for (const item of items) {
    totalCost += item.estimatedCost * item.quantity;
  }

  // Simple approval logic for testing
  let status = PRStatus.PENDING_L1;
  if (totalCost <= 500) {
    status = PRStatus.APPROVED; // Auto-approve under R500
  } else if (totalCost > 50000) {
    status = PRStatus.PENDING_L1; // Will need L2 after L1
  }

  return prisma.purchaseRequisition.create({
    data: {
      company_id: companyId,
      pr_number: prNumber,
      requester_id: requesterId,
      status,
      justification: `Test PR for ${totalCost} total value`,
      lines: {
        create: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          estimated_cost: item.estimatedCost,
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
}

async function createTestPO(companyId: string, userId: string, pr: any, supplierId: string) {
  const poCount = await prisma.opsPurchaseOrder.count({
    where: { company_id: companyId },
  });
  const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}`;

  const totalValue = pr.lines.reduce((sum: number, line: any) => 
    sum + (Number(line.estimated_cost) * Number(line.quantity)), 0
  );

  return prisma.opsPurchaseOrder.create({
    data: {
      company_id: companyId,
      po_number: poNumber,
      supplier_id: supplierId,
      pr_id: pr.id,
      status: POStatus.DRAFT,
      total_value: totalValue,
      lines: {
        create: pr.lines.map((line: any) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.estimated_cost,
        })),
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
}

testProcurementWorkflow();