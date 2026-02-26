const fetch = require('node-fetch');

async function testOTP() {
  try {
    console.log('🧪 Testing OTP endpoint...');

    const response = await fetch('http://localhost:5000/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });

    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOTP();
