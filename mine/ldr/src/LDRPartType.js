let LDRPartType = function () {
    this.name; // The value for '0 FILE' and '0 Name:'.
    this.ID = null; // this.name, but lower case and with backslashes replaced with forward slashes.
    this.modelDescription;
    this.author;
    this.license;
    this.steps = [];
    this.headerLines = [];
    // this.lastRotation = null;
    // this.replacement;
    this.inlined;
    this.ldraw_org;
    // this.geometry;
    // this.cnt = -1;
    this.cleanSteps = false;
    // this.certifiedBFC;
    // this.CCW;
    this.consistentFileAndName;

    this.preferredColor;

    // // To support early cleanup:
    // this.referencedFrom = {};
    // this.references = 0;
}

LDRPartType.prototype.addStep = function (step) {
    if (step.isEmpty() && this.steps.length === 0) {
        return; // Totally illegal step.
    }

    // Update rotation in case of ADD;
    // if (step.rotation && step.rotation.type === "ADD") {
    //     if (!this.lastRotation) {
    //         step.rotation.type = "REL";
    //     }
    //     else {
    //         step.rotation = new LDRStepRotation(step.rotation.x + this.lastRotation.x,
    //             step.rotation.y + this.lastRotation.y,
    //             step.rotation.z + this.lastRotation.z,
    //             this.lastRotation.type);
    //     }
    // }

    // let sameRotation = LDRStepRotation.equals(step.rotation, this.lastRotation);
    // if (step.isEmpty() && sameRotation) {
    //     return; // No change.
    // }
    // if (this.steps.length > 0) {
    //     let prevStep = this.steps[this.steps.length - 1];
    //     if (prevStep.isEmpty() && sameRotation) {
    //         // Special case: Merge into previous step:
    //         this.steps[this.steps.length - 1] = step;
    //         return;
    //     }
    // }
    this.steps.push(step);
    // this.lastRotation = step.rotation;
}

LDRPartType.prototype.isPrimitive = function () {
    if (!this.ldraw_ord) {
        return false;
    }
    let lo = this.ldraw_org.split(' ')[0]; // First token.
    return lo === 'Primitive' || lo === 'Subpart' || lo === '8_Primitive' || lo === '48_Primitive';
}

LDRPartType.prototype.computeIsPart = function (loader) {
    // Simple checks:
    if (this.steps.length !== 1) {
        return false; // No steps in parts.
    }
    let s = this.steps[0];
    if (s.hasPrimitives) {
        return true; // Contains line, triangle or quad primitives.
    }

    // LDRAW_ORG checks:
    if (this.isOfficialLDraw()) {
        return true;
    }

    // Check sub-models. If any is a primitive or subpart, then this is a part:
    for (let i = 0; i < s.subModels.length; i++) {
        let t = loader.getPartType(s.subModels[i].ID);
        if (t) {
            if (t.isPrimitive()) {
                return true;
            }
            if (t.steps.length !== 1) {
                return false; // Sub model is not a part.
            }
        }
    }

    return this.ID.endsWith('.dat'); // Unsafe check as some old models used 'dat' for non-parts, but what can we do?
}


// Official LDraw part types: https://www.ldraw.org/article/398.html
LDRPartType.prototype.isOfficialLDraw = function () {
    if (!this.ldraw_org) {
        return false;
    }
    let lo = this.ldraw_org.split(' ')[0]; // First token.
    return lo === 'Part' || lo === 'Primitive' || lo === 'Subpart' ||
        lo === '8_Primitive' || lo === '48_Primitive' || lo === 'Shortcut';
}



/*
  Clean up all steps.
  This can cause additional steps (such as when a step contains both parts and sub models.
 */
LDRPartType.prototype.cleanUp = function (loader) {
    if (this.cleanSteps) {
        return; // Already done.
    }
    this.cleanSteps = true;

    // if (this.isReplacedPart()) {
    //     this.replacement = this.steps[0].subModels[0].ID;
    //     //loader.onWarning({message:'The part "' + this.ID + '" has been replaced by "' + this.replacement + '".', line:0, subModel:this.ID});
    // }
    // else {
    let newSteps = [];
    this.steps.forEach(step => step.cleanUp(loader, newSteps));
    this.steps = newSteps;
    // }
}


LDRPartType.prototype.ensureGeometry = function (loader) {
    if (this.geometry) {
        return; // Already prepared.
    }
    this.geometry = new LDR.LDRGeometry();
    this.geometry.fromPartType(loader, this);
    // if (loader.cleanUpPrimitivesAndSubParts) {
    //     this.removePrimitivesAndSubParts(loader);
    // }
}

// LDRPartType.prototype.generateThreePart = function (loader, c, p, r, cull, inv, mc, pd, taskList) {
// LDRPartType.prototype.generateThreePart = function (loader, c, p, r, cull, inv, mc, pd) {
LDRPartType.prototype.generateThreePart = function (loader, c, p, r, mc, pd) {
    if (!this.geometry) {
        if (this.isPart) {
            // if (taskList) {
            //     let self = this;
            //     taskList.push(() => self.generateThreePart(loader, c, p, r, cull, inv, mc, pd));
            //     mc.expandBoundingBoxByPoint(p); // Assumes p is within the part.
            //     return;
            // }
            // else {
            this.ensureGeometry(loader);
            // }
        }
        else {
            // this.steps.forEach(step => step.generateThreePart(loader, c, p, r, cull, inv, mc, taskList));
            // this.steps.forEach(step => step.generateThreePart(loader, c, p, r, cull, inv, mc));
            this.steps.forEach(step => step.generateThreePart(loader, c, p, r, mc));
            return;
        }
    }

    // if (loader.physicalRenderingAge === 0) {
    this.geometry.buildGeometriesAndColors();
    // }
    // else {
    //     this.geometry.buildPhysicalGeometriesAndColors();
    // }

    let m3e = adapter.Matrix3.getElements(r);
    let m4 = adapter.Matrix4.create(m3e[0], m3e[3], m3e[6], p.x,
        m3e[1], m3e[4], m3e[7], p.y,
        m3e[2], m3e[5], m3e[8], p.z,
        0, 0, 0, 1
    );

    if (this.geometry.lineGeometry) {
        let material = new LDR.Colors.buildLineMaterial(this.geometry.lineColorManager, c, false);
        let normalLines = adapter.LineSegments.create(this.geometry.lineGeometry, material);
        normalLines = adapter.LineSegments.applyMatrix4(m4, normalLines);
        mc.addLines(normalLines, pd, false);
    }

    if (this.geometry.conditionalLineGeometry) {
        let material = new LDR.Colors.buildLineMaterial(this.geometry.lineColorManager, c, true);
        let conditionalLines = adapter.LineSegments.create(this.geometry.conditionalLineGeometry, material);
        conditionalLines = adapter.LineSegments.applyMatrix4(m4, conditionalLines);
        mc.addLines(conditionalLines, pd, true);
    }

    // Normal triangle geometries:
    for (let tc in this.geometry.triangleGeometries) {
        if (!this.geometry.triangleGeometries.hasOwnProperty(tc)) {
            continue;
        }
        let g = this.geometry.triangleGeometries[tc];

        let material;
        // if (loader.physicalRenderingAge === 0) { // Simple rendering:
        let triangleColorManager = new LDR.ColorManager();
        triangleColorManager.get(tc); // Ensure color is present.
        material = new LDR.Colors.buildTriangleMaterial(triangleColorManager, c, false);
        // }
        // else { // Physical rendering:
        //     tc = tc === '16' ? c : tc;
        //     material = LDR.Colors.buildStandardMaterial(tc);
        // }
        let mesh = adapter.Mesh.create(adapter.Geometry.clone(g), material); // Using clone to ensure matrix in next line doesn't affect other usages of the geometry.
        // mesh.castShadow = loader.physicalRenderingAge !== 0;
        mesh = adapter.Mesh.setCastShadow(false, mesh);
        mesh = adapter.Mesh.applyMatrix4(m4, mesh);// Doesn't work for all LDraw parts as the matrix needs to be decomposable to position, quaternion and scale. Some rotation matrices in LDraw parts are not decomposable.
        mc.addMesh(tc, mesh, pd);
    }

    // let self = this;
    // for (let idx in this.geometry.texmapGeometries) { // Texmap geometries:
    //     if (!this.geometry.texmapGeometries.hasOwnProperty(idx)) {
    //         continue;
    //     }
    //     this.geometry.texmapGeometries[idx].forEach(obj => {
    //         let g = obj.g, c2 = obj.c;
    //         let c3 = c2 === '16' ? c : c2;
    //         let textureFile = LDR.TexmapPlacements[idx].file;

    //         let material;
    //         let buildMaterial, setMap;
    //         if (loader.physicalRenderingAge === 0) {
    //             let triangleColorManager = new LDR.ColorManager();
    //             triangleColorManager.get(c2); // Ensure color is present.
    //             buildMaterial = t => LDR.Colors.buildTriangleMaterial(triangleColorManager, c3, t);
    //             setMap = t => material.uniforms.map = { type: 't', value: t };
    //         }
    //         else {
    //             buildMaterial = t => LDR.Colors.buildStandardMaterial(c3, t);
    //             setMap = t => material.map = t;
    //         }

    //         if (loader.texmaps[textureFile] === true) {
    //             material = buildMaterial(true);
    //             function setTexmap(t) {
    //                 setMap(t);
    //                 material.needsUpdate = true;
    //                 loader.onProgress(textureFile);
    //             }
    //             loader.texmapListeners[textureFile].push(setTexmap);
    //         }
    //         else {
    //             let texture = loader.texmaps[textureFile];
    //             material = buildMaterial(texture);
    //         }

    //         let mesh = new Mesh(g.clone(), material);
    //         mesh.geometry.applyMatrix4(m4);
    //         mc.addMesh(c3, mesh, pd);
    //     });
    // }

    let b = this.geometry.boundingBox;
    mc.expandBoundingBox(b, m4);
}