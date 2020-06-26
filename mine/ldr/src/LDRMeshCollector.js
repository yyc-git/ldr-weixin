window.LDR = window.LDR || {};

/*
  MeshCollector holds references to meshes (and similar Three.js structures for lines).
  A Mesh Collector handles updates of meshes. This includes;
  - Changes in options (coloring of old parts, edge colors)
  - visibility
  - 'old': A part placed in 'earlier steps' can be colored 'old' to highlight new parts
  - 'ghost': 'Ghosted' parts will be shown by their lines only (no faces).
*/
LDR.MeshCollectorIdx = 0;
LDR.MeshCollector = function (opaqueObject, sixteenObject, transObject, outliner) {
    this.opaqueObject = opaqueObject;
    this.sixteenObject = sixteenObject; // To be painted after anything opaque, as it might be trans.
    this.transObject = transObject; // To be painted last.
    this.outliner = outliner || false; // With outlined objects

    this.lineMeshes = []; // {mesh,part,conditional}
    this.triangleMeshes = []; // {mesh,part,parent}

    this.old = false;
    this.visible = true;
    this.boundingBox;
    this.isMeshCollector = true;
    this.idx = LDR.MeshCollectorIdx++;
}

LDR.MeshCollector.prototype.addLines = function (mesh, part, conditional) {
    this.lineMeshes.push({ mesh: mesh, part: part, conditional: conditional });
    this.opaqueObject.add(mesh);
}

LDR.MeshCollector.prototype.addMesh = function (color, mesh, part) {
    let parent;
    if (color === 16) {
        parent = this.sixteenObject;
    }
    else if (LDR.Colors.isTrans(color)) {
        parent = this.transObject;
    }
    else {
        parent = this.opaqueObject;
    }
    this.triangleMeshes.push({ mesh: mesh, part: part, parent: parent });
    parent.add(mesh);
}

LDR.MeshCollector.prototype.removeAllMeshes = function () {
    let self = this;
    this.lineMeshes.forEach(obj => self.opaqueObject.remove(obj.mesh));
    this.triangleMeshes.forEach(obj => obj.parent.remove(obj.mesh));
}

// /*
//   Sets '.visible' on all meshes according to LDR.Options and 
//   visibility of this meshCollector.
//  */
// LDR.MeshCollector.prototype.updateMeshVisibility = function () {
//     let v = this.visible;
//     let lineV = v && LDR.Options && LDR.Options.lineContrast !== 2;

//     this.lineMeshes.forEach(obj => obj.mesh.visible = lineV);

//     let old = this.old;
//     this.triangleMeshes.forEach(obj => obj.mesh.visible = v && (old || !(LDR.Options && LDR.Options.showEditor && obj.part && obj.part.original && obj.part.original.ghost))); // Do not show faces for ghosted parts.
// }



LDR.MeshCollector.prototype.expandBoundingBox = function (boundingBox, m) {
    let b = adapter.BoundingBox3.create();
    b = adapter.BoundingBox3.copy(boundingBox, b);
    b = adapter.BoundingBox3.applyMatrix4(m, b);

    if (!this.boundingBox) {
        this.boundingBox = b;
    }
    else {
        this.boundingBox = adapter.BoundingBox3.expandByPoint(adapter.BoundingBox3.getMin(b), this.boundingBox);
        this.boundingBox = adapter.BoundingBox3.expandByPoint(adapter.BoundingBox3.getMax(b), this.boundingBox);
    }
}