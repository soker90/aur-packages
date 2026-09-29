#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const packageFile = process.argv[2];

if (!packageFile) {
  console.error("Usage: node scripts/renovate-update-aur-checksum.mjs <PKGBUILD>");
  process.exit(1);
}

const content = await readFile(packageFile, "utf8");

function getScalar(name) {
  const match = content.match(new RegExp(`^${name}=(?:\"([^\"]*)\"|'([^']*)'|([^\\n]+))$`, "m"));
  if (!match) {
    throw new Error(`Could not find ${name} in ${packageFile}`);
  }
  return match[1] ?? match[2] ?? match[3];
}

const variables = new Map([
  ["pkgname", getScalar("pkgname")],
  ["pkgver", getScalar("pkgver")],
  ["url", getScalar("url")],
]);

function resolve(value) {
  let resolved = value;
  for (let i = 0; i < 10; i += 1) {
    const next = resolved.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, braced, plain) => {
      const name = braced ?? plain;
      return variables.get(name) ?? _;
    });
    if (next === resolved) {
      return resolved;
    }
    resolved = next;
  }
  return resolved;
}

const sourceRegex = /^source(?:_([A-Za-z0-9_]+))?=\(([^\n]*)\)$/gm;
const sourceArrays = [...content.matchAll(sourceRegex)];

if (sourceArrays.length === 0) {
  throw new Error(`No source arrays found in ${packageFile}`);
}

let updated = content;
let changed = false;

for (const sourceMatch of sourceArrays) {
  const arch = sourceMatch[1] ?? "";
  const sourceEntries = [...sourceMatch[2].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const checksumName = `sha256sums${arch ? `_${arch}` : ""}`;
  const checksumRegex = new RegExp(`^${checksumName}=\\(([^\\n]*)\\)$`, "m");
  const checksumMatch = updated.match(checksumRegex);

  if (!checksumMatch) {
    throw new Error(`Could not find ${checksumName} for ${packageFile}`);
  }

  const checksums = [...checksumMatch[1].matchAll(/'([a-f0-9]{64})'|"([a-f0-9]{64})"/g)]
    .map((match) => match[1] ?? match[2]);

  if (checksums.length !== sourceEntries.length) {
    throw new Error(
      `${packageFile}: ${checksumName} contains ${checksums.length} hashes for ${sourceEntries.length} sources`,
    );
  }

  const newChecksums = [];

  for (const sourceEntry of sourceEntries) {
    const sourceUrl = resolve(sourceEntry.includes("::") ? sourceEntry.split("::", 2)[1] : sourceEntry);
    if (!/^https?:\/\//.test(sourceUrl)) {
      throw new Error(`Unsupported source URL in ${packageFile}: ${sourceUrl}`);
    }

    console.log(`Calculating SHA256: ${sourceUrl}`);
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "renovate-aur-checksum-updater",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${sourceUrl}: HTTP ${response.status}`);
    }

    const hash = createHash("sha256");
    const body = Buffer.from(await response.arrayBuffer());
    hash.update(body);
    const digest = hash.digest("hex");
    newChecksums.push(digest);
  }

  const replacement = `(${newChecksums.map((checksum) => `'${checksum}'`).join(" ")} )`;
  const normalizedReplacement = replacement.replace(" )", ")");

  updated = updated.replace(checksumRegex, `${checksumName}=${normalizedReplacement}`);
  if (newChecksums.some((checksum, index) => checksum !== checksums[index])) {
    changed = true;
  }
}

if (changed) {
  await writeFile(packageFile, updated);
  console.log(`Updated SHA256 checksums in ${packageFile}`);
} else {
  console.log(`SHA256 checksums already match ${packageFile}`);
}
