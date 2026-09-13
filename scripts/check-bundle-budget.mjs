import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../dist/assets/', import.meta.url);
const dir = root.pathname;
const files = await readdir(dir);

let js = 0;
let css = 0;
let total = 0;
for (const file of files) {
  const s = await stat(join(dir, file));
  if (!s.isFile()) continue;
  total += s.size;
  if (file.endsWith('.js')) js += s.size;
  if (file.endsWith('.css')) css += s.size;
}

const limits = {
  js: 2_000_000,
  css: 1_000_000,
  total: 8_000_000,
};

console.log(`Bundle budget: JS=${js} CSS=${css} assets=${total}`);

const violations = [];
if (js > limits.js) violations.push(`JS ${js} > ${limits.js}`);
if (css > limits.css) violations.push(`CSS ${css} > ${limits.css}`);
if (total > limits.total) violations.push(`assets ${total} > ${limits.total}`);

if (violations.length) {
  console.error('Performance budget exceeded:');
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}
