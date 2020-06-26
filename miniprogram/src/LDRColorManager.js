import {adapter} from "./adapter/Adapter"
import { LDRColors } from "./colors"
import { getHighContrastColor4 } from "./LDRColorMaterials"

export let LDRColorManager = function () {
    this.shaderColors = []; // [] => Vector4
    this.highContrastShaderColors = []; // [] => Vector4
    this.map = {}; // colorID -> floatColor
    this.sixteen = -1;
    this.edgeSixteen = -1;
    this.anyTransparentColors = false;
    this.mainColorIsTransparent = false;
}

LDRColorManager.prototype.clone = function () {
    let ret = new LDRColorManager();
    ret.shaderColors.push(...this.shaderColors);
    ret.highContrastShaderColors.push(...this.highContrastShaderColors);
    ret.sixteen = this.sixteen;
    ret.edgeSixteen = this.edgeSixteen;
    ret.anyTransparentColors = this.anyTransparentColors;
    ret.mainColorIsTransparent = this.mainColorIsTransparent;
    for (let c in this.map) {
        if (this.map.hasOwnProperty(c))
            ret.map[c] = this.map[c];
    }
    return ret;
}

LDRColorManager.prototype.overWrite = function (id) {
    if (this.sixteen === -1 && this.edgeSixteen === -1) {
        return;
    }

    let isEdge = id < 0;
    let lowID = isEdge ? -id - 1 : id;
    let colorObject = LDRColors[lowID];
    if (!colorObject) {
        throw "Unknown color: " + id;
    }
    let alpha = colorObject.alpha ? colorObject.alpha / 256.0 : 1;
    this.mainColorIsTransparent = alpha < 1;

    if (this.sixteen >= 0) {
        let color = adapter.Color.createWithHex(isEdge ? colorObject.edge : colorObject.value);
        this.shaderColors[this.sixteen] = adapter.Vector4.create(adapter.Color.getR(color), adapter.Color.getG(color), adapter.Color.getB(color), alpha);
    }
    if (this.edgeSixteen >= 0) {
        let color = adapter.Color.createWithHex(colorObject.edge);
        this.shaderColors[this.edgeSixteen] = adapter.Vector4.create(adapter.Color.getR(color), adapter.Color.getG(color), adapter.Color.getB(color), 1);// Drop alpha from edge lines to increase contrast.

        this.highContrastShaderColors[this.edgeSixteen] = getHighContrastColor4(lowID);
    }

    this.lastSet = id;
}

LDRColorManager.prototype.get = function (id) {
    let f = this.map[id];
    if (f) {
        return f;
    }
    if (id == 16) {
        this.sixteen = this.shaderColors.length;
    }
    else if (id == 10016 || id == 24) {
        this.edgeSixteen = this.shaderColors.length;
    }

    let isEdge = id < 0;
    let lowID = isEdge ? -id - 1 : id;
    let colorObject = LDRColors[lowID];
    if (!colorObject) {
        throw "Unknown color " + lowID + " from " + id;
    }
    let color = adapter.Color.createWithHex(isEdge ? colorObject.edge : colorObject.value);
    let alpha = colorObject.alpha ? colorObject.alpha / 256.0 : 1;
    this.anyTransparentColors = (this.anyTransparentColors || (alpha < 1))

    f = this.shaderColors.length + 0.1;
    this.map[id] = f;
    this.shaderColors.push(adapter.Vector4.create(adapter.Color.getR(color), adapter.Color.getG(color), adapter.Color.getB(color), alpha));
    this.highContrastShaderColors.push(getHighContrastColor4(lowID));
    return f;
}


LDRColorManager.prototype.containsTransparentColors = function () {
    return this.anyTransparentColors || this.mainColorIsTransparent;
}