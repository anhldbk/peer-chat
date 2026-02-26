/**
 * Post-build script: transpiles ALL JS files in `out/` to ES2019
 * and rehashes filenames to bust CDN/browser caches.
 *
 * Problem: Next.js generates filename hashes BEFORE this script runs,
 * so Netlify/CDN serves the old cached file with `immutable` headers.
 * Fix: rename transpiled files with new hashes and update all references.
 */
const swc = require("@swc/core");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");

function walk(dir) {
    var files = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        var full = path.join(dir, entry.name);
        if (entry.isDirectory()) files = files.concat(walk(full));
        else files.push(full);
    });
    return files;
}

function shortHash(content) {
    return crypto.createHash("md5").update(content).digest("hex").substring(0, 16);
}

async function main() {
    var allFiles = walk(OUT_DIR);
    var jsFiles = allFiles.filter(function (f) { return f.endsWith(".js"); });
    var htmlFiles = allFiles.filter(function (f) { return f.endsWith(".html") || f.endsWith(".json"); });

    console.log("Transpiling " + jsFiles.length + " JS files to ES2019...");

    // Map of old filename -> new filename (basename only)
    var renames = {};
    var changed = 0;

    for (var i = 0; i < jsFiles.length; i++) {
        var file = jsFiles[i];
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

            if (result.code !== src) {
                // Content changed — write new content and compute new hash
                var newHash = shortHash(result.code);
                var oldBase = path.basename(file);
                // Replace the hash portion: name-OLDHASH.js -> name-NEWHASH.js
                var newBase = oldBase.replace(/([a-f0-9]{16,})\.js$/, newHash + ".js");
                if (newBase === oldBase) {
                    // No hash pattern found, just append hash
                    newBase = oldBase.replace(/\.js$/, "." + newHash + ".js");
                }

                var newPath = path.join(path.dirname(file), newBase);
                fs.writeFileSync(newPath, result.code);
                if (newPath !== file) fs.unlinkSync(file);

                renames[oldBase] = newBase;
                changed++;
                console.log("  T " + oldBase + " -> " + newBase);
            }
        } catch (err) {
            console.log("  ! WARN: " + path.basename(file) + " - " + err.message);
        }
    }

    console.log(changed + " file(s) transpiled and renamed.");

    // Update all references in HTML, JSON, and remaining JS files
    if (Object.keys(renames).length > 0) {
        console.log("Updating " + Object.keys(renames).length + " filename references...");

        // Re-walk to get the current files (after renames)
        var updatedFiles = walk(OUT_DIR);
        var textFiles = updatedFiles.filter(function (f) {
            return f.endsWith(".html") || f.endsWith(".json") || f.endsWith(".js") || f.endsWith(".txt");
        });

        for (var j = 0; j < textFiles.length; j++) {
            var tf = textFiles[j];
            var content = fs.readFileSync(tf, "utf8");
            var modified = content;
            var keys = Object.keys(renames);
            for (var k = 0; k < keys.length; k++) {
                // Use split+join for global replace (no regex needed)
                modified = modified.split(keys[k]).join(renames[keys[k]]);
            }
            if (modified !== content) {
                fs.writeFileSync(tf, modified);
                console.log("  R " + path.relative(OUT_DIR, tf));
            }
        }
    }

    // Final verification
    var remaining = 0;
    var finalFiles = walk(OUT_DIR).filter(function (f) {
        return f.endsWith(".js") && f.indexOf("polyfills") < 0;
    });
    for (var m = 0; m < finalFiles.length; m++) {
        var fc = fs.readFileSync(finalFiles[m], "utf8");
        if (/[^?]\?\?[^?=]/.test(fc)) {
            remaining++;
            console.log("  !! Still has ??: " + path.basename(finalFiles[m]));
        }
    }
    console.log(remaining === 0 ? "All files are Chrome 80 compatible." : "WARNING: " + remaining + " file(s) still have ?? syntax!");
}

main().catch(function (err) {
    console.error("Transpile failed:", err);
    process.exit(1);
});
