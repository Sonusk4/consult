const Razorpay = require("razorpay");
require("dotenv").config({ path: '../.env' });

async function testRazorpay() {
  console.log('🔍 Testing Razorpay API Key...');
  console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
  console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');

  try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      
      console.log('✅ Razorpay instance created successfully');
      
      // Test creating a small order (₹1 = 100 paise)
      const options = {
        amount: 100, // ₹1 in paise
        currency: "INR",
        receipt: `test_receipt_${Date.now()}`,
        payment_capture: 1
      };
      
      console.log('📞 Testing order creation...');
      const order = await razorpay.orders.create(options);
      console.log('✅ Test order created successfully:', order);
      console.log('📊 Order ID:', order.id);
      console.log('💰 Amount:', order.amount);
      
    } else {
      console.log('❌ Razorpay credentials not found');
    }
  } catch (error) {
    console.error('❌ Razorpay API Test Failed:', error.message);
    console.error('❌ Full error:', error);
    if (error.statusCode) {
      console.error('❌ Status Code:', error.statusCode);
      console.error('❌ Error Code:', error.error?.code);
      console.error('❌ Description:', error.error?.description);
    }
  }
}

testRazorpay();
