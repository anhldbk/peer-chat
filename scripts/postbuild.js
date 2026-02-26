/**
 * Post-build script: transpiles ALL JS files in `out/` to ES2019
 * and rehashes Next.js chunks to permanently bust Amazon Silk's cloud proxy cache 
 * (which aggressively ignores query parameters like '?v=123').
 */
var swc = require("@swc/core");
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");

var OUT_DIR = path.join(__dirname, "..", "out");

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

// Regex to find Next.js chunk hashes in filenames (16+ hex chars)
var HASH_REGEX = /([a-f0-9]{16,})\.js$/;

async function main() {
    var allFiles = walk(OUT_DIR);
    var jsFiles = allFiles.filter(function (f) { return f.endsWith(".js"); });

    console.log("Transpiling " + jsFiles.length + " JS files to ES2019...");

    // Maps old hash -> new hash
    var hashReplacements = {};
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
                var oldBase = path.basename(file);
                var match = oldBase.match(HASH_REGEX);

                if (match) {
                    var oldHash = match[1];
                    var newHash = shortHash(result.code);
                    var newBase = oldBase.replace(oldHash, newHash);
                    var newPath = path.join(path.dirname(file), newBase);

                    fs.writeFileSync(newPath, result.code);
                    if (newPath !== file) fs.unlinkSync(file);

                    hashReplacements[oldHash] = newHash;
                    changed++;
                    console.log("  T " + oldHash + " -> " + newHash + " (" + newBase + ")");
                } else {
                    // No hash found in filename, just transpile in-place
                    fs.writeFileSync(file, result.code);
                    changed++;
                    console.log("  T " + oldBase + " (in-place)");
                }
            }
        } catch (err) {
            console.log("  ! WARN: " + path.basename(file) + " - " + err.message);
        }
    }

    console.log(changed + " file(s) transpiled.");

    var replaceKeys = Object.keys(hashReplacements);
    if (replaceKeys.length > 0) {
        console.log("Globally substituting " + replaceKeys.length + " Next.js hashes in all output files...");

        // Re-walk to get current filenames
        var updatedFiles = walk(OUT_DIR);
        var textFiles = updatedFiles.filter(function (f) {
            return f.endsWith(".html") || f.endsWith(".js") || f.endsWith(".json") || f.endsWith(".txt") || f.endsWith(".css");
        });

        for (var j = 0; j < textFiles.length; j++) {
            var tf = textFiles[j];
            var content = fs.readFileSync(tf, "utf8");
            var modified = content;

            // Perform global string replacement for every old hash -> new hash
            for (var k = 0; k < replaceKeys.length; k++) {
                modified = modified.split(replaceKeys[k]).join(hashReplacements[replaceKeys[k]]);
            }

            if (modified !== content) {
                fs.writeFileSync(tf, modified);
                console.log("  R updated references in " + path.basename(tf));
            }
        }
    }

    console.log("Cache-busting complete.");
}

main().catch(function (err) {
    console.error("Transpile failed:", err);
    process.exit(1);
});
