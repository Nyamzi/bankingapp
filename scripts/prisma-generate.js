const { spawnSync } = require('node:child_process');
const path = require('node:path');

const env = { ...process.env };
delete env.PRISMA_GENERATE_NO_ENGINE;

const prismaBinary = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);

const result = spawnSync(
  prismaBinary,
  ['generate'],
  {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  }
);

if (result.error) {
  console.error(result.error);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);