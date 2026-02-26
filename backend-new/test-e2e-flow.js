const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE = 'http://localhost:5000';
const ADMIN_API = 'http://localhost:5000/admin';

async function generateDevToken(email, id) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
        email,
        uid: id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400
    })).toString('base64');
    const signature = Buffer.from("dev-mode-signature").toString('base64');
    return `${header}.${payload}.${signature}`;
}

async function runTest() {
    console.log("🚀 Starting E2E Verification Flow Test...\n");

    try {
        // 1. Consultant Signup
        console.log("👉 1. Creating Consultant...");
        const consRes = await axios.post(`${API_BASE}/auth/me`, {
            email: `consultant_${Date.now()}@example.com`,
            name: "Test Consultant",
            role: "CONSULTANT"
        });
        const consultantToken = await generateDevToken(consRes.data.user.email, consRes.data.user.id);

        await axios.post(`${API_BASE}/consultant/register`, {
            hourly_price: 150,
            domain: "Technology",
            type: "IT Consultant",
            bio: "Test Bio"
        }, { headers: { Authorization: `Bearer ${consultantToken}` } });
        console.log("✅ Consultant created and registered.");

        // 2. Enterprise Signup
        console.log("\n👉 2. Creating Enterprise...");
        const entRes = await axios.post(`${API_BASE}/auth/me`, {
            email: `enterprise_${Date.now()}@example.com`,
            name: "Test Enterprise Owner",
            role: "ENTERPRISE"
        });
        const entToken = await generateDevToken(entRes.data.user.email, entRes.data.user.id);

        await axios.post(`${API_BASE}/enterprise/profile`, {
            name: "Tech Corp Inc",
            registration_no: "REG12345",
            gst_number: "GST9876",
            description: "A test enterprise"
        }, { headers: { Authorization: `Bearer ${entToken}` } });
        console.log("✅ Enterprise created.");

        // 3. Consultant Uploads KYC
        console.log("\n👉 3. Consultant uploading KYC document...");
        fs.writeFileSync('dummy_kyc.pdf', 'Dummy PDF Content for KYC testing');
        const formData = new FormData();
        formData.append('files', fs.createReadStream('dummy_kyc.pdf'));
        formData.append('documentType', 'ID_PROOF');

        await axios.post(`${API_BASE}/consultant/upload-kyc`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${consultantToken}`
            }
        });
        console.log("✅ KYC document uploaded.");

        // 4. Admin Sign Up & Login
        console.log("\n👉 4. Admin Sign In...");
        const adminEmail = `admin_test_${Date.now()}@test.com`;
        let adminToken;
        try {
            const signupRes = await axios.post(`${API_BASE}/admin/signup`, {
                email: adminEmail,
                password: "password123",
                name: "Super Admin"
            });
            adminToken = signupRes.data.token;
        } catch (e) {
            if (e.response && e.response.status === 409) {
                const signinRes = await axios.post(`${API_BASE}/admin/signin`, {
                    email: "admin@test.com", password: "password123"
                });
                adminToken = signinRes.data.token;
            } else throw e;
        }
        console.log("✅ Admin logged in.");

        // 5. Admin sees pending consultant
        console.log("\n👉 5. Admin fetching pending consultants...");
        const pendingConsRes = await axios.get(`${ADMIN_API}/consultants/pending`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const targetCons = pendingConsRes.data.find(c => c.user.email === consRes.data.user.email);
        console.log(`✅ Found ${pendingConsRes.data.length} pending consultants.`);
        console.log(`   Admin sees Consultant: ${targetCons.user.name}`);
        console.log(`   Admin sees Documents: ${targetCons.documents.length} uploaded`);

        // 6. Admin verifies consultant
        console.log("\n👉 6. Admin verifying consultant...");
        await axios.put(`${ADMIN_API}/consultants/${targetCons.id}/verify`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("✅ Consultant verified successfully.");

        // 7. Admin sees pending enterprise
        console.log("\n👉 7. Admin fetching pending enterprises...");
        const pendingEntRes = await axios.get(`${ADMIN_API}/enterprises/pending`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const targetEnt = pendingEntRes.data.find(e => e.owner.email === entRes.data.user.email);
        console.log(`✅ Found pending enterprise: ${targetEnt.name}`);

        // 8. Admin verifies enterprise
        console.log("\n👉 8. Admin verifying enterprise...");
        await axios.put(`${ADMIN_API}/enterprises/${targetEnt.id}/verify`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("✅ Enterprise verified successfully.");

        console.log("\n🎉 ALL TESTS PASSED! Flow operates correctly.");
    } catch (error) {
        console.error("❌ Test Failed:");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    } finally {
        if (fs.existsSync('dummy_kyc.pdf')) fs.unlinkSync('dummy_kyc.pdf');
    }
}

runTest();
