#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test configurations
const tests = [
  {
    name: 'MPESA Health Check',
    method: 'GET',
    url: `${BASE_URL}/api/mpesa/health`,
    expectedStatus: 200
  },
  {
    name: 'STK Push Callback Test',
    method: 'POST',
    url: `${BASE_URL}/api/mpesa/callback`,
    data: {
      Body: {
        stkCallback: {
          MerchantRequestID: `TEST_MERCHANT_${Date.now()}`,
          CheckoutRequestID: `TEST_CHECKOUT_${Date.now()}`,
          ResultCode: 0,
          ResultDesc: "Success",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 100 },
              { Name: "PhoneNumber", Value: "254712345678" },
              { Name: "MpesaReceiptNumber", Value: "TEST123456" }
            ]
          }
        }
      }
    },
    expectedStatus: 200
  },
  {
    name: 'B2C Result Callback Test',
    method: 'POST',
    url: `${BASE_URL}/api/mpesa/b2c-result`,
    data: {
      Result: {
        ConversationID: `TEST_CONV_${Date.now()}`,
        TransactionID: `TEST_TXN_${Date.now()}`,
        ResultCode: 0,
        ResultDesc: "Success",
        ResultParameters: {
          ResultParameter: [
            { Key: "Amount", Value: 100 },
            { Key: "TransactionID", Value: `TEST_TXN_${Date.now()}` },
            { Key: "ReceiverPartyPublicName", Value: "254712345678" }
          ]
        }
      }
    },
    expectedStatus: 200
  },
  {
    name: 'B2C Timeout Callback Test',
    method: 'POST',
    url: `${BASE_URL}/api/mpesa/timeout`,
    data: {
      Result: {
        ConversationID: `TEST_TIMEOUT_${Date.now()}`,
        TransactionID: `TEST_TXN_TIMEOUT_${Date.now()}`,
        ResultCode: 1,
        ResultDesc: "Timeout",
        ResultParameters: {
          ResultParameter: [
            { Key: "Amount", Value: 100 },
            { Key: "TransactionID", Value: `TEST_TXN_TIMEOUT_${Date.now()}` }
          ]
        }
      }
    },
    expectedStatus: 200
  }
];

async function runTest(test) {
  console.log(`\n🧪 Running: ${test.name}`);
  console.log(`   ${test.method} ${test.url}`);
  
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = test.data ? JSON.stringify(test.data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === test.expectedStatus) {
          console.log(`   ✅ PASS - Status: ${res.statusCode}`);
          try {
            const jsonData = JSON.parse(data);
            console.log(`   📄 Response: ${JSON.stringify(jsonData)}`);
          } catch (e) {
            console.log(`   📄 Response: ${data}`);
          }
          resolve(true);
        } else {
          console.log(`   ❌ FAIL - Expected ${test.expectedStatus}, got ${res.statusCode}`);
          try {
            const jsonData = JSON.parse(data);
            console.log(`   📄 Response: ${JSON.stringify(jsonData)}`);
          } catch (e) {
            console.log(`   📄 Response: ${data}`);
          }
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ FAIL - Error: ${error.message}`);
      resolve(false);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting MPESA Integration Tests');
  console.log('=====================================');
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await runTest(test);
    if (result) passed++;
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! MPESA integration is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the MPESA integration.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
