import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import * as crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const MAX_IMAGE_BYTES = 1048576; // 1 MB limit

interface DispatchResult {
  sourcePath: string;
  destinationPath: string;
  bytesCopied: number;
}

export function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function verifyIntegrity(sourcePath: string, destinationPath: string): string {
  const sourceHash = computeSha256(sourcePath);
  const destHash = computeSha256(destinationPath);

  if (sourceHash !== destHash) {
    throw new Error(`Integrity check failed: source hash (${sourceHash}) does not match destination hash (${destHash})`);
  }

  console.log(`[make.fun] Cryptographic integrity verified! SHA-256: ${destHash}`);
  return destHash;
}

export function dispatchImage(): DispatchResult {
  const baseDir = process.env.MAKEFUN_BOT_DIR || path.dirname(fileURLToPath(import.meta.url));
  const sourcePath = path.resolve(baseDir, 'entry.png');

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source image not found at: ${sourcePath}`);
  }

  const stat = fs.statSync(sourcePath);
  if (stat.size > MAX_IMAGE_BYTES) {
    throw new Error(`File size ${stat.size} exceeds maximum allowable size of ${MAX_IMAGE_BYTES} bytes`);
  }

  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || (process.platform === 'win32' ? path.resolve(baseDir, 'output') : '/output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const destinationPath = path.resolve(outputDir, 'entry.png');
  fs.copyFileSync(sourcePath, destinationPath);

  console.log(`[make.fun] Image successfully dispatched.`);
  console.log(`Source: ${sourcePath} (${stat.size} bytes)`);
  console.log(`Destination: ${destinationPath}`);

  return {
    sourcePath,
    destinationPath,
    bytesCopied: stat.size,
  };
}

// Execute workflow
try {
  const result = dispatchImage();
  console.log(`Dispatch completed: ${result.bytesCopied} bytes copied to ${result.destinationPath}`);
  const hash = verifyIntegrity(result.sourcePath, result.destinationPath);
  console.log(`Verified output hash: ${hash}`);
} catch (err) {
  console.error('[make.fun] Execution failed:', err);
  process.exitCode = 1;
}
