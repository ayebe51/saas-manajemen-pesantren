const { execSync } = require('child_process');

console.log('Compiling seed script...');
try {
  execSync('npx tsc prisma/seed.ts', { stdio: 'inherit' });
  console.log('Executing compiled seed script...');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  console.log('Seed command completed.');
} catch (error) {
  console.error('Failed to run seed script:', error.message);
  process.exit(1);
}
