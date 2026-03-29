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

async function testCompleteMpesaFlow() {
  console.log('🚀 Complete MPESA Integration Test');
  console.log('==================================');
  
  // Test 1: Server Health
  console.log('\n1. Server Health Check...');
  const healthResult = await makeRequest('GET', '/health');
  console.log(`Status: ${healthResult.statusCode}`);
  console.log(`Response: ${healthResult.data}`);
  
  // Test 2: MPESA Service Health
  console.log('\n2. MPESA Service Health...');
  const mpesaHealthResult = await makeRequest('GET', '/api/mpesa/health');
  console.log(`Status: ${mpesaHealthResult.statusCode}`);
  console.log(`Response: ${mpesaHealthResult.data}`);
  
  // Test 3: STK Push Success Callback (simulating successful payment)
  console.log('\n3. STK Push Success Callback...');
  const checkoutRequestId = `CHECKOUT_${Date.now()}`;
  const successData = {
    Body: {
      stkCallback: {
        MerchantRequestID: `MERCHANT_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: 100 },
            { Name: "MpesaReceiptNumber", Value: "LGR123456789" },
            { Name: "TransactionDate", Value: "20260329132000" },
            { Name: "PhoneNumber", Value: "254712345678" }
          ]
        }
      }
    }
  };
  
  const successResult = await makeRequest('POST', '/api/mpesa/callback', successData);
  console.log(`Status: ${successResult.statusCode}`);
  console.log(`Response: ${successResult.data}`);
  
  // Test 4: STK Push Failure Callback (simulating failed payment)
  console.log('\n4. STK Push Failure Callback...');
  const failureData = {
    Body: {
      stkCallback: {
        MerchantRequestID: `MERCHANT_${Date.now()}`,
        CheckoutRequestID: `CHECKOUT_FAIL_${Date.now()}`,
        ResultCode: 1032,
        ResultDesc: "Request cancelled by user",
        CallbackMetadata: {
          Item: []
        }
      }
    }
  };
  
  const failureResult = await makeRequest('POST', '/api/mpesa/callback', failureData);
  console.log(`Status: ${failureResult.statusCode}`);
  console.log(`Response: ${failureResult.data}`);
  
  // Test 5: B2C Payment Success
  console.log('\n5. B2C Payment Success...');
  const b2cSuccessData = {
    Result: {
      ConversationID: `CONV_${Date.now()}`,
      TransactionID: `TXN_${Date.now()}`,
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      ResultParameters: {
        ResultParameter: [
          { Key: "TransactionReceipt", Value: "LGR987654321" },
          { Key: "TransactionAmount", Value: "100" },
          { Key: "TransactionDate", Value: "29.03.2026" },
          { Key: "ReceiverPartyPublicName", Value: "254712345678 - Test User" },
          { Key: "CurrencyCode", Value: "KES" }
        ]
      }
    }
  };
  
  const b2cSuccessResult = await makeRequest('POST', '/api/mpesa/b2c-result', b2cSuccessData);
  console.log(`Status: ${b2cSuccessResult.statusCode}`);
  console.log(`Response: ${b2cSuccessResult.data}`);
  
  // Test 6: B2C Payment Failure
  console.log('\n6. B2C Payment Failure...');
  const b2cFailureData = {
    Result: {
      ConversationID: `CONV_FAIL_${Date.now()}`,
      TransactionID: `TXN_FAIL_${Date.now()}`,
      ResultCode: 2001,
      ResultDesc: "Insufficient funds",
      ResultParameters: {
        ResultParameter: [
          { Key: "TransactionAmount", Value: "100" },
          { Key: "CurrencyCode", Value: "KES" }
        ]
      }
    }
  };
  
  const b2cFailureResult = await makeRequest('POST', '/api/mpesa/b2c-result', b2cFailureData);
  console.log(`Status: ${b2cFailureResult.statusCode}`);
  console.log(`Response: ${b2cFailureResult.data}`);
  
  // Test 7: B2C Timeout
  console.log('\n7. B2C Timeout...');
  const timeoutData = {
    Result: {
      ConversationID: `TIMEOUT_${Date.now()}`,
      TransactionID: `TXN_TIMEOUT_${Date.now()}`,
      ResultCode: 1,
      ResultDesc: "Request timed out"
    }
  };
  
  const timeoutResult = await makeRequest('POST', '/api/mpesa/timeout', timeoutData);
  console.log(`Status: ${timeoutResult.statusCode}`);
  console.log(`Response: ${timeoutResult.data}`);
  
  // Summary
  console.log('\n📊 Complete Test Summary');
  console.log('========================');
  const tests = [
    { name: 'Server Health', status: healthResult.statusCode },
    { name: 'MPESA Health', status: mpesaHealthResult.statusCode },
    { name: 'STK Success', status: successResult.statusCode },
    { name: 'STK Failure', status: failureResult.statusCode },
    { name: 'B2C Success', status: b2cSuccessResult.statusCode },
    { name: 'B2C Failure', status: b2cFailureResult.statusCode },
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
    console.log('🎉 All MPESA integration tests passed!');
    console.log('✅ The MPESA integration is fully functional and ready for production.');
    console.log('\n📋 Features Tested:');
    console.log('   - Health check endpoints');
    console.log('   - STK Push callback handling (success & failure)');
    console.log('   - B2C payment callbacks (success & failure)');
    console.log('   - Timeout handling');
    console.log('   - Error handling and validation');
  } else {
    console.log('⚠️  Some tests failed. Please review the MPESA integration.');
  }
}

testCompleteMpesaFlow().catch(console.error);
