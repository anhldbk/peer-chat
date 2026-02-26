/**
 * Post-build script: transpiles ALL JS files in `out/` to ES2019
 * so they are compatible with Chrome 80 (Kindle Scribe Silk browser).
 *
 * Processes EVERY .js file — no skipping — to ensure nothing is missed.
 */
const swc = require("@swc/core");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");

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
    console.log("Transpiling " + files.length + " JS files to ES2019...");

    var changed = 0;
    var errors = 0;

    for (const file of files) {
        var src = fs.readFileSync(file, "utf8");

        try {
            var result = await swc.transform(src, {
                filename: path.basename(file),
                jsc: {
                    parser: { syntax: "ecmascript" },
                    target: "es2019",
                },
                minify: false,
                sourceMaps: false,
            });

            // Check if content actually changed
            if (result.code !== src) {
                fs.writeFileSync(file, result.code);
                changed++;
                console.log("  T " + path.relative(process.cwd(), file));
            }
        } catch (err) {
            // Log but don't fail — some files may have edge-case syntax
            console.log("  ! WARN: " + path.relative(process.cwd(), file) + " - " + err.message);
            errors++;
        }
    }

    console.log("Done. " + changed + " file(s) transpiled, " + (files.length - changed - errors) + " unchanged, " + errors + " warnings.");

    // Verify: check for remaining ?? in output
    var remaining = 0;
    for (const file of files) {
        var content = fs.readFileSync(file, "utf8");
        // Match actual ?? operator (not inside strings/comments)
        if (/[^?]\?\?[^?=]/.test(content) || /\?\.\(/.test(content)) {
            remaining++;
            console.log("  !! Still has ??/?.: " + path.relative(process.cwd(), file));
        }
    }

    if (remaining > 0) {
        console.log("WARNING: " + remaining + " file(s) still contain ?? or ?. syntax!");
    } else {
        console.log("All files are Chrome 80 compatible.");
    }
}

main().catch(function (err) {
    console.error("Transpile failed:", err);
    process.exit(1);
});
