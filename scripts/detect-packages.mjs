#!/usr/bin/env node

import { access, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);

async function hasPkgbuild(directory) {
  try {
    await access(`${directory}/PKGBUILD`);
    return true;
  } catch {
    return false;
  }
}

async function listPackages() {
  const entries = await readdir(".", { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    if (await hasPkgbuild(entry.name)) {
      packages.push(entry.name);
    }
  }

  return packages.toSorted();
}

function changedPackages(base, head) {
  const output = execFileSync(
    "git",
    ["diff", "--name-only", base, head, "--", "*/PKGBUILD"],
    { encoding: "utf8" },
  );

  return output
    .split("\n")
    .map((path) => path.trim())
    .filter((path) => /^([^/]+)\/PKGBUILD$/.test(path))
    .map((path) => path.split("/")[0])
    .toSorted()
    .filter((packageName, index, packages) => packages[index - 1] !== packageName);
}

let packages;

if (args.length === 1 && args[0] === "--all") {
  packages = await listPackages();
} else if (args.length === 2) {
  packages = await changedPackages(args[0], args[1]);
} else {
  console.error("Usage: node scripts/detect-packages.mjs --all");
  console.error("   or: node scripts/detect-packages.mjs <base-sha> <head-sha>");
  process.exit(2);
}

console.log(JSON.stringify(packages));
