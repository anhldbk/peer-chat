/**
 * Post-build script: transpiles all JS files in `out/` to ES2019
 * so they are compatible with Chrome 80 (Kindle Scribe Silk browser).
 *
 * Chrome 80 does NOT reliably support:
 *  - ?? (nullish coalescing) — added Chrome 80 but Silk may differ
 *  - ??= / ||= / &&= (logical assignment) — Chrome 85
 *  - .replaceAll() — Chrome 85
 *  - structuredClone() — Chrome 98
 *
 * SWC's es2019 target strips ?? and ?. to ternary equivalents.
 */
const swc = require("@swc/core");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out", "_next", "static");

function walk(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else if (entry.name.endsWith(".js")) files.push(full);
    }
    return files;
}

async function main() {
    const files = walk(OUT_DIR);
    console.log(`Transpiling ${files.length} JS files to ES2019...`);

    let changed = 0;
    for (const file of files) {
        const src = fs.readFileSync(file, "utf8");

        // Quick check: skip files that don't contain problematic syntax
        if (!src.includes("??") && !src.includes("?.")) continue;

        const { code } = await swc.transform(src, {
            filename: path.basename(file),
            jsc: {
                parser: { syntax: "ecmascript" },
                target: "es2019",
            },
            minify: false,
            sourceMaps: false,
        });

        fs.writeFileSync(file, code);
        changed++;
        console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
    }

    console.log(`Done. ${changed} file(s) transpiled, ${files.length - changed} unchanged.`);
}

main().catch((err) => {
    console.error("Transpile failed:", err);
    process.exit(1);
});
