import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock services for testing
class MockAuditService {
  async logActivity(data: any) {
    console.log('Mock audit log:', data.action);
  }
}

class MockNotificationService {
  async sendNotification(data: any) {
    console.log('Mock notification:', data.type);
  }
}

async function testServiceDuplicatePrevention() {
  console.log('🔒 Testing Service-Level Duplicate Prevention...\n');

  try {
    // Import the service
    const { SupplierBankSecurityService } = await import('./src/modules/supply-chain/services/supplier-bank-security.service.js');
    
    // Create mock services
    const auditService = new MockAuditService() as any;
    const notificationService = new MockNotificationService() as any;
    
    // Create the bank security service
    const bankSecurityService = new SupplierBankSecurityService(prisma, auditService, notificationService);

    // Create test data
    const testCompany = await prisma.company.create({
      data: {
        name: 'Service Test Company',
        industry: 'Testing',
      },
    });

    const testUser = await prisma.user.create({
      data: {
        email: `service.test.${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'Service',
        last_name: 'Tester',
        company_id: testCompany.id,
      },
    });

    const testSupplier = await prisma.supplier.create({
      data: {
        company_id: testCompany.id,
        supplier_code: `SERVICE-TEST-${Date.now()}`,
        name: 'Test Service Supplier',
        status: 'ACTIVE',
        bank_details: {
          bank_name: 'Original Bank',
          account_number: '1234567890',
          routing_number: '123456789',
          account_holder_name: 'Test Supplier Inc',
        },
      },
    });

    console.log('✅ Test data created successfully');

    // Test 1: Create first bank change request
    console.log('\n📝 Creating first bank change request...');
    const firstRequest = await bankSecurityService.requestBankDetailChange(
      testSupplier.id,
      {
        bank_name: 'New Bank 1',
        account_number: '1111111111',
        routing_number: '111111111',
        account_holder_name: 'Test Supplier Inc',
      },
      testUser.id,
      'First change request',
      testCompany.id,
    );
    console.log(`✅ First request created: ${firstRequest.id}`);

    // Test 2: Try to create duplicate request (should fail)
    console.log('\n🚫 Attempting to create duplicate request...');
    try {
      await bankSecurityService.requestBankDetailChange(
        testSupplier.id,
        {
          bank_name: 'New Bank 2',
          account_number: '2222222222',
          routing_number: '222222222',
          account_holder_name: 'Test Supplier Inc',
        },
        testUser.id,
        'Duplicate change request',
        testCompany.id,
      );
      
      console.log('❌ FAIL: Service allowed duplicate request (security risk)');
      return false;
    } catch (error) {
      if (error.message.includes('pending bank detail change request already exists')) {
        console.log('✅ PASS: Service correctly prevented duplicate request');
        console.log(`   Error message: ${error.message}`);
      } else {
        console.log(`❌ FAIL: Unexpected error: ${error.message}`);
        return false;
      }
    }

    // Test 3: Approve first request, then try to create another (should succeed)
    console.log('\n✅ Approving first request...');
    await bankSecurityService.approveBankDetailChange(
      firstRequest.id,
      testUser.id, // Using same user as approver for simplicity
      'Approved for testing',
      testCompany.id,
    );
    console.log('✅ First request approved');

    console.log('\n📝 Creating new request after approval...');
    const secondRequest = await bankSecurityService.requestBankDetailChange(
      testSupplier.id,
      {
        bank_name: 'New Bank 3',
        account_number: '3333333333',
        routing_number: '333333333',
        account_holder_name: 'Test Supplier Inc',
      },
      testUser.id,
      'New request after approval',
      testCompany.id,
    );
    console.log(`✅ Second request created successfully: ${secondRequest.id}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.bankChangeRequest.deleteMany({
      where: { supplier_id: testSupplier.id },
    });
    await prisma.supplier.delete({ where: { id: testSupplier.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.company.delete({ where: { id: testCompany.id } });
    console.log('✅ Cleanup completed');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🔒 Supplier Bank Security Service - Duplicate Prevention Test');
  console.log('=' .repeat(70));

  const success = await testServiceDuplicatePrevention();
  
  console.log('\n' + '='.repeat(70));
  if (success) {
    console.log('🎉 All service-level duplicate prevention tests passed!');
  } else {
    console.log('⚠️  Service-level duplicate prevention test failed!');
  }

  await prisma.$disconnect();
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});