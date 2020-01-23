const splitRegex = /[^\S\r\n]*?\r?\n[^\S\r\n]*?\*[^\S\r\n]?/;

function testJSON(data) {
    try {
        return JSON.parse(data);
    }
    catch (err) {
        return false;
    }
}

function extractMeta(fileContent) {
    const firstLine = fileContent.split("\n")[0];
    const hasOldMeta = firstLine.includes("//META");
    if (hasOldMeta) return parseOldMeta(fileContent);
    const hasNewMeta = firstLine.includes("/**");
    if (hasNewMeta) return parseNewMeta(fileContent);
    throw new Error("META was not found.");
};

function parseOldMeta(fileContent) {
    const meta = fileContent.split("\n")[0];
    const metaData = meta.substring(meta.lastIndexOf("//META") + 6, meta.lastIndexOf("*//"));
    const parsed = testJSON(metaData);
    if (!parsed) throw new Error("META could not be parsed.");
    if (!parsed.name) throw new Error("META missing name data.");
    return parsed;
};

function parseNewMeta(fileContent) {
    const block = fileContent.split("/**", 2)[1].split("*/", 1)[0];
    const out = {};
    let field = "";
    let accum = "";
    for (const line of block.split(splitRegex)) {
        if (line.length === 0) continue;
        if (line.charAt(0) === "@" && line.charAt(1) !== " ") {
            out[field] = accum;
            const l = line.indexOf(" ");
            field = line.substr(1, l - 1);
            accum = line.substr(l + 1);
        }
        else {
            accum += " " + line.replace("\\n", "\n").replace(escapedAtRegex, "@");
        }
    }
    out[field] = accum.trim();
    delete out[""];
    return out;
}

function readTheme() {
    if (document.getElementById("theme").files.length != 0) {
        reader = new FileReader();
        reader.readAsText(document.getElementById("theme").files[0]);
        reader.onload = function(e) {
            var themeContent = e.target.result;
            try {
                var themeMeta = extractMeta(themeContent);
            }
            catch (error) {
                alert(error);
                return;
            }
            var themeInfo = Object.keys(themeMeta);
            if (themeInfo.includes("name") || themeInfo.includes("author") || themeInfo.includes("version") || themeInfo.includes("description")) {
                var powercordManifest = `{
    "name": "${themeMeta['name']}",
    "description": "${themeMeta['description']}",
    "version": "${themeMeta['version']}",
    "author": "${themeMeta['author']}",
    "theme": "theme.css",
    "consent": "false",
    "license": "unknown"
}`;
                var zip = new JSZip();
                zip.file(`${themeMeta['name']}/powercord_manifest.json`, powercordManifest);
                zip.file(`${themeMeta['name']}/theme.css`, themeContent);
                zip.generateAsync({type:"blob"}).then(function(blob) {
                    saveAs(blob, `${themeMeta['name']}.zip`);
                });
            } else {
                alert("ERROR: Theme META did not include required field.");
            }
        };
    } else {
        alert("ERROR: No theme was selected so no conversion was made.");
    }
}