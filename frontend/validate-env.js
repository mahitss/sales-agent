const fs = require('fs');
const path = require('path');

const requiredEnv = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WIDGET_SCRIPT_URL'
];

console.log('Validating environment variables for build...');

// Load .env.local if present to seed process.env
const envLocalPath = path.join(__dirname, '.env.local');
const envFileVars = {};
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    envFileVars[key] = val;
  });
}

const missing = [];
requiredEnv.forEach(env => {
  const val = process.env[env] || envFileVars[env];
  if (!val) {
    missing.push(env);
  }
});

if (missing.length > 0) {
  console.error('\n❌ BUILD FAILED: Missing required environment variables:\n');
  missing.forEach(m => console.error(`   - ${m}`));
  console.error('\nPlease set these in your system environment or a local .env.local file.\n');
  process.exit(1);
}

console.log('✅ Environment variables verified successfully!');
process.exit(0);
