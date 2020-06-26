window.LDR = window.LDR || {};


LDR.Colors.canBeOld = false;

LDR.ColorMaterialIdx = 0;


LDR.Colors.getHighContrastColor4 = function (colorID) {
    if (colorID === 0 || colorID === 256 || colorID === 64 || colorID === 32 || colorID === 83) {
        return adapter.Vector4.create(1, 1, 1, 1);
    }
    else if (colorID === 272 || colorID === 70) {
        return adapter.Vector4.create(1, 0, 0, 1);
    }
    else {
        return adapter.Vector4.create(0, 0, 0, 1);
    }
}


LDR.Colors.isTrans = function (colorID) {
    return LDR.Colors[colorID < 0 ? -colorID - 1 : colorID].alpha > 0;
}


LDR.Colors.buildLineMaterial = function (colorManager, color, conditional) {
    colorManager = colorManager.clone();
    colorManager.overWrite(color);
    colorManager.idMaterial = LDR.ColorMaterialIdx++;

    // let colors = (LDR.Options && LDR.Options.lineContrast === 0) ?
    //   colorManager.highContrastShaderColors : colorManager.shaderColors;
    let colors = colorManager.shaderColors;

    let len = colors.length;

    let uniforms = {};
    if (LDR.Colors.canBeOld) {
        uniforms['old'] = { value: false };
    }
    if (len > 1) {
        uniforms['colors'] = { type: 'v4v', value: colors };
    }
    else {
        uniforms['color'] = { type: 'v4', value: colors[0] };
    }
    let ret = adapter.RawShaderMaterial.create({
        uniforms: uniforms,
        vertexShader: (conditional ?
            LDR.Shader.createConditionalVertexShader(LDR.Colors.canBeOld, colors, true) :
            // LDR.Shader.createSimpleVertexShader(LDR.Colors.canBeOld, colors, true, true, false)),
            LDR.Shader.createSimpleVertexShader(LDR.Colors.canBeOld, colors, true, true)),
        fragmentShader: (conditional ?
            LDR.Shader.AlphaTestFragmentShader :
            LDR.Shader.SimpleFragmentShader),
        transparent: false,
        visible: true
    });
    // ret.colorManager = colorManager;
    return ret;
}


// LDR.Colors.buildTriangleMaterial = function (colorManager, color, texmap) {
LDR.Colors.buildTriangleMaterial = function (colorManager, color) {
    colorManager = colorManager.clone();
    colorManager.overWrite(color);
    let colors = colorManager.shaderColors;
    let len = colors.length;

    let uniforms = {};
    if (LDR.Colors.canBeOld) {
        uniforms['old'] = { value: false };
    }
    if (len > 1) {
        uniforms['colors'] = { type: 'v4v', value: colors };
    }
    else {
        uniforms['color'] = { type: 'v4', value: colors[0] };
    }
    // if (texmap && texmap !== true) {
    //     uniforms['map'] = { type: 't', value: texmap };
    // }

    let isTrans = colorManager.containsTransparentColors();

    let ret = adapter.RawShaderMaterial.create({
        uniforms: uniforms,
        // vertexShader: LDR.Shader.createSimpleVertexShader(LDR.Colors.canBeOld, colors, false, false, texmap),
        vertexShader: LDR.Shader.createSimpleVertexShader(LDR.Colors.canBeOld, colors, false, false),
        // fragmentShader: texmap ? LDR.Shader.TextureFragmentShader : LDR.Shader.SimpleFragmentShader,
        fragmentShader: LDR.Shader.SimpleFragmentShader,
        transparent: isTrans,
        depthWrite: !isTrans
    });
    return ret;
}