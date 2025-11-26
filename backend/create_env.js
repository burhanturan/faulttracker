const fs = require('fs');
const content = `DATABASE_URL="postgresql://postgres:password@localhost:5432/faulttracker?schema=public"
PORT=3000`;
fs.writeFileSync('.env', content, { encoding: 'utf8' });
console.log('.env updated with faulttracker');
