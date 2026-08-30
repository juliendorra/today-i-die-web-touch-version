import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(projectRoot, "node_modules", "@ruffle-rs", "ruffle");
const destination = join(projectRoot, "public", "ruffle");

await mkdir(destination, { recursive: true });

const runtimeFiles = (await readdir(source)).filter(
  (name) => name.endsWith(".js") || name.endsWith(".wasm") || name.startsWith("LICENSE_"),
);

await Promise.all(runtimeFiles.map((name) => copyFile(join(source, name), join(destination, name))));

const coreFiles = runtimeFiles.filter((name) => name.startsWith("core.ruffle.") && name.endsWith(".js"));

await Promise.all(
  coreFiles.map(async (name) => {
    const path = join(destination, name);
    const runtime = await readFile(path, "utf8");
    const fixedResolutionRuntime = runtime
      .replace("return e.devicePixelRatio", "return 1")
      .replace("return Le(e).devicePixelRatio", "return 1");

    if (fixedResolutionRuntime === runtime) {
      throw new Error(`Could not find Ruffle's device-pixel-ratio hook in ${name}.`);
    }

    await writeFile(path, fixedResolutionRuntime);
  }),
);

console.log(`Copied ${runtimeFiles.length} Ruffle runtime files and pinned rendering to 1×.`);
