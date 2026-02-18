const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
// Use timestamp to ensure uniqueness
const TIMESTAMP = Date.now();
const CONSULTANT_EMAIL = `consultant_${TIMESTAMP}@test.com`;
const USER_EMAIL = `user_${TIMESTAMP}@test.com`;

async function verifyFullFlow() {
    console.log('🚀 Starting Full Flow Verification...');

    try {
        // --- CONSULTANT FLOW ---
        console.log(`\n--- 1. Consultant Flow (${CONSULTANT_EMAIL}) ---`);

        // 1. Login/Signup as Consultant
        console.log('Logging in as Consultant...');
        const consLoginRes = await axios.post(`${BASE_URL}/auth/me`, {
            email: CONSULTANT_EMAIL,
            role: 'CONSULTANT'
        });
        const consultantUser = consLoginRes.data;
        console.log('✅ Consultant Logged In:', consultantUser.id);

        // 2. Check Profile (Should be blank initially)
        console.log('Checking Profile (Expect 404 or null)...');
        try {
            await axios.get(`${BASE_URL}/consultant/profile`, {
                headers: { 'x-user-email': CONSULTANT_EMAIL }
            });
            console.warn('⚠️ Profile found (Unexpected for new user, but proceeding)');
        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.log('✅ Profile correctly missing (Ready for onboarding)');
            } else {
                throw err;
            }
        }

        // 3. Onboarding (Create Profile)
        console.log('Submitting Onboarding Data...');
        const profileData = {
            domain: 'Software Architecture',
            hourly_price: 150,
            bio: 'Expert in scalable systems',
            languages: 'English, JavaScript'
        };
        // Note: register endpoint uses req.user to find the user to attach profile to
        const createProfileRes = await axios.post(`${BASE_URL}/consultant/register`, profileData, {
            headers: { 'x-user-email': CONSULTANT_EMAIL }
        });
        const consultantProfile = createProfileRes.data;
        console.log('✅ Profile Created:', consultantProfile.id);


        // --- USER FLOW ---
        console.log(`\n--- 2. User Flow (${USER_EMAIL}) ---`);

        // 4. Login/Signup as User
        console.log('Logging in as User...');
        const userLoginRes = await axios.post(`${BASE_URL}/auth/me`, {
            email: USER_EMAIL,
            role: 'USER'
        });
        const userUser = userLoginRes.data;
        console.log('✅ User Logged In:', userUser.id);

        // 5. Create Booking
        console.log('Creating Booking...');
        const bookingData = {
            consultant_id: consultantProfile.id,
            date: new Date().toISOString(),
            time_slot: '10:00 AM'
        };
        const bookingRes = await axios.post(`${BASE_URL}/bookings/create`, bookingData, {
            headers: { 'x-user-email': USER_EMAIL }
        });
        console.log('✅ Booking Created:', bookingRes.data.id);

        // 6. Fetch User Bookings
        console.log('Fetching User Bookings...');
        const bookingsRes = await axios.get(`${BASE_URL}/bookings`, {
            headers: { 'x-user-email': USER_EMAIL }
        });
        const bookings = bookingsRes.data;
        const myBooking = bookings.find(b => b.id === bookingRes.data.id);

        if (myBooking) {
            console.log('✅ Booking found in user dashboard data!');
            console.log(`   - Consultant: ${myBooking.consultant.domain}`); // Check relation
        } else {
            console.error('❌ Booking NOT found in user list');
            process.exit(1);
        }

        console.log('\n✨ Full Flow Verification Completed Successfully!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.status, error.response.data);
        }
        process.exit(1);
    }
}

verifyFullFlow();
