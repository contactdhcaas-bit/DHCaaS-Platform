// Test this in browser console after opening http://localhost:5173/policies

// Login and store token
fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@dhcaas.com',
    password: 'Admin@123'
  })
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('access_token', data.access_token);
  console.log('✓ Logged in successfully!');
  console.log('Token stored. Refresh the page to load policies.');
})
.catch(err => console.error('Login failed:', err));
