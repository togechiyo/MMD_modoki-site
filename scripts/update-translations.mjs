import { spawnSync } from 'node:child_process';
for (const script of ['scripts/astro.mjs', 'scripts/extract-messages.mjs']) {
  const args = script.endsWith('astro.mjs') ? [script, 'build'] : [script];
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, I18N_EXTRACT: '1' },
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
