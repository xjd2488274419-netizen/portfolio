import { copyFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const files = [
  "index.html",
  "projects.html",
  "works.html",
  "photos.html",
  "contact.html",
  "about.html",
  "styles.css",
  "app.js",
  "pano.js",
];

// 逐文件覆盖复制：不用 fs.cp / rm，避免触发系统回收站而中断
const copyTree = async (from, to) => {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyTree(src, dst);
    } else {
      await copyFile(src, dst);
    }
  }
};

await mkdir(output, { recursive: true });

for (const file of files) {
  await copyFile(path.join(root, file), path.join(output, file));
}

await copyTree(path.join(root, "assets"), path.join(output, "assets"));

console.log("Static portfolio prepared in dist/");
