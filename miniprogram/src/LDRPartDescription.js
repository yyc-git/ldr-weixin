/*
  Part description: a part (ID) placed (position, rotation) with a
  given color (16/24 allowed) and invertCCW to allow for sub-parts in DAT-parts.
*/
// let LDRPartDescription = function (colorID, position, rotation, ID, cull, invertCCW, texmapPlacement) {
export let LDRPartDescription = function (colorID, position, rotation, ID) {
    this.c = colorID; // LDraw ID. Negative values indicate edge colors - see top description.
    this.p = position; // Vector3
    this.r = rotation; // Matrix3
    this.ID = ID.toLowerCase(); // part.dat lowercase
    // this.cull = cull;
    // this.invertCCW = invertCCW;
    // this.tmp = texmapPlacement;
    // this.ghost;
    // this.original; // If this PD is a colored clone of an original PD.
    // this.commentLines = [];
    // texmapPlacement && texmapPlacement.use();
}