#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        statusCode: 500,
        data: error.message
      });
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testMpesaIntegration() {
  console.log('🧪 Testing MPESA Integration (Simple Mode)');
  console.log('==========================================');
  
  // Test 1: Health Check
  console.log('\n1. Testing MPESA Health Check...');
  const healthResult = await makeRequest('GET', '/api/mpesa/health');
  console.log(`Status: ${healthResult.statusCode}`);
  console.log(`Response: ${healthResult.data}`);
  
  // Test 2: STK Callback with minimal data
  console.log('\n2. Testing STK Callback (minimal)...');
  const stkData = {
    Body: {
      stkCallback: {
        MerchantRequestID: `TEST_${Date.now()}`,
        CheckoutRequestID: `CHECKOUT_${Date.now()}`,
        ResultCode: 0,
        ResultDesc: "Success",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: 100 },
            { Name: "PhoneNumber", Value: "254712345678" }
          ]
        }
      }
    }
  };
  
  const stkResult = await makeRequest('POST', '/api/mpesa/callback', stkData);
  console.log(`Status: ${stkResult.statusCode}`);
  console.log(`Response: ${stkResult.data}`);
  
  // Test 3: B2C Result Callback
  console.log('\n3. Testing B2C Result Callback...');
  const b2cData = {
    Result: {
      ConversationID: `B2C_${Date.now()}`,
      TransactionID: `TXN_${Date.now()}`,
      ResultCode: 0,
      ResultDesc: "Success",
      ResultParameters: {
        ResultParameter: [
          { Key: "Amount", Value: 100 },
          { Key: "TransactionID", Value: `TXN_${Date.now()}` }
        ]
      }
    }
  };
  
  const b2cResult = await makeRequest('POST', '/api/mpesa/b2c-result', b2cData);
  console.log(`Status: ${b2cResult.statusCode}`);
  console.log(`Response: ${b2cResult.data}`);
  
  // Test 4: B2C Timeout Callback
  console.log('\n4. Testing B2C Timeout Callback...');
  const timeoutData = {
    Result: {
      ConversationID: `TIMEOUT_${Date.now()}`,
      TransactionID: `TIMEOUT_TXN_${Date.now()}`,
      ResultCode: 1,
      ResultDesc: "Timeout"
    }
  };
  
  const timeoutResult = await makeRequest('POST', '/api/mpesa/timeout', timeoutData);
  console.log(`Status: ${timeoutResult.statusCode}`);
  console.log(`Response: ${timeoutResult.data}`);
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const tests = [
    { name: 'Health Check', status: healthResult.statusCode },
    { name: 'STK Callback', status: stkResult.statusCode },
    { name: 'B2C Result', status: b2cResult.statusCode },
    { name: 'B2C Timeout', status: timeoutResult.statusCode }
  ];
  
  const passed = tests.filter(t => t.status === 200).length;
  const total = tests.length;
  
  tests.forEach(test => {
    const icon = test.status === 200 ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
  });
  
  console.log(`\nResult: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All MPESA endpoints are working correctly!');
  } else {
    console.log('⚠️  Some MPESA endpoints have issues.');
  }
}

testMpesaIntegration().catch(console.error);
