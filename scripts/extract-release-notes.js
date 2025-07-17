// scripts/extract-release-notes.js
const fs = require('fs');

const CHANGELOG_PATH = './CHANGELOG.md';
const versionArg = process.argv[2]; // e.g. v1.1.1 or 1.1.1

const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
const lines = changelog.split('\n');

function normalizeVersionTag(version) {
  return version.replace(/^v/, '');
}

function extractLatestBlock(version) {
  const normalizedVersion = version ? normalizeVersionTag(version) : null;

  const startIndex = normalizedVersion
    ? lines.findIndex(line => line.includes(`[${normalizedVersion}]`))
    : lines.findIndex(line => line.startsWith('### [')); // latest version section

  if (startIndex === -1) {
    console.error(`Version ${version || '(latest)'} not found in CHANGELOG.md`);
    process.exit(1);
  }

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('### [')) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n').trim();
}

const extractedNotes = extractLatestBlock(versionArg);
console.log(extractedNotes);
