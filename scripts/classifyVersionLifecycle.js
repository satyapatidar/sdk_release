const { execSync } = require("child_process");
const semver = require("semver");
const fs = require("fs");

// To get tags and release dates
function getTagsWithDates() {
  const output = execSync(
    "git for-each-ref --sort=-creatordate --format '%(refname:short)|%(creatordate:short)' refs/tags"
  )
    .toString()
    .trim();

  return output
    .split("\n")
    .map((line) => {
      const [tag, date] = line.replace(/^refs\/tags\//, "").split("|");
      return { tag, date };
    })
    .filter(({ tag }) => semver.valid(tag));
}

function classifyVersions(tags) {
  const now = new Date();
  const activeMajors = [];

  const FAKE_DATES = {
    "1.1.0": "2023-09-01",
    "1.2.0": "2023-11-01",
    "1.3.0": "2024-01-15",
  };

  //calculates how many months ago each version was released and returns an array
  const versionInfo = tags.map(({ tag, date }) => {
    const version = semver.clean(tag);
    const simulatedDate = FAKE_DATES[version] || date;
    const parsedDate = new Date(simulatedDate);
    const ageInMonths = (now - parsedDate) / (1000 * 60 * 60 * 24 * 30);

    return { version, date: simulatedDate, ageInMonths };
  });

  const sorted = versionInfo.sort((a, b) =>
    semver.rcompare(a.version, b.version)
  );

  //detects the latest 2 major versions
  sorted.forEach(({ version }) => {
    const major = semver.major(version);
    if (!activeMajors.includes(major)) {
      activeMajors.push(major);
    }
    if (activeMajors.length === 2) return;
  });

  //classifies Each Version
  return sorted.map((v) => {
    const major = semver.major(v.version);
    if (activeMajors.includes(major) && v.ageInMonths <= 8) {
      return { ...v, status: "Active" };
    } else if (v.ageInMonths <= 8) {
      return { ...v, status: "Deprecated" };
    } else {
      return { ...v, status: "Unsupported" };
    }
  });
}

const tags = getTagsWithDates();
const results = classifyVersions(tags);

// Write to file
fs.writeFileSync(
  "./sdk-version-status.json",
  JSON.stringify(results, null, 2),
  "utf-8"
);


console.log("\n🔍 SDK Version Lifecycle Status:\n");
results.forEach(({ version, date, status }) => {
  console.log(`- ${version} (released ${date}): ${status}`);
});
