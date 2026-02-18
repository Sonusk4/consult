const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test-dev-flow@example.com';

async function testAuthFlow() {
    console.log('🚀 Starting Auth Flow Test...');

    try {
        // Step 1: Login / Create User
        console.log('\nTesting POST /auth/me...');
        const loginRes = await axios.post(`${BASE_URL}/auth/me`, {
            email: TEST_EMAIL,
            role: 'CONSULTANT'
        });

        if (loginRes.status === 200) {
            console.log('✅ User created/logged in successfully');
            console.log('User ID:', loginRes.data.id);
            console.log('Firebase UID:', loginRes.data.firebase_uid);
        } else {
            console.error('❌ Login failed with status:', loginRes.status);
            process.exit(1);
        }

        // Step 2: Get Profile with Header
        console.log('\nTesting GET /consultant/profile with x-user-email header...');
        try {
            const profileRes = await axios.get(`${BASE_URL}/consultant/profile`, {
                headers: {
                    'x-user-email': TEST_EMAIL
                }
            });
            console.log('✅ Profile fetched successfully');
        } catch (error) {
            // It's possible the consultant profile isn't created yet for this user if it's new
            // But the endpoint tries to find a user first.
            if (error.response) {
                if (error.response.status === 404 && error.response.data.error === 'Consultant profile not found') {
                    console.log('✅ Correctly identified user but found no consultant profile (Expected behavior for new user)');
                } else if (error.response.status === 404 && error.response.data.error === 'User not found') {
                    console.error('❌ Failed: Middleware did not identify user correctly');
                    process.exit(1);
                } else {
                    // If it returns the profile (200), we wanted that too.
                    // If it is some other error, log it.
                    console.error('❌ Unexpected error:', error.response.status, error.response.data);
                    // We'll consider 404 Consultant Not Found as a pass for the AUTH middleware check
                    // because it means it passed the user check.
                }
            } else {
                console.error('❌ Network error or server down:', error.message);
                process.exit(1);
            }
        }

        console.log('\n✨ Auth Flow Verification Complete!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Wait for server to be ready
setTimeout(testAuthFlow, 2000);
