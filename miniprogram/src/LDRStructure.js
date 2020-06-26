
// LDR.Line2 = function (c, p1, p2, tmp) {
export let Line2 = function (c, p1, p2) {
    this.c = c;
    this.p1 = p1;
    this.p2 = p2;
    // this.tmp = tmp;
}


// LDR.Line3 = function (c, p1, p2, p3, cull, invert, tmp) {
export let Line3 = function (c, p1, p2, p3) {
    this.c = c;
    // if (invert) {
    //     this.p1 = p3;
    //     this.p2 = p2;
    //     this.p3 = p1;
    // }
    // else {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    // }
    // this.cull = cull;
    // this.tmp = tmp;
}


// LDR.Line4 = function (c, p1, p2, p3, p4, cull, invert, tmp) {
export let Line4 = function (c, p1, p2, p3, p4) {
    this.c = c;
    // if (invert) {
    //     this.p1 = p4;
    //     this.p2 = p3;
    //     this.p3 = p2;
    //     this.p4 = p1;
    // }
    // else {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    // }
    // this.cull = cull;
    // this.tmp = tmp;
}

// LDR.Line5 = function (c, p1, p2, p3, p4, tmp) {
export let Line5 = function (c, p1, p2, p3, p4) {
    this.c = c;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    // this.tmp = tmp;
}