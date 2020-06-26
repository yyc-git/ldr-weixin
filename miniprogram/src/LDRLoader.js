import { fromPromise, throwError, just, mergeArray } from "./lib/most.min.js";

import { adapter } from "./adapter/Adapter"
import { LDRPartType } from "./LDRPartType"
import { LDRPartDescription } from "./LDRPartDescription"
import { LDRStep } from "./LDRStep"
import { make } from "./LDRGenerator"

// let fromPromise = most.fromPromise;

// let from = most.from;

// let empty = most.empty;

// let just = most.just;

// let mergeArray = most.mergeArray;


// let LDRLoader = function (onLoad, storage, options) {
export let LDRLoader = function (options) {
    let self = this;

    this.partTypes = {}; // id => true or part. id is typically something like "parts/3001.dat", and "model.mpd".
    // this.texmaps = {}; // fileName => true or Texture. fileName is typically something like wall_deco123.png
    // this.texmapListeners = {}; // fileName => list of functions to be called.
    // this.texmapDataurls = []; // [id,mimetype,content] for sorting inline texmaps.
    // this.unloadedFiles = 0;

    // this.onLoad = function () {
    //     let unloaded = [];
    //     for (let id in self.partTypes) {
    //         if (self.partTypes.hasOwnProperty(id)) {
    //             let partType = self.partTypes[id];
    //             if (partType === true) {
    //                 unloaded.push(id);
    //             }
    //         }
    //     }
    //     unloaded.forEach(id => delete self.partTypes[id]);

    //     onLoad();
    // };
    // function backupRetrievePartsFromStorage(loader, toBeFetched, onDone) {
    //     if (!LDR.Generator) {
    //         onDone(toBeFetched); // Can't do anything, so just pass on the list of parts to be fetched.
    //         return;
    //     }
    //     // Try to fetch those that can be generated:
    //     let stillToBeFetched = [];
    //     toBeFetched.forEach(id => {
    //         let pt = LDR.Generator.make(id)
    //         if (pt) {
    //             loader.setPartType(pt);
    //         }
    //         else {
    //             stillToBeFetched.push(id);
    //         }
    //     });
    //     onDone(stillToBeFetched);
    // }
    // this.storage = storage || { retrievePartsFromStorage: backupRetrievePartsFromStorage };
    this.options = options || {};
    this.onProgress = this.options.onProgress || function () { };
    this.onWarning = this.options.onWarning || console.dir;
    this.onError = this.options.onError || console.dir;
    // this.loader = new FileLoader(this.options.manager || DefaultLoadingManager);
    // this.physicalRenderingAge = this.options.physicalRenderingAge || 0;
    this.mainModel;

    this.buildAllPossibleUrls = this.options.buildAllPossibleUrls || function (id) {
        let lowerID = id.toLowerCase();
        return [
            "ldraw_parts/p/" + lowerID,
            "ldraw_parts/parts/" + lowerID,
            "ldraw_unofficial/p/" + lowerID,
            "ldraw_unofficial/parts/" + lowerID,
        ];
    };

    // this.idToTextureUrl = this.options.idToTextureUrl || function (id) {
    //     return "textures/" + id.toLowerCase();
    // };

    // this.cleanUpPrimitivesAndSubParts = this.options.cleanUpPrimitivesAndSubParts || false;
}



LDRLoader.prototype.setPartType = function (pt) {
    this.partTypes[pt.ID] = pt;
    // if (this.options.buildAssemblies) {
    //     if (!this.assemblyManager) {
    //         this.assemblyManager = new LDR.AssemblyManager(this);
    //     }
    //     this.assemblyManager.handlePartType(pt);
    // }
}

LDRLoader.prototype.parse = function (data, defaultID) {
    //console.log('Parsing', defaultID);
    // let parseStartTime = new Date();
    let self = this;

    // // BFC Parameters:
    // let CCW = true; // Assume CCW as default
    // let localCull = true;
    // let invertNext = false; // Don't assume that first line needs inverted.

    // Start parsing:
    let part = new LDRPartType();
    let step = new LDRStep();
    let loadedParts = [];
    // function closeStep(keepRotation) {
    //     part.addStep(step);
    //     let rot = step.rotation;
    //     step = new LDRStep();
    //     if (keepRotation && rot !== null) {
    //         step.rotation = rot.clone();
    //     }
    // }
    function closeStep(keepRotation) {
        part.addStep(step);
        // let rot = step.rotation;
        step = new LDRStep();
        // if (keepRotation && rot !== null) {
        //     step.rotation = rot.clone();
        // }
    }

    // State information:
    let modelDescription;
    let inHeader = true;
    let hasFILE = false;
    // let skipPart = false;

    // // TEXMAP support:
    // let texmapPlacement = null;
    // let inTexmapFallback = false;

    let dataLines = data.split(/(\r\n)|\n/);
    for (let i = 0; i < dataLines.length; i++) {
        let line = dataLines[i];
        if (!line) {
            continue; // Empty line, or 'undefined' due to '\r\n' split.
        }

        let parts = line.split(' ').filter(x => x !== ''); // Remove empty strings.
        if (parts.length <= 1) {
            continue; // Empty/ empty comment line
        }
        let lineType = parseInt(parts[0]);
        // if (lineType === 0 && parts.length > 2 && texmapPlacement && parts[1] === '!:') {
        //     parts = parts.slice(2); // Texmap content.
        //     lineType = parseInt(parts[0]);
        // }

        let colorID;
        if (lineType !== 0) {
            colorID = parts[1];

            // if (colorID.length === 9 && colorID.substring(0, 3) === '0x2') {
            //     // Direct color: https://www.ldraw.org/article/218.html
            //     let hexValue = parseInt(colorID.substring(3), 16);
            //     LDRColors[hexValue] = { name: 'Direct color 0x2' + colorID, value: hexValue, edge: hexValue, direct: colorID };
            //     colorID = hexValue;
            // }
            // else if (LDRColors[colorID] === undefined) {
            //     // This color might be on the form "0x2995220", such as seen in 3626bps5.dat:

            //     this.onWarning({ message: 'Unknown color "' + colorID + '". Black (0) will be shown instead.', line: i, subModel: part.ID });
            //     colorID = 0;
            // }
            // else {
            colorID = parseInt(colorID);
            // }
        }

        // // Expire texmapPlacement:
        // if (texmapPlacement && texmapPlacement.used) {
        //     texmapPlacement = null;
        // }

        //console.log('Parsing line', i, 'of type', lineType, 'color', colorID, ':', line); // Useful if you encounter parse errors.

        let l3 = parts.length >= 3;
        let is = type => l3 && type === parts[1];

        // Set the model description
        if (!part.modelDescription && modelDescription) {
            part.modelDescription = modelDescription;
            if (modelDescription.startsWith("~Unknown part ")) { // TODO: This piece of code is specific to Brickhub.org and should be generalised.
                self.onError({ message: 'Unknown part "' + part.ID + '". Please <a href="../upload.php">upload</a> this part for it to be shown correctly in this model. If you do not have it, perhaps you can find it <a href="https://www.ldraw.org/cgi-bin/ptscan.cgi?q=' + part.ID + '">here on LDraw.org</a>. For now it will be shown as a cube. <a href="#" onclick="bump();">Click here</a> once the part has been uploaded to load it into the model.', line: i, subModel: part.ID });
            }
            modelDescription = null; // Ready for next part.
        }

        let p1, p2, p3, p4; // Used in switch.
        switch (lineType) {
            case 0:
                // let saveThisCommentLine = true;

                function handleFileLine(originalFileName) {
                    let fileName = originalFileName.toLowerCase().replace('\\', '/'); // Normalize the name by bringing to lower case and replacing backslashes:
                    // localCull = true;
                    // saveThisCommentLine = false;
                    let isEmpty = part.steps.length === 0 && step.isEmpty();

                    if (isEmpty && !self.mainModel) { // First model
                        self.mainModel = part.ID = fileName;
                    }
                    else if (isEmpty && self.mainModel && self.mainModel === part.ID) {
                        console.warn("Special case: Main model ID change from " + part.ID + " to " + fileName);
                        self.mainModel = part.ID = fileName;
                    }
                    else { // Close model and start new as no FILE directive has been encountered:
                        closeStep(false);

                        if (!part.ID) { // No ID in main model: 
                            console.warn(originalFileName, 'No ID in main model - setting default ID', defaultID);
                            console.dir(part); console.dir(step);
                            part.ID = defaultID;
                            if (!self.mainModel) {
                                self.mainModel = defaultID;
                            }
                        }
                        // if (!skipPart) {
                        self.setPartType(part);
                        loadedParts.push(part.ID);
                        // }
                        // skipPart = false;
                        self.onProgress(part.ID);

                        part = new LDRPartType();
                        inHeader = true;
                        part.ID = fileName;
                    }
                    part.name = originalFileName;
                    modelDescription = null;
                }

                if (is("FILE")) {
                    hasFILE = true;
                    handleFileLine(parts.slice(2).join(" "));
                    // saveThisCommentLine = false;
                }
                else if (!hasFILE && is("file")) { // Special case where some very old files use '0 file' instead of the proper '0 FILE':
                    handleFileLine(parts.slice(2).join(" "));
                    // saveThisCommentLine = false;
                }
                else if (is("Name:")) {
                    part.name = parts.slice(2).join(" ");
                    if (part.ID === part.name) { // Consistent 'FILE' and 'Name:' lines.
                        part.consistentFileAndName = true;
                    }
                    // saveThisCommentLine = false;
                }
                else if (is("Author:")) {
                    part.author = parts.slice(2).join(" ");
                    // saveThisCommentLine = false;
                }
                else if (is("!LICENSE")) {
                    part.license = parts.slice(2).join(" ");
                    // saveThisCommentLine = false;
                }
                else if (is("!LDRAW_ORG")) {
                    part.ldraw_org = parts.slice(2).join(" ");
                    // saveThisCommentLine = false;
                }
                else if (is("!CMDLINE")) {
                    part.preferredColor = parseInt(parts[2].substring(2));
                    // saveThisCommentLine = false;
                }
                // else if (parts[1] === "BFC") {
                //     // BFC documentation: http://www.ldraw.org/article/415
                //     let option = parts[2];
                //     switch (option) {
                //         case "CERTIFY":
                //             part.certifiedBFC = true;
                //             part.CCW = CCW = true;
                //             saveThisCommentLine = false;
                //             break;
                //         case "NOCERTIFY":
                //             part.certifiedBFC = false;
                //             part.CCW = CCW = true; // Doens't matter since there is no culling.
                //             saveThisCommentLine = false;
                //             break;
                //         case "INVERTNEXT":
                //             invertNext = true;
                //             break;
                //         case "CLIP":
                //             localCull = true;
                //             break;
                //         case "NOCLIP":
                //             localCull = false;
                //             break;
                //     }

                //     // Handle CW/CCW:
                //     if (parts[parts.length - 1] === "CCW") {
                //         part.CCW = CCW = true;
                //     }
                //     else if (parts[parts.length - 1] === "CW") {
                //         part.CCW = CCW = false;
                //     }
                // }
                else if (parts[1] === "STEP") {
                    closeStep(true);
                    // saveThisCommentLine = false;
                }
                // else if (parts[1] === "ROTSTEP") {
                //     if (parts.length >= 5) {
                //         step.rotation = new LDRStepRotation(parts[2], parts[3], parts[4], (parts.length === 5 ? "REL" : parts[5]));
                //     }
                //     else if (parts.length === 3 && parts[2] === "END") {
                //         step.rotation = null;
                //     }
                //     closeStep(true);
                //     saveThisCommentLine = false;
                // }
                else if (parts[1] === "!BRICKHUB_INLINED") {
                    part.inlined = parts.length === 3 ? parts[2] : 'UNKNOWN';
                    // saveThisCommentLine = false;
                }
                // else if (parts[1] === "!TEXMAP") {
                //     if (texmapPlacement) { // Expect "0 !TEXMAP FALLBACK" or "0 !TEXMAP END"
                //         if (!(parts.length === 3 && (parts[2] === 'FALLBACK' || parts[2] === 'END'))) {
                //             self.onWarning({ message: 'Unexpected !TEXMAP line. Expected FALLBACK or END line. Found: "' + line + '".', line: i, subModel: part.ID });
                //             inTexmapFallback = false;
                //             texmapPlacement = null;
                //         }
                //         else if (parts[2] === 'FALLBACK') {
                //             inTexmapFallback = true;
                //         }
                //         else { // !TEXMAP END
                //             inTexmapFallback = false;
                //             texmapPlacement = null;
                //         }
                //     }
                //     else { // Expect 0 !TEXMAP START | NEXT...
                //         texmapPlacement = new LDR.TexmapPlacement();
                //         texmapPlacement.setFromParts(parts);
                //         if (texmapPlacement.error) {
                //             self.onWarning({ message: texmapPlacement.error + ': "' + line + '"', line: i, subModel: part.ID });
                //             texmapPlacement = null;
                //         }
                //     }
                //     saveThisCommentLine = false;
                // }
                // else if (parts[1] === "!DATA" && parts.length === 3 && parts[2] === "START") { // Inline texmap : https://www.ldraw.org/article/47.html
                //     skipPart = true;
                //     // Take over parsing in order to read full encoded block:
                //     let encodedContent = '';
                //     // Parse encoded content:
                //     for (; i < dataLines.length; i++) {
                //         line = dataLines[i]; if (!line) continue;
                //         parts = line.split(' ').filter(x => x !== ''); if (parts.length <= 1) continue; // Empty/ empty comment line
                //         lineType = parseInt(parts[0]);
                //         if (lineType !== 0) { self.onWarning({ message: 'Unexpected DATA line type ' + lineType + ' is ignored.', line: i, subModel: part.ID }); continue; }
                //         if (parts.length === 3 && parts[1] === '!DATA' && parts[2] === 'END') break; // Done
                //         if (!parts[1].startsWith('!:')) continue;

                //         encodedContent += parts[1].substring(2);
                //         if (parts.length > 2) encodedContent += parts.slice(2).join('');
                //     }

                //     let detectMimetype = id => id.endsWith('jpg') || id.endsWith('jpeg') ? 'jpeg' : 'png'; // Only png supported according to the spec.
                //     let pid = part.ID;
                //     let mimetype = detectMimetype(pid);
                //     let dataurl = 'data:image/' + mimetype + ';base64,' + encodedContent;
                //     self.texmapDataurls.push({ id: pid, mimetype: mimetype, content: encodedContent });

                //     self.texmaps[pid] = true;
                //     self.texmapListeners[pid] = [];
                //     let image = new Image();
                //     image.onload = function (e) {
                //         let texture = new Texture(this);
                //         texture.needsUpdate = true;
                //         self.texmaps[pid] = texture;
                //         self.texmapListeners[pid].forEach(l => l(texture));
                //         self.onProgress(pid);
                //     };
                //     image.src = dataurl;

                //     saveThisCommentLine = false;
                // }
                // else if (LDR.STUDIO && LDR.STUDIO.handleCommentLine(part, parts)) {
                //     saveThisCommentLine = false;
                // }
                // else if (parts[1][0] === "!") {
                //     if (is("!THEME") ||
                //         is("!HELP") ||
                //         is("!KEYWORDS") ||
                //         is("!HISTORY") ||
                //         is("!LPUB") ||
                //         is("!LDCAD") ||
                //         is("!LEOCAD") ||
                //         is("!CATEGORY")) {
                //         // Ignore known commands.
                //     }
                //     else {
                //         invertNext = false;
                //         self.onWarning({ message: 'Unknown LDraw command "' + parts[1] + '" is ignored.', line: i, subModel: part.ID });
                //     }
                // }
                else {
                    // invertNext = false;
                    modelDescription = line.substring(2);
                    if (inHeader) {
                        // saveThisCommentLine = false; // modelDescription is expected to be the description line in the header, so do not save it.
                    }
                }


                // if (saveThisCommentLine) {
                //     let fileLine = new LDR.Line0(parts.slice(1).join(' '));
                //     if (step.subModels.length > 0) {
                //         step.subModels[step.subModels.length - 1].commentLines.push(fileLine);
                //     }
                //     else {
                //         part.headerLines.push(fileLine);
                //     }
                // }
                break;
            case 1: // 1 <colour> x y z a b c d e f g h i <file>
                for (let j = 2; j < 14; j++) {
                    parts[j] = parseFloat(parts[j]);
                }
                let position = adapter.Vector3.create(parts[2], parts[3], parts[4]);
                let rotation = adapter.Matrix3.create(parts[5], parts[6], parts[7],
                    parts[8], parts[9], parts[10],
                    parts[11], parts[12], parts[13]);
                let subModelID = parts.slice(14).join(" ").toLowerCase().replace('\\', '/');
                // let subModel = new LDRPartDescription(colorID, position, rotation, subModelID, part.certifiedBFC && localCull, invertNext, texmapPlacement);
                let subModel = new LDRPartDescription(colorID, position, rotation, subModelID);

                // (inTexmapFallback ? texmapPlacement.fallback : step).addSubModel(subModel);
                step.addSubModel(subModel);

                inHeader = false;
                // invertNext = false;
                break;
            case 2: // Line "2 <colour> x1 y1 z1 x2 y2 z2"
                p1 = adapter.Vector3.create(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
                p2 = adapter.Vector3.create(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));

                // (inTexmapFallback ? texmapPlacement.fallback : step).addLine(colorID, p1, p2, texmapPlacement);
                step.addLine(colorID, p1, p2);

                inHeader = false;
                // invertNext = false;
                break;
            case 3: // 3 <colour> x1 y1 z1 x2 y2 z2 x3 y3 z3 [u1 v1 u2 v2 u3 v3]
                p1 = adapter.Vector3.create(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
                p2 = adapter.Vector3.create(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
                p3 = adapter.Vector3.create(parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]));
                // if (LDR.STUDIO && parts.length === 17) { // Parse texmap UV's
                //     localCull = false; // Double-side the texmaps on the triangles.
                //     texmapPlacement = LDR.STUDIO.handleTriangleLine(part, parts);
                // }

                // (inTexmapFallback ? texmapPlacement.fallback : step).addTriangle(colorID, p1, p2, p3, part.certifiedBFC && localCull, CCW === invertNext, texmapPlacement);
                step.addTriangle(colorID, p1, p2, p3);

                inHeader = false;
                // invertNext = false;
                break;
            case 4: // 4 <colour> x1 y1 z1 x2 y2 z2 x3 y3 z3 x4 y4 z4
                p1 = adapter.Vector3.create(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
                p2 = adapter.Vector3.create(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
                p3 = adapter.Vector3.create(parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]));
                p4 = adapter.Vector3.create(parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13]));
                // if (!part.certifiedBFC || !localCull) {
                //     step.cull = false; // Ensure no culling when step is handled.
                // }

                // (inTexmapFallback ? texmapPlacement.fallback : step).addQuad(colorID, p1, p2, p3, p4, part.certifiedBFC && localCull, CCW === invertNext, texmapPlacement);
                step.addQuad(colorID, p1, p2, p3, p4);

                inHeader = false;
                // invertNext = false;
                break;
            case 5: // Conditional lines:
                p1 = adapter.Vector3.create(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]));
                p2 = adapter.Vector3.create(parseFloat(parts[5]), parseFloat(parts[6]), parseFloat(parts[7]));
                p3 = adapter.Vector3.create(parseFloat(parts[8]), parseFloat(parts[9]), parseFloat(parts[10]));
                p4 = adapter.Vector3.create(parseFloat(parts[11]), parseFloat(parts[12]), parseFloat(parts[13]));

                // (inTexmapFallback ? texmapPlacement.fallback : step).addConditionalLine(colorID, p1, p2, p3, p4, texmapPlacement);
                step.addConditionalLine(colorID, p1, p2, p3, p4);

                inHeader = false;
                // invertNext = false;
                break;
            default:
                self.onWarning({ message: 'Unknown command "' + parts[1] + '" is ignored.', line: i, subModel: part.ID });
                break;
        }
    }

    part.addStep(step);
    if (!part.ID) {
        part.ID = defaultID; // No name given in file.
        if (!this.mainModel) {
            this.mainModel = part.ID;
        }
    }
    // if (!skipPart) {
    this.setPartType(part);
    loadedParts.push(part.ID);
    // }

    loadedParts = loadedParts.map(id => self.partTypes[id]); // Map from ID to part type.

    // if (LDR.STUDIO) {
    //     loadedParts.forEach(part => LDR.STUDIO.handlePart(self, part));
    // }

    // return this.onPartsLoaded(loadedParts);
    return this.onPartsLoaded(defaultID, loadedParts);

    // // Save loaded parts into IndexedDB:
    // if (this.storage.db) {
    //     if (this.options.hasOwnProperty('key') && this.options.hasOwnProperty('timestamp')) {
    //         self.storage.saveInstructionsToStorage(self, self.options.key, self.options.timestamp);
    //     }
    //     self.storage.savePartsToStorage(loadedParts, self);
    //     // Do not call storage.db.close() as there might be other parts that should be saved.
    // }

    //console.log(loadedParts.length + ' LDraw file(s) read in ' + (new Date()-parseStartTime) + 'ms.');

}


LDRLoader.prototype.applyOnPartTypes = function (f) {
    for (let id in this.partTypes) {
        if (!this.partTypes.hasOwnProperty(id)) {
            continue;
        }
        let pt = this.partTypes[id];
        if (pt === true) {
            continue;
        }
        f(pt);
    }
}



// LDRLoader.prototype.onPartsLoaded = function (loadedParts) {
LDRLoader.prototype.onPartsLoaded = function (id, loadedParts) {
    let self = this;

    if (!loadedParts) {
        loadedParts = [];
        this.applyOnPartTypes(pt => loadedParts.push(pt));
    }

    // Load the unknown parts:    
    let unloadedPartsSet = {};
    let unloadedPartsList = [];
    function checkPart(id) {
        if (!(self.partTypes.hasOwnProperty(id) || unloadedPartsSet.hasOwnProperty(id))) {
            unloadedPartsSet[id] = true;
            unloadedPartsList.push(id);
        }
    }
    loadedParts.forEach(pt => pt.steps.forEach(s => s.subModels.forEach(sm => checkPart(sm.ID))));

    // Set part info (part vs non-part):
    loadedParts.forEach(pt => pt.isPart = pt.computeIsPart(self));

    // Clean up parts and purge those that are empty:
    loadedParts.forEach(pt => pt.cleanUp(self));
    // loadedParts.forEach(pt => { if (pt.steps.length === 0) self.purgePart(pt.ID); });

    // // Handle assemblies:
    // if (this.options.buildAssemblies) {
    //     if (!this.assemblyManager) {
    //         this.assemblyManager = new LDR.AssemblyManager(this);
    //     }
    //     const AM = this.assemblyManager;

    //     loadedParts.forEach(pt => AM.handlePartType(pt));

    //     let handleAssemblies = pt => {
    //         if (!pt.isPart) {
    //             pt.steps.forEach(s => AM.handleStep(s).forEach(checkPart));
    //         }
    //     };
    //     loadedParts.forEach(handleAssemblies);
    // }

    if (unloadedPartsList.length > 0) {
        return self.loadMultiple(id, unloadedPartsList);
    }
    else {
        return just(id);
    }
}






LDRLoader.prototype.getPartType = function (id) {
    if (!this.partTypes.hasOwnProperty(id)) {
        let pt;
        // if (LDR.Generator && (pt = LDR.Generator.make(id))) {
        if (pt = make(id)) {
            return this.partTypes[id] = pt;
        }
        return null;
    }
    let pt = this.partTypes[id];
    if (pt === true) {
        return null;
    }
    return pt;
}




let _loadMainModel = function (url, loader) {
    return fromPromise(
        adapter.Network.fetch(url, "text")
    )
        .flatMap((text) => {
            return loader.parse(text, "mainModel");
        })
};


let _loadSubModel = function (id, urlIndex, urls, loader) {
    let tryLoadOtherUrl = function (event) {
        if (urlIndex < urls.length) {
            return _loadSubModel(id, urlIndex + 1, urls, loader);
        }
        else {
            loader.onError({ message: event.currentTarget ? event.currentTarget.statusText : 'Error during loading', subModel: id });

            return throwError(event);
        }
    }

    return fromPromise(
        adapter.Network.fetch(urls[urlIndex], "text")
    )
        .recoverWith(tryLoadOtherUrl)
};


let _loadSubModelAndParse = function (id, urlIndex, urls, loader) {

    return _loadSubModel(id, urlIndex, urls, loader)
        .flatMap((text) => {
            return loader.parse(text, id);
        })
};




let _loadMultiple = (id, toBeFetched, loader) => {
    if (toBeFetched.length === 0) {
        return just(id);
    }

    return mergeArray(
        toBeFetched.map(id => _loadSubModelAndParse(id, 0, loader.buildAllPossibleUrls(id), loader))
    )
};


LDRLoader.prototype.loadMultiple = function (id, ids) {
    let self = this;
    // function onStorageFetchingDone(unloadedParts) {
    //     unloadedParts.forEach(id => self.load(id));
    //     self.unloadedFiles--;
    //     self.reportProgress(ids[0]);
    // }
    // self.unloadedFiles++; // Prevent early exit.

    // this.storage.retrievePartsFromStorage(this, ids, onStorageFetchingDone);

    let toBeFetched = ids;


    // Try to fetch those that can be generated:
    let stillToBeFetched = [];
    toBeFetched.forEach(id => {
        let pt = make(id)
        if (pt) {
            self.setPartType(pt);
        }
        else {
            stillToBeFetched.push(id);
        }
    });

    // onDone(stillToBeFetched);
    // return from(
    //     stillToBeFetched.map(this.load)
    // );
    // return stillToBeFetched.map(this.load)
    // return stillToBeFetched.flatMap(id => this.load(id))
    //     .mergeAll();

    return _loadMultiple(id, stillToBeFetched, this);
}



/*
 * Load an ldr/mpd/dat file without checking storage first.
 * 
 * id is the file name to load. 
 * id is transformed using 'buildUrls' which can be parsed to the loader using the options parameter in the constructor.
 */
LDRLoader.prototype.load = function (modelUrl) {
    return _loadMainModel(modelUrl, this)
};


LDRLoader.prototype.getMainModel = function () {
    if (!this.mainModel) {
        throw 'No main model set for ldrLoader!';
    }
    if (!this.partTypes.hasOwnProperty(this.mainModel)) {
        throw 'Inconsistent internal storage for ldrLoader: No main model!';
    }
    let pt = this.partTypes[this.mainModel];
    if (pt === true) {
        throw 'Main model not yet loaded!';
    }
    return pt;
}

LDRLoader.prototype.generate = function (colorID, mc, taskList) {
    // this.loadTexmaps();

    let mainModel = this.getMainModel();

    // Place model in scene:
    let origo = adapter.Vector3.create(0.0, 0.0, 0.0);
    let inv = adapter.Matrix3.create(1, 0, 0, 0, -1, 0, 0, 0, -1);// Invert Y, and Z-axis for LDraw

    // // Generate the meshes:
    // if (this.cleanUpPrimitivesAndSubParts) {
    //     mainModel.setReferencedFrom(this);
    // }
    // mainModel.generateThreePart(this, colorID, origo, inv, true, false, mc, null, taskList);
    mainModel.generateThreePart(this, colorID, origo, inv, mc, null);
}