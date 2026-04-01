"use strict";

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
);

const productName =
  packageJson.build?.productName ?? packageJson.productName ?? packageJson.name;
const version = packageJson.version;
const description = packageJson.description ?? productName;
const iconPath = path.join(rootDir, "public", "icons", "favicon.ico");

exports.default = async (context) => {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const exePath = path.join(context.appOutDir, `${productName}.exe`);

  if (!fs.existsSync(exePath)) {
    throw new Error(`Cannot find packaged Windows executable: ${exePath}`);
  }

  const { rcedit } = await import("rcedit");

  await rcedit(exePath, {
    icon: iconPath,
    "file-version": version,
    "product-version": version,
    "version-string": {
      FileDescription: description,
      ProductName: productName,
      InternalName: productName,
      OriginalFilename: `${productName}.exe`,
    },
  });
};
