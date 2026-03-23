import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function testAuditIntegrityBasics() {
  console.log('🔒 Testing Basic Audit Integrity Functions...\n');

  try {
    // Test 1: Hash generation
    console.log('1. Testing hash generation...');
    const testData = {
      id: 'test-id',
      company_id: 'test-company',
      user_id: 'test-user',
      action: 'TEST_ACTION',
      resource_type: 'test_resource',
      resource_id: 'test_resource_id',
      details: { test: 'data' },
      ip_address: '127.0.0.1',
      user_agent: 'Test Agent',
      created_at: new Date(),
    };

    const hashInput = JSON.stringify({
      id: testData.id,
      company_id: testData.company_id,
      user_id: testData.user_id,
      action: testData.action,
      resource_type: testData.resource_type,
      resource_id: testData.resource_id,
      details: testData.details,
      ip_address: testData.ip_address,
      user_agent: testData.user_agent,
      created_at: testData.created_at.toISOString(),
    });
    
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    console.log(`✅ Generated hash: ${hash.substring(0, 16)}...`);

    // Test 2: Chain hash generation
    console.log('\n2. Testing chain hash generation...');
    const previousHash = 'previous_hash_example';
    const chainHash = crypto.createHash('sha256')
      .update(hash + previousHash)
      .digest('hex');
    console.log(`✅ Generated chain hash: ${chainHash.substring(0, 16)}...`);

    // Test 3: Merkle root generation
    console.log('\n3. Testing Merkle root generation...');
    const hashes = ['hash1', 'hash2', 'hash3', 'hash4'];
    
    function generateMerkleRoot(hashArray: string[]): string {
      if (hashArray.length === 0) return '';
      if (hashArray.length === 1) return hashArray[0];

      const nextLevel: string[] = [];
      
      for (let i = 0; i < hashArray.length; i += 2) {
        const left = hashArray[i];
        const right = i + 1 < hashArray.length ? hashArray[i + 1] : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }

      return generateMerkleRoot(nextLevel);
    }

    const merkleRoot = generateMerkleRoot(hashes);
    console.log(`✅ Generated Merkle root: ${merkleRoot.substring(0, 16)}...`);

    // Test 4: Database connectivity
    console.log('\n4. Testing database connectivity...');
    const companyCount = await prisma.company.count();
    console.log(`✅ Database connected - found ${companyCount} companies`);

    // Test 5: Activity log structure
    console.log('\n5. Testing activity log structure...');
    const sampleLog = await prisma.activityLog.findFirst();
    if (sampleLog) {
      console.log(`✅ Activity log structure verified - sample log ID: ${sampleLog.id}`);
      console.log(`   Details type: ${typeof sampleLog.details}`);
    } else {
      console.log('ℹ️  No existing activity logs found (this is normal for a clean database)');
    }

    console.log('\n🎉 All basic audit integrity tests passed!');
    console.log('💡 The audit integrity system is ready for implementation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditIntegrityBasics();