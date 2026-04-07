const { execSync } = require('child_process');

console.log('Running seed with ts-node...');
try {
  execSync('npx ts-node -r tsconfig-paths/register prisma/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('Seed completed.');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
