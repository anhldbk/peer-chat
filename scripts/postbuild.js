/**
 * Post-build script: transpiles ALL JS files in `out/` to ES2019 IN-PLACE,
 * and appends a cache-buster query string (?v=TIMESTAMP) to all JS references
 * in HTML and Webpack chunk loaders.
 *
 * This forces the Kindle Silk browser to bypass its aggressive local cache
 * and fetch the new Chrome 80-compatible ES2019 transpiled files.
 */
var swc = require("@swc/core");
var fs = require("fs");
var path = require("path");

var OUT_DIR = path.join(__dirname, "..", "out");
var CACHE_BUSTER = Date.now().toString();

function walk(dir) {
    var files = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        var full = path.join(dir, entry.name);
        if (entry.isDirectory()) files = files.concat(walk(full));
        else files.push(full);
    });
    return files;
}

async function main() {
    var files = walk(OUT_DIR);
    var jsFiles = files.filter(function (f) { return f.endsWith(".js"); });
    var htmlFiles = files.filter(function (f) { return f.endsWith(".html"); });

    console.log("Transpiling " + jsFiles.length + " JS files to ES2019 (in-place)...");

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
                fs.writeFileSync(file, result.code);
                changed++;
                console.log("  T " + path.relative(process.cwd(), file));
            }
        } catch (err) {
            console.log("  ! WARN: " + path.basename(file) + " - " + err.message);
        }
    }

    console.log(changed + " file(s) transpiled.");

    console.log("Injecting cache-buster (?v=" + CACHE_BUSTER + ") into HTML and Webpack runtime...");

    // 1. Inject cache-buster into all HTML files
    htmlFiles.forEach(function (file) {
        var content = fs.readFileSync(file, "utf8");
        // Append ?v= to any Next.js chunk script source that hasn't already been busted
        var newContent = content.replace(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g, 'src="$1?v=' + CACHE_BUSTER + '"');
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log("  C " + path.relative(process.cwd(), file));
        }
    });

    // 2. Inject cache buster into Webpack runtime chunk loader
    var webpackFiles = jsFiles.filter(function (f) { return path.basename(f).startsWith("webpack-"); });
    webpackFiles.forEach(function (file) {
        var content = fs.readFileSync(file, "utf8");
        // Webpack uses  ... + ".js"  to construct chunk URLs.
        // We replace it so it constructs  ... + ".js?v=TIMESTAMP"
        var newContent = content.replace(/\.js"/g, '.js?v=' + CACHE_BUSTER + '"');
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log("  C Webpack Runtime: " + path.basename(file));
        }
    });

    console.log("Cache-busting complete.");

    // Verify
    var remaining = 0;
    var finalFiles = walk(OUT_DIR).filter(function (f) {
        return f.indexOf("polyfills") < 0 && f.endsWith(".js");
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
