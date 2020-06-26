
// let Matrix3.create = (a1, a2, a3, a4, a5, a6, a7, a8, a9) => {
//     let mat = new THREE.Matrix3();
//     mat.set(a1, a2, a3, a4, a5, a6, a7, a8, a9);

//     return mat;
// };



// // let getMatrix3Elements = (mat) => {
// //     return mat.elements
// // };

// // let getMatrix3Determinant = (mat) => {
// //     return mat.determinant();
// // };


// let createMatrix4 = (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) => {
//     let mat = new THREE.Matrix4();
//     mat.set(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);

//     return mat;
// };

let Vector3 = {
    create: (x, y, z) => {
        return new THREE.Vector3(x, y, z);
    },

    set: (x, y, z, vec3) => {
        vec3.set(x, y, z);
        return vec3;
    },
    applyMatrix3: (mat3, vec3) => {
        vec3.applyMatrix3(mat3);
        return vec3;
    },
    add: (v1, v2) => {
        v2.add(v1);

        return v2;
    },
};


let Vector4 = {
    create: (x, y, z, w) => {
        return new THREE.Vector4(x, y, z, w);
    }
};

let Matrix3 = {
    create: (a1, a2, a3, a4, a5, a6, a7, a8, a9) => {
        let mat = new THREE.Matrix3();
        mat.set(a1, a2, a3, a4, a5, a6, a7, a8, a9);

        return mat;
    },
    createEmpty: () => {
        let mat = new THREE.Matrix3();

        return mat;
    },
    multiplyMatrices: (mat1, mat2, mat3) => {
        mat3.multiplyMatrices(mat1, mat2);
        return mat3;
    },
    getElements: (mat) => {
        return mat.elements;
    }
};

let Matrix4 = {
    create: (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) => {
        let mat = new THREE.Matrix4();
        mat.set(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);

        return mat;
    }
};

let Color = {
    createWithHex: (hex) => {
        return new THREE.Color(hex);
    },
    getR: (color) => {
        return color.r
    },
    getG: (color) => {
        return color.g
    },
    getB: (color) => {
        return color.b
    },
};

let Geometry = {
    createFloat32BufferAttribute: (vertices, itemSize) => {
        return new THREE.Float32BufferAttribute(vertices, itemSize);
    },
    createBufferGeometry: () => {
        return new THREE.BufferGeometry();
    },
    setIndex: (indices, bufferGeometry) => {
        bufferGeometry.setIndex(indices);
        return bufferGeometry;
    },
    setAttribute: (name, vertexAttribute, bufferGeometry) => {
        bufferGeometry.setAttribute(name, vertexAttribute);
        return bufferGeometry;
    },
    clone: (geometry) => {
        return geometry.clone();
    }
};

let RawShaderMaterial = {
    create: (data) => {
        return new THREE.RawShaderMaterial(data);
    }
};

let LineSegments = {
    create: (geometry, material) => {
        return new THREE.LineSegments(geometry, material);
    },
    applyMatrix4: (mat4, lineSegments) => {
        lineSegments.applyMatrix4(mat4);
        return lineSegments;
    }
};

let Mesh = {
    create: (geometry, material) => {
        return new THREE.Mesh(geometry, material);
    },
    setCastShadow: (isCastShadow, mesh) => {
        mesh.castShadow = isCastShadow;
        return mesh;
    },
    applyMatrix4: (mat4, mesh) => {
        mesh.geometry.applyMatrix4(mat4);
        return mesh;
    }
};

let BoundingBox3 = {
    create: () => {
        return new THREE.Box3();
    },
    applyMatrix4: (mat4, box3) => {
        box3.applyMatrix4(mat4);
        return box3;
    },
    getMin: ( box3) => {
        return box3.min;
    },
    setMin: (min, box3) => {
        box3.min.min(min);
        return box3;
    },
    getMax: ( box3) => {
        return box3.max;
    },
    setMax: (max, box3) => {
        box3.max.max(max);
        return box3;
    },
    copy: (b1, b2) => {
        b2.copy(b1);
        return b2;
    },
    expandByPoint: (point, box3) =>{
        box3.expandByPoint(point);
        return box3;
    }
};

let THREEAdapter = {
    Vector3,
    Vector4,
    Matrix3,
    Matrix4,
    Color,
    Geometry,
    RawShaderMaterial,
    LineSegments,
    Mesh,
    BoundingBox3
};