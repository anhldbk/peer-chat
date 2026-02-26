/**
 * Post-build script: transpiles ALL JS files in `out/` to ES2019 IN-PLACE.
 * Does NOT rename files — webpack's runtime constructs chunk URLs dynamically
 * from a hash map, and renaming breaks that mapping.
 *
 * Netlify purges its CDN cache on each deploy, so the same filenames
 * will serve the new transpiled content.
 */
var swc = require("@swc/core");
var fs = require("fs");
var path = require("path");

var OUT_DIR = path.join(__dirname, "..", "out");

function walk(dir) {
    var files = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        var full = path.join(dir, entry.name);
        if (entry.isDirectory()) files = files.concat(walk(full));
        else if (entry.name.endsWith(".js")) files.push(full);
    });
    return files;
}

async function main() {
    var files = walk(OUT_DIR);
    console.log("Transpiling " + files.length + " JS files to ES2019 (in-place)...");

    var changed = 0;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
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
                fs.writeFileSync(file, result.code);
                changed++;
                console.log("  T " + path.relative(process.cwd(), file));
            }
        } catch (err) {
            console.log("  ! WARN: " + path.basename(file) + " - " + err.message);
        }
    }

    console.log(changed + " file(s) transpiled, " + (files.length - changed) + " unchanged.");

    // Verify
    var remaining = 0;
    var finalFiles = walk(OUT_DIR).filter(function (f) {
        return f.indexOf("polyfills") < 0;
    });
    for (var j = 0; j < finalFiles.length; j++) {
        var fc = fs.readFileSync(finalFiles[j], "utf8");
        if (/[^?]\?\?[^?=]/.test(fc)) {
            remaining++;
            console.log("  !! Still has ??: " + path.basename(finalFiles[j]));
        }
    }
    console.log(remaining === 0 ? "All files are Chrome 80 compatible." : "WARNING: " + remaining + " file(s) still have ?? syntax!");
}

main().catch(function (err) {
    console.error("Transpile failed:", err);
    process.exit(1);
});
