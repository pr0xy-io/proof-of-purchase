#!/usr/bin/env node
import { globSync } from "glob";
import fs from "fs";

// locations where the version should be updated and/or injected
// `packageJson` is standard, `traverse` is folders to glob
const TO_CHECK = {
  packageJson: "package.json",
  traverse: ["contracts/**/*.sol"],
  exclude: ["contracts/existingProjects/**/*.sol"],
};

// allowing for direct input of the version to overwrite to
// a version must be specified otherwise the program will exit
const version: string = process.argv[2];
if (!version) throw new Error("No version specified.");

// ensuring that the version starts with a proper format
// it must begin with the format of major.minor.bug
if (!version.match(/^[0-9]+\.[0-9]+\.[0-9]+/))
  throw new Error(`${version} is not a valid version.`);

// updating the package.json file with the new version
const packageJson = JSON.parse(fs.readFileSync(TO_CHECK.packageJson, "utf8"));
packageJson.version = version;
fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
console.log(`Updated package.json with ${version}.`);

// defining the heading for contracts
const spdxString = "// SPDX-License-Identifier: MIT";
const versionPrefix = "// POP Contracts v";

// getting all files that need to be updated
let files: string[] = TO_CHECK.traverse.flatMap((folder) => globSync(folder));
let exclude: string[] = TO_CHECK.exclude.flatMap((folder) => globSync(folder));
const update = files.filter((file) => !exclude.includes(file));

// iterating through all files and replacing the version
for (const file of update) {
  const content = fs.readFileSync(file, "utf8");
  const versionStringLine = `${versionPrefix}${version}`;

  // deriving the updated content and replacing
  let updatedContent: string;
  if (content.includes(versionPrefix)) {
    updatedContent = content.replace(
      new RegExp(`${versionPrefix}.*`),
      `${versionStringLine}`
    );
  } else {
    updatedContent = content.replace(
      new RegExp(`${spdxString}`),
      `${spdxString}\n${versionStringLine}`
    );
  }

  // writing the file with the updated content
  fs.writeFileSync(file, updatedContent);

  console.log(`Updated ${file} with ${version}.`);
}
