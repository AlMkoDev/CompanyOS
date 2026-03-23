async function main() {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@verdant.com', password: 'Password123!' })
  });

  const data = await response.json();
  console.log("--- API Response ---");
  console.log(JSON.stringify(data.user?.company?.setup, null, 2));
}

main().catch(console.error);
