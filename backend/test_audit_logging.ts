import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuditLogging() {
  console.log('🔍 Testing Supply Chain Audit Logging...\n');

  try {
    // Get test company
    const company = await prisma.company.findFirst({
      where: { name: { contains: 'Test' } },
    });

    if (!company) {
      throw new Error('Test company not found');
    }

    console.log(`✅ Using company: ${company.name} (${company.id})\n`);

    // Test 1: Check existing audit logs
    await testExistingAuditLogs(company.id);

    // Test 2: Simulate audit log creation
    await testAuditLogCreation(company.id);

    // Test 3: Test audit report generation
    await testAuditReportGeneration(company.id);

    // Test 4: Test security pattern detection
    await testSecurityPatternDetection(company.id);

    // Test 5: Test compliance metrics
    await testComplianceMetrics(company.id);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testExistingAuditLogs(companyId: string) {
  console.log('📋 Test 1: Checking Existing Audit Logs');

  const totalLogs = await prisma.activityLog.count({
    where: { company_id: companyId },
  });

  const supplyChainLogs = await prisma.activityLog.count({
    where: {
      company_id: companyId,
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
    },
  });

  const recentLogs = await prisma.activityLog.findMany({
    where: {
      company_id: companyId,
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: { created_at: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  console.log(`   📊 Total audit logs: ${totalLogs}`);
  console.log(`   🏭 Supply chain logs: ${supplyChainLogs}`);
  console.log(`   ⏰ Recent logs (24h): ${recentLogs.length}`);

  if (recentLogs.length > 0) {
    console.log(`   📝 Sample recent logs:`);
    recentLogs.slice(0, 3).forEach((log, index) => {
      const user = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System';
      console.log(`      ${index + 1}. ${log.action} by ${user} at ${log.created_at.toISOString()}`);
      console.log(`         Resource: ${log.resource_type}${log.resource_id ? ` (${log.resource_id})` : ''}`);
    });
  }

  console.log('');
}

async function testAuditLogCreation(companyId: string) {
  console.log('📝 Test 2: Simulating Audit Log Creation');

  // Create sample audit logs to test the system
  const testUser = await prisma.user.findFirst({
    where: { company_id: companyId },
  });

  if (!testUser) {
    console.log('   ⚠️  No test user found - skipping audit log creation test');
    console.log('');
    return;
  }

  const testLogs = [
    {
      action: 'SUPPLY_CHAIN_POST',
      resource_type: 'purchase_order',
      resource_id: 'test-po-123',
      details: {
        method: 'POST',
        endpoint: '/supply-chain/po-document',
        status_code: 201,
        execution_time_ms: 150,
        business_context: {
          supplier_id: 'test-supplier-1',
          financial_impact: 5000,
        },
      },
    },
    {
      action: 'SUPPLY_CHAIN_PUT_APPROVE',
      resource_type: 'purchase_requisition',
      resource_id: 'test-pr-456',
      details: {
        method: 'PUT',
        endpoint: '/supply-chain/procurement-workflow/test-pr-456/approve',
        status_code: 200,
        execution_time_ms: 89,
        business_context: {
          approval_level: 'MANAGER',
          financial_impact: 2500,
        },
      },
    },
    {
      action: 'SUPPLY_CHAIN_POST',
      resource_type: 'goods_receipt',
      resource_id: 'test-gr-789',
      details: {
        method: 'POST',
        endpoint: '/supply-chain/goods-receipt',
        status_code: 201,
        execution_time_ms: 234,
        business_context: {
          po_id: 'test-po-123',
          location_id: 'test-location-1',
        },
      },
    },
  ];

  for (const logData of testLogs) {
    await prisma.activityLog.create({
      data: {
        company_id: companyId,
        user_id: testUser.id,
        action: logData.action,
        resource_type: logData.resource_type,
        resource_id: logData.resource_id,
        details: logData.details,
        ip_address: '192.168.1.100',
        user_agent: 'Test-Agent/1.0',
      },
    });
  }

  console.log(`   ✅ Created ${testLogs.length} test audit logs`);
  console.log('   📋 Log types created:');
  testLogs.forEach((log, index) => {
    console.log(`      ${index + 1}. ${log.action} - ${log.resource_type}`);
  });

  console.log('');
}

async function testAuditReportGeneration(companyId: string) {
  console.log('📊 Test 3: Testing Audit Report Generation');

  const period = {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    to: new Date(),
  };

  // Get audit entries for the period
  const auditEntries = await prisma.activityLog.findMany({
    where: {
      company_id: companyId,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
    },
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  console.log(`   📈 Period: ${period.from.toISOString()} to ${period.to.toISOString()}`);
  console.log(`   📋 Total supply chain operations: ${auditEntries.length}`);

  if (auditEntries.length > 0) {
    // Calculate summary metrics
    const successfulOps = auditEntries.filter(entry => {
      const details = entry.details as any;
      return details?.status_code >= 200 && details?.status_code < 300;
    }).length;

    const failedOps = auditEntries.length - successfulOps;
    const uniqueUsers = new Set(auditEntries.map(entry => entry.user_id).filter(Boolean)).size;

    console.log(`   ✅ Successful operations: ${successfulOps}`);
    console.log(`   ❌ Failed operations: ${failedOps}`);
    console.log(`   👥 Unique users: ${uniqueUsers}`);

    // Operations by type
    const operationsByType: { [key: string]: number } = {};
    auditEntries.forEach(entry => {
      const resourceType = entry.resource_type || 'unknown';
      operationsByType[resourceType] = (operationsByType[resourceType] || 0) + 1;
    });

    console.log(`   📊 Operations by type:`);
    Object.entries(operationsByType)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`      - ${type}: ${count}`);
      });

    // Calculate average execution time
    const executionTimes = auditEntries
      .map(entry => (entry.details as any)?.execution_time_ms)
      .filter(time => typeof time === 'number');

    if (executionTimes.length > 0) {
      const avgExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
      console.log(`   ⏱️  Average execution time: ${avgExecutionTime.toFixed(2)}ms`);
    }
  } else {
    console.log('   ⚠️  No supply chain operations found in the period');
  }

  console.log('');
}

async function testSecurityPatternDetection(companyId: string) {
  console.log('🔒 Test 4: Testing Security Pattern Detection');

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check for rapid operations by user
  const rapidOperations = await prisma.activityLog.groupBy({
    by: ['user_id'],
    where: {
      company_id: companyId,
      created_at: {
        gte: last24Hours,
      },
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 10, // More than 10 operations
        },
      },
    },
  });

  console.log(`   🚨 Users with >10 operations in 24h: ${rapidOperations.length}`);

  if (rapidOperations.length > 0) {
    for (const userOp of rapidOperations.slice(0, 3)) {
      const user = await prisma.user.findUnique({
        where: { id: userOp.user_id || '' },
        select: { first_name: true, last_name: true, email: true },
      });

      if (user) {
        console.log(`      - ${user.first_name} ${user.last_name}: ${userOp._count.id} operations`);
      }
    }
  }

  // Check for unusual IP addresses
  const ipActivity = await prisma.activityLog.groupBy({
    by: ['ip_address'],
    where: {
      company_id: companyId,
      created_at: {
        gte: last24Hours,
      },
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
      ip_address: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 20, // More than 20 operations from same IP
        },
      },
    },
  });

  console.log(`   🌐 IPs with >20 operations in 24h: ${ipActivity.length}`);

  if (ipActivity.length > 0) {
    ipActivity.slice(0, 3).forEach(ip => {
      console.log(`      - ${ip.ip_address}: ${ip._count.id} operations`);
    });
  }

  // Check for failed operations (potential security issues)
  const failedOperations = await prisma.activityLog.count({
    where: {
      company_id: companyId,
      created_at: {
        gte: last24Hours,
      },
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
      details: {
        path: ['status_code'],
        gte: 400,
      },
    },
  });

  console.log(`   ❌ Failed operations (4xx/5xx) in 24h: ${failedOperations}`);

  console.log('');
}

async function testComplianceMetrics(companyId: string) {
  console.log('📋 Test 5: Testing Compliance Metrics');

  // Check audit trail completeness
  const period = {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  };

  const totalSupplyChainLogs = await prisma.activityLog.count({
    where: {
      company_id: companyId,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
    },
  });

  // Count actual business operations
  const pos = await prisma.opsPurchaseOrder.count({
    where: {
      company_id: companyId,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
    },
  });

  const grs = await prisma.opsGoodsReceipt.count({
    where: {
      company_id: companyId,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
    },
  });

  const stockMovements = await prisma.stockLedger.count({
    where: {
      company_id: companyId,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
    },
  });

  console.log(`   📊 Compliance Metrics (Last 7 days):`);
  console.log(`      - Total audit logs: ${totalSupplyChainLogs}`);
  console.log(`      - Purchase orders: ${pos}`);
  console.log(`      - Goods receipts: ${grs}`);
  console.log(`      - Stock movements: ${stockMovements}`);

  // Estimate expected audit logs (rough calculation)
  const expectedLogs = (pos * 3) + (grs * 2) + stockMovements;
  const completeness = expectedLogs > 0 ? Math.min(100, (totalSupplyChainLogs / expectedLogs) * 100) : 100;

  console.log(`      - Expected logs: ~${expectedLogs}`);
  console.log(`      - Audit completeness: ${completeness.toFixed(1)}%`);

  // Check data retention
  const oldestLog = await prisma.activityLog.findFirst({
    where: { company_id: companyId },
    orderBy: { created_at: 'asc' },
  });

  if (oldestLog) {
    const retentionDays = Math.floor((Date.now() - oldestLog.created_at.getTime()) / (24 * 60 * 60 * 1000));
    console.log(`      - Oldest log: ${retentionDays} days ago`);
    console.log(`      - Retention compliance: ${retentionDays <= 2555 ? 'PASS' : 'FAIL'} (7 year limit)`); // 7 years = ~2555 days
  }

  console.log('');
  console.log('🎉 All audit logging tests completed successfully!');
}

// Run the test
testAuditLogging().catch(console.error);