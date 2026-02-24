const API_URL = "http://localhost:8000/api/v1";

async function testPolicyAPI() {
  // 1. Login
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@dhcaas.com",
      password: "Admin@123"
    })
  });
  const { access_token } = await loginRes.json();
  console.log("✓ Login successful!");

  // 2. Get policies
  const policiesRes = await fetch(`${API_URL}/policies/`, {
    headers: { "Authorization": `Bearer ${access_token}` }
  });
  const policies = await policiesRes.json();
  console.log(`✓ Found ${policies.length} policies:`, policies);

  return policies;
}

testPolicyAPI();
