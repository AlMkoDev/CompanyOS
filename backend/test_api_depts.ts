async function main() {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@verdant.com', password: 'Password123!' })
  });
  
  const data = await response.json();
  const token = data.access_token;
  
  if (!token) {
    console.log("No token returned");
    return;
  }
  
  const deptsRes = await fetch('http://localhost:3001/departments', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const depts = await deptsRes.json();
  console.log(`Found ${depts.length} departments via API`);
  console.log(JSON.stringify(depts.map((d: any) => ({ name: d.name, status: d.status })), null, 2));
}

main().catch(console.error);
