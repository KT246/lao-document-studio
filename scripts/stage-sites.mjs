import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const openNextDir = path.join(projectRoot, ".open-next");
const distDir = path.join(projectRoot, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, "server"), { recursive: true });
await cp(openNextDir, path.join(distDir, "open-next"), { recursive: true });
await cp(path.join(openNextDir, "assets"), path.join(distDir, "client"), { recursive: true });
await writeFile(
  path.join(distDir, "server", "index.js"),
  'import worker from "../open-next/worker.js";\nexport default worker;\n',
  "utf8"
);

console.log("Prepared Sites-compatible OpenNext output in dist/.");
