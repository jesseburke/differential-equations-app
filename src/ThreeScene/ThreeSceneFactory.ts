import * as THREE from 'three';
//import {OrbitControls} from 'three-orbitcontrols';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
//import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
//import GLTFExporter from 'three-gltf-exporter';

import LabelMaker from './LabelMaker';

import { pubsub } from '../utils/BaseUtils';
import { LabelStyle, LabelProps, ArrayPoint3 } from '../my-types';

export interface MouseButtons {
    LEFT: THREE.MOUSE;
}

export interface Touches {
    ONE: THREE.TOUCH | THREE.MOUSE;
    TW0: THREE.TOUCH | THREE.MOUSE;
    THREE: THREE.TOUCH | THREE.MOUSE;
}

export interface ControlsData {
    mouseButtons: MouseButtons;
    touches: Touches;
    enableRotate: boolean;
    enablePan: boolean;
    enabled: boolean;
    keyPanSpeed: number;
    screenSpaceSpanning: boolean;
}

export interface ThreeFactoryProps {
    drawCanvas: HTMLCanvasElement;
    labelContainerDiv: HTMLDivElement;
    controlsData: ControlsData;
    clearColor: string;
    alpha: boolean;
}

export default function ThreeSceneFactory({
    drawCanvas,
    labelContainerDiv,
    fixedCameraData,
    clearColor = '#f0f0f0',
    controlsData,
    alpha = true,
    cameraDebug = false,
    height,
    width,
    debugDiv1 = null,
    debugDiv2 = null
}: ThreeFactoryProps) {
    let raycaster = new THREE.Raycaster();

    let isOrthoCamera = false;

    //----------------------------------------
    //
    // set up renderer

    if (!drawCanvas) {
        console.log('useThree was passed a null drawCanvas, and so returned null');
        return;
    }

    let aspectRatio = cameraDebug ? width / (2 * height) : width / height;

    let renderer = new THREE.WebGLRenderer({
        canvas: drawCanvas,
        antialias: true,
        alpha
    });

    renderer.setClearColor(clearColor);
    renderer.setSize(width, height, false);
    //renderer.setPixelRatio(window.devicePixelRatio);

    //----------------------------------------
    //
    // set up scene and camera

    let scene = new THREE.Scene();

    const fov = fixedCameraData.fov || 95;
    const aspect = width! / height!; // the canvas default
    const near = fixedCameraData.near || 0.01;
    const far = fixedCameraData.far || 5000;

    let camera: THREE.Camera | null = null;
    let cameraForDebug: THREE.Camera | null = null;

    const viewHeight = 5; //initCameraData.viewHeight!;

    if (!fixedCameraData.orthographic) {
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        if (cameraDebug) {
            cameraForDebug = new THREE.PerspectiveCamera(fov, aspect, near, far);
        }
    } else {
        isOrthoCamera = true;

        if (!fixedCameraData.aspectRatio) {
            console.log(
                'need to have non-null aspectRatio in fixedCameraData for orthographic camera'
            );
            return;
        }

        // if (!initCameraData.viewHeight) {
        //     console.log('need to have non-null viewHeight in cameraData for orthographic camera');
        //     return;
        // }

        camera = new THREE.OrthographicCamera(
            (viewHeight * aspectRatio) / -2,
            (viewHeight * aspectRatio) / 2,
            viewHeight / 2,
            viewHeight / -2,
            near,
            far
        );

        // convention
        camera.translateZ(50);
        camera.zoom = 0.2;

        if (cameraDebug) {
            cameraForDebug = new THREE.PerspectiveCamera(
                60, // fov
                2, // aspect
                0.1, // near
                500 // far
            );

            cameraForDebug.position.set(0, 0, 10);
            cameraForDebug.lookAt(0, 5, 0);
        }
    }

    if (fixedCameraData.up) {
        camera.up = new THREE.Vector3(...fixedCameraData.up);
    }

    //----------------------------------------
    //
    // set up lights

    const color = 0xffffff;
    let intensity = 0.5;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1000, 1000, 1000);

    if (!scene || !drawCanvas) return;

    scene.add(light);
    const light1 = new THREE.DirectionalLight(color, intensity);
    light1.position.set(1000, -1000, 1000);
    scene.add(light1);

    intensity = 0.5;
    const light2 = new THREE.AmbientLight(color, intensity);
    scene.add(light2);

    //----------------------------------------
    //
    // set up controls

    let controls = new OrbitControls(camera, cameraDebug ? debugDiv1 : drawCanvas);

    // adds all properties of controlsData to controls
    controls = Object.assign(controls, controlsData);
    controls.update();

    // if (initCameraData.center) {
    //     controls.target = new THREE.Vector3(...initCameraData.center, 0);
    //     controls.update();
    // }

    let controls2;

    if (cameraDebug) {
        controls2 = new OrbitControls(cameraForDebug, debugDiv2);
    }

    let cameraHelper = new THREE.CameraHelper(camera);

    const threeToHtmlCoordFuncFactory = (cam) => (coord) => {
        cam.updateProjectionMatrix();

        let temp = new THREE.Vector3(coord[0], coord[1], coord[2]);
        temp.project(cam);

        if (!cameraDebug) {
            return [(temp.x * 0.5 + 0.5) * width, (temp.y * -0.5 + 0.5) * height];
        } else {
            return [((temp.x * 0.5 + 0.5) * width) / 2, (temp.y * -0.5 + 0.5) * height];
        }
    };

    let addLabel, removeLabel, drawLabels;

    if (!cameraDebug) {
        let lm = LabelMaker(labelContainerDiv, threeToHtmlCoordFuncFactory(camera), width, height);

        addLabel = lm.addLabel;
        removeLabel = lm.removeLabel;
        drawLabels = lm.drawLabels;
    } else {
        let lm1 = LabelMaker(debugDiv1, threeToHtmlCoordFuncFactory(camera), width / 2, height);
        let lm2 = LabelMaker(
            debugDiv2,
            threeToHtmlCoordFuncFactory(cameraForDebug),
            width / 2,
            height
        );

        addLabel = (args) => {
            lm1.addLabel(args);
            lm2.addLabel(args);
        };
        removeLabel = () => null;
        drawLabels = (args) => {
            lm1.drawLabels(args);
            lm2.drawLabels(args);
        };
    }

    //----------------------------------------
    //
    // define render function, resize handler, and other basic
    // functions

    const render = () => {
        if (!renderer || !scene || !camera) {
            console.log('render was called in useThree with null renderer, scene or camera');
            return;
        }

        if (!cameraDebug) {
            renderer.render(scene, camera);
            drawLabels();
            return;
        }

        // following is from
        // https://threejsfundamentals.org/threejs/lessons/threejs-cameras.html

        // turn on the scissor
        renderer.setScissorTest(true);

        // render the original view
        {
            const aspect = setScissorForElement(debugDiv1, renderer, drawCanvas);

            // adjust the camera for this aspect
            camera.left = -aspect;
            camera.right = aspect;
            camera.updateProjectionMatrix();
            cameraHelper.update();

            // don't draw the camera helper in the original view
            cameraHelper.visible = false;

            // render
            renderer.render(scene, camera);
        }

        // render from the 2nd camera
        {
            const aspect = setScissorForElement(debugDiv2, renderer, drawCanvas);

            // adjust the camera for this aspect
            cameraForDebug.aspect = aspect;
            cameraForDebug.updateProjectionMatrix();

            // draw the camera helper in the 2nd view
            cameraHelper.visible = true;

            renderer.render(scene, cameraForDebug);
        }

        drawLabels();
    };

    function setScissorForElement(elem, renderer, drawCanvas) {
        const canvasRect = drawCanvas.getBoundingClientRect();
        const elemRect = elem.getBoundingClientRect();

        // compute a canvas relative rectangle
        const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
        const left = Math.max(0, elemRect.left - canvasRect.left);
        const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
        const top = Math.max(0, elemRect.top - canvasRect.top);

        const width = Math.min(canvasRect.width, right - left);
        const height = Math.min(canvasRect.height, bottom - top);

        // setup the scissor to only render to that part of the canvas
        const positiveYUpBottom = canvasRect.height - bottom;
        renderer.setScissor(left, positiveYUpBottom, width, height);
        renderer.setViewport(left, positiveYUpBottom, width, height);

        // return the aspect
        return width / height;
    }

    const handleResize = () => {
        if (!drawCanvas) {
            console.log('handleResize called with null drawCanvas');
            return;
        }

        const mult = 1; //cameraDebug ? 1 : window.devicePixelRatio;

        const newWidth = drawCanvas.clientWidth * mult;
        const newHeight = drawCanvas.clientHeight * mult;

        if (width == newWidth && height == newHeight) return;

        aspectRatio = cameraDebug ? newWidth / (2 * newHeight) : newWidth / newHeight;
        width = newWidth;
        height = newHeight;

        if (!renderer || !camera) {
            console.log('handleResize called with null renderer or null camera');
            return;
        }

        if (!isOrthoCamera) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            controls.update();
        } else {
            renderer.setSize(width, height, false);
            camera.left = (viewHeight * aspectRatio) / -2;
            camera.right = (viewHeight * aspectRatio) / 2;
            camera.top = viewHeight / 2;
            camera.bottom = viewHeight / -2;
            controls.update();
        }
        camera.updateProjectionMatrix();

        render();
        drawLabels();
    };

    function add(threeObj) {
        if (!scene) return;

        scene.add(threeObj);
        render();
    }

    function remove(threeObj) {
        if (!scene) return;

        scene.remove(threeObj);
        render();
    }

    function setCameraPosition(newPosition: ArrayPoint3) {
        if (
            newPosition[0] === camera.position.x &&
            newPosition[1] === camera.position.y &&
            newPosition[2] === camera.position.z
        )
            return;

        camera.position.set(...newPosition);
        camera.updateProjectionMatrix();
        controls.update();
        drawLabels();
        render();
    }

    function setCameraLookAt(newPos: ArrayPoint3) {
        camera.lookAt(...newPos);

        //console.log('camera has been positioned in threeScene.setcameraposition');

        render();
        camera.updateProjectionMatrix();
        controls.update();
        drawLabels();
        render();
        //console.log('threeScene.setcameraposition over');
    }

    drawLabels();
    render();

    //----------------------------------------
    //
    // getMouseCoords and screenToWorldCoords

    // this assumes that the canvas is the entire width of window, and
    // that the botto of the canvas is the botto of the window
    function getMouseCoords(e, mesh: THREE.Mesh) {
        const xperc = e.clientX / drawCanvas.clientWidth;

        // following accounts for top of canvas being potentially
        // different from top of window
        //
        // e.clientY is in terms of the entire window; we want to see
        // how high the canvas is from the top of the window and subtract that.
        // offsetParent gives the closest positioned ancestor element.
        // in this case, the parent of the canvas is the container
        // div, and this is contained in the main component, which is what we want
        const yperc =
            (e.clientY - drawCanvas.offsetParent.offsetParent.offsetTop) / drawCanvas.clientHeight;

        // normalized device coordinates, both in [-1,1]
        const ncoords = new THREE.Vector2(2 * xperc - 1, -2 * yperc + 1);

        raycaster.setFromCamera(ncoords, camera);

        const array = raycaster.intersectObject(mesh);
        return array[0].point;
    }

    const bounds = { xMin: -1000, xMax: 1000, yMax: 1000, yMin: -1000 };

    const { xMin, xMax, yMin, yMax } = bounds;

    const planeGeom = new THREE.PlaneBufferGeometry(xMax - xMin, yMax - yMin, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 'rgba(0, 0, 0, 1)' });

    mat.transparent = true;
    mat.opacity = 0.0;
    mat.side = THREE.DoubleSide;

    const coordPlaneMesh = new THREE.Mesh(planeGeom, mat);

    // following calculates where ray into the screen at (screenX, screenY)
    // intersects mesh

    // is it a bug that coordPlaneMesh is never added to the scene?
    function screenToWorldCoords(screenX: number, screenY: number) {
        if (!coordPlaneMesh) return;

        //const xperc = screenX/ drawCanvas.clientWidth;
        // following accounts for fact that canvas might not be entire window
        //const yperc = (screenY - drawCanvas.offsetParent.offsetTop)/ drawCanvas.clientHeight;
        //const ncoords = [xperc*2 - 1, yperc*2 - 1];

        raycaster.setFromCamera(new THREE.Vector2(screenX, screenY), camera);

        const array = raycaster.intersectObject(coordPlaneMesh);
        return array[0].point;
    }

    //----------------------------------------
    //
    // controls pubsub and other related

    if (controls2) {
        controls2.addEventListener('change', () => {
            render();
        });
    }

    const controlsPubSub = pubsub();
    controlsPubSub.subscribe(drawLabels);

    controls.addEventListener('change', () => {
        let v = new THREE.Vector3(0, 0, 0);
        camera!.getWorldPosition(v);
        controlsPubSub.publish({
            position: v.toArray(),
            zoom: camera.zoom,
            center: controls.target.toArray()
        });
        render();
        drawLabels();
    });

    if (cameraDebug) {
        controlsPubSub.subscribe(() => cameraHelper.update());
        scene.add(cameraHelper);
    }

    //----------------------------------------
    //
    // other...

    function exportGLTF(onCompleted, options) {
        // const exporter = new GLTFExporter();
        // exporter.parse(scene, onCompleted, options);
    }

    function downloadGLTF(filename, options) {
        // function callback(gltf) {
        //     const link = document.createElement('a');
        //     link.style.display = 'none';
        //     document.body.appendChild(link);
        //     function save(blob, filename) {
        //         link.href = URL.createObjectURL(blob);
        //         link.download = filename;
        //         link.click();
        //         // URL.revokeObjectURL( url ); breaks Firefox...
        //     }
        //     function saveString(text, filename) {
        //         save(new Blob([text], { type: 'text/plain' }), filename);
        //     }
        //     const output = JSON.stringify(gltf, null, 2);
        //     saveString(output, filename + '.gltf');
        // }
        // exportGLTF(callback, (options = { onlyVisible: false }));
    }

    const downloadPicture = () => {
        renderer.render(scene, camera, null, false);

        const dataURL = renderer.domElement.toDataURL('image/png');

        downloadPictureFromDataURL(dataURL);
    };

    // dragCB is called with one argument, event, and event.object is the mesh that is being dragged
    function addDrag({ mesh, dragCB = null, dragstartCB = null, dragendCB = null }) {
        const dragControls = new DragControls([mesh], camera, renderer.domElement);

        dragControls.addEventListener('dragstart', () => (controls.enabled = false));
        dragControls.addEventListener('dragend', () => (controls.enabled = true));

        if (dragstartCB) {
            dragControls.addEventListener('dragstart', dragstartCB);
        }

        if (dragCB) {
            dragControls.addEventListener('drag', dragCB);
        }

        if (dragendCB) {
            dragControls.addEventListener('dragend', dragendCB);
        }

        return dragControls.dispose;
    }

    const getCamera = () => camera;

    const setCameraZoom = (newZoom) => {
        if (newZoom === camera.zoom) return;

        camera.zoom = newZoom;
        camera.updateProjectionMatrix();

        controls.update();
        render();
        drawLabels;
    };

    const resetControls = () => {
        controls.reset();
        controls.update();

        // should also reset camera?
    };

    const changeControls = (newControlsData: ControlsData) => {
        controls = Object.assign(controls, newControlsData);
        controls.update();
        render();
        drawLabels();
    };

    const getControlsTarget = () => controls.target;

    const setControlsTarget = ([x, y, z]) => {
        const t = controls.target;

        if (x === t.x && y === t.y && z === t.z) return;

        controls.target = new THREE.Vector3(x, y, z);
        controls.update();
        render();
        drawLabels();
    };

    const getCanvas = () => drawCanvas;

    const cleanUp = () => {
        if (resizeObserver && drawCanvas) resizeObserver.unobserve(drawCanvas);

        if (renderer) renderer.renderLists.dispose();

        if (labelContainerDiv) {
            while (labelContainerDiv.firstChild) {
                labelContainerDiv.removeChild(labelContainerDiv.firstChild);
            }
        }

        if (controls) controls.dispose();

        if (planeGeom) planeGeom.dispose();
    };

    return {
        add,
        remove,
        render,
        addLabel,
        removeLabel,
        drawLabels,
        setCameraPosition,
        setCameraLookAt,
        setCameraZoom,
        getCamera,
        exportGLTF,
        downloadGLTF,
        downloadPicture,
        screenToWorldCoords,
        getMouseCoords,
        handleResize,
        resetControls,
        changeControls,
        getControlsTarget,
        setControlsTarget,
        controlsPubSub,
        addDrag,
        getCanvas,
        cleanUp
    };
}

//------------------------------------------------------------------------
//
// photo helper functions

// code is from:
// https://discourse.threejs.org/t/what-is-the-alternative-to-take-high-resolution-picture-rather-than-take-canvas-screenshot/3209

// argument to following is usually gotten as follows:
// renderer.render(scene, camera, null, false);
// const dataURL = renderer.domElement.toDataURL('image/png');

function downloadPictureFromDataURL(dataURL) {
    // save
    saveDataURI(defaultFileName('.png'), dataURL);

    // reset to old dimensions (cheat version)
    // handleResize();
}

function saveDataURI(name, dataURI) {
    const blob = dataURIToBlob(dataURI);

    // force download
    const link = document.createElement('a');
    link.download = name;
    link.href = window.URL.createObjectURL(blob);
    link.onclick = () => {
        window.setTimeout(() => {
            window.URL.revokeObjectURL(blob);
            link.removeAttribute('href');
        }, 500);
    };
    link.click();
}

function dataURIToBlob(dataURI) {
    const binStr = window.atob(dataURI.split(',')[1]);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
    }
    return new window.Blob([arr]);
}

function defaultFileName(ext) {
    const str = `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}${ext}`;
    return str.replace(/\//g, '-').replace(/:/g, '.');
}
