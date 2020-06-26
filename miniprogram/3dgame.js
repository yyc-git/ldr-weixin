let THREE = require('./three/three')


import './three/OrbitControlsWX';

import { adapter, setAdapter } from './src/adapter/Adapter.js';
import { LDRMeshCollector } from "./src/LDRMeshCollector"
import { LDRLoader } from "./src/LDRLoader"
import { THREEAdapter } from "./js/adapter/three/ThreeAdapter"
import { getStoragePrefix } from "./js/cloud"


wx.cloud.init({
    // env 参数说明：
    //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
    //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
    //   如不填则使用默认环境（第一个创建的环境）
    // env: 'testldr1-3t3vf',
})


export default class game3d {
    startTime = null

    constructor() {
        setAdapter(THREEAdapter);
        this.startTime = new Date();

        this.init();
    }
    init() {
        let model = getStoragePrefix() + "models/Apple Tree Final.ldr"
        // let model = getStoragePrefix() + "models/box.dat"

        // Set up camera:
        let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000000);
        camera.position.set(10000, 7000, 10000);
        camera.lookAt(new THREE.Vector3());



        // Set up scene:
        let scene = new THREE.Scene();
        scene.background = new THREE.Color(0xFFFFFF);

        let baseObject = new THREE.Group();
        let opaqueObject = new THREE.Group();
        let sixteenObject = new THREE.Group();
        let transObject = new THREE.Group();

        baseObject.add(opaqueObject); // Draw non-trans before trans.
        baseObject.add(sixteenObject);
        baseObject.add(transObject);
        scene.add(baseObject);
        let mc = new LDRMeshCollector(opaqueObject, sixteenObject, transObject);

        // Set up renderer:
        let renderer = new THREE.WebGLRenderer({ canvas, antialias: true });




        // renderer.setPixelRatio(window.devicePixelRatio);
        function render() {
            renderer.render(scene, camera);
        }
        // document.body.appendChild(renderer.domElement);

        function resizeWindow() {
            camera.left = -window.innerWidth;
            camera.right = window.innerWidth;
            camera.top = window.innerHeight;
            camera.bottom = -window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            render();
        }

        // React to user input:
        let controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', render);
        window.addEventListener('resize', resizeWindow, false);


        // Three.js loader for LDraw models:
        let ldrLoader;

        ldrLoader = new LDRLoader({
            buildAllPossibleUrls: (id) => {
                let lowerID = id.toLowerCase();
                return [
                    getStoragePrefix() + "ldraw_parts_total/" + lowerID
                ];
            }
        });
        ldrLoader.load(model)
            .subscribe({
                next: (data) => {
                    console.log("next: ", data)
                },
                error: (e) => {
                    console.log(e);
                },
                complete: () => {
                    console.log("Model loaded in " + (new Date() - this.startTime) + "ms.");

                    console.log(ldrLoader);



                    let startTime = new Date();

                    ldrLoader.generate(4, mc);



                    // Find center of drawn model:
                    let b = mc.boundingBox;
                    let elementCenter = new THREE.Vector3();
                    b.getCenter(elementCenter);
                    baseObject.position.set(-elementCenter.x, -elementCenter.y, -elementCenter.z);
                    //baseObject.add(new THREE.Box3Helper(b, 0x0000FF)); // Uncomment if you want to see the bounding box

                    camera.zoom = window.innerWidth / b.min.distanceTo(b.max);
                    // onWindowResize();




                    resizeWindow();

                    console.log("Model rendered in " + (new Date() - startTime) + "ms.");
                }
            });
    }
}

