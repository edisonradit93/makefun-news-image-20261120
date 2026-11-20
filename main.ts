import { copyFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// World News 20 November 2026 Editorial Infographic Entrypoint
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceImage = join(__dirname, 'entry.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const targetImage = join(outputDir, 'entry.png');

if (!existsSync(sourceImage)) {
  console.error(`Missing entry.png at ${sourceImage}`);
  process.exit(1);
}

const stats = statSync(sourceImage);
if (stats.size > 1048576) {
  console.error(`Image size ${stats.size} exceeds 1 MiB limit`);
  process.exit(1);
}

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const startTime = performance.now();
copyFileSync(sourceImage, targetImage);
const elapsed = (performance.now() - startTime).toFixed(2);
console.log(`Delivered editorial image (${stats.size} bytes) to ${targetImage} in ${elapsed}ms`);
