import React, { useState, useRef, useEffect, useCallback } from 'react';

import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import gsap from 'gsap';

import { Helmet } from 'react-helmet';

import styles from './App.module.css';

import ControlBar from '../../components/ControlBar.jsx';
import Main from '../../components/Main.jsx';
import FullScreenBaseComponent from '../../components/FullScreenBaseComponent.jsx';
import { ThreeSceneComp, useThreeCBs } from '../../components/ThreeScene.jsx';
import { FunctionAndBoundsInputXT as FunctionAndBoundsInput } from '../../components/FunctionAndBoundsInput.jsx';

import TGGridAndOrigin from '../../TG/TGGridAndOrigin.jsx';
import use3DAxes from '../../graphics/use3DAxes.jsx';
import FunctionGraph3DGeom from '../../graphics/FunctionGraph3DGeom.jsx';
import CurvedPathCanvas from '../../graphics/CurvedPathCanvas.jsx';
import use2DAxes from '../../graphics/use2DAxesCanvas.jsx';

import FunctionGraphPts2D from '../../math/FunctionGraphPts2D.jsx';

import { funcParserXT as funcParser } from '../../utils/funcParser.jsx';

//------------------------------------------------------------------------
//
// initial data
//

const initColors = {
    arrows: '#C2374F',
    plane: '#82BFCD',
    axes: '#181A2A', //0A2C3C',
    controlBar: '#181A2A', //0A2C3C',
    clearColor: '#f0f0f0',
    funcGraph: '#E53935'
};

const initFuncStr = '4*e^(-(x-2*t)^2)+sin(x+t)-cos(x-t)'; //'2*e^(-(x-t)^2)+sin(x+t)-cos(x-t)';//'2*e^(-(x-t)^2)';

// while it's assumed xMin and tMin are zero; it's handy to keep them around to not break things
const initBounds = { xMin: 0, xMax: 10, tMin: 0, tMax: 10, zMin: -5, zMax: 5 };

const xLength = initBounds.xMax;
const tLength = initBounds.tMax;

const initCameraData = {
    position: [(15.7 / 20) * xLength, -(13.1 / 20) * tLength, 9.79], //[40, 40, 40],
    up: [0, 0, 1]
};

const initState = {
    bounds: initBounds,
    funcStr: initFuncStr,
    func: funcParser(initFuncStr),
    gridShow: true,
    cameraData: Object.assign({}, initCameraData)
};

const initControlsData = {
    mouseButtons: { LEFT: THREE.MOUSE.ROTATE },
    touches: { ONE: THREE.MOUSE.ROTATE, TWO: THREE.DOLLY_PAN, THREE: THREE.MOUSE.PAN },
    enableRotate: true,
    enablePan: true,
    enabled: true,
    keyPanSpeed: 50,
    screenSpaceSpanning: false,
    target: new THREE.Vector3(
        (initBounds.xMax - initBounds.xMin) * (10.15 / 20),
        (initBounds.tMax - initBounds.tMin) * (4.39 / 20),
        0
    )
};

const fonts = "'Helvetica', 'Hind', sans-serif";

// percentage of sbcreen appBar will take (at the top)
// (should make this a certain minimum number of pixels?)
const controlBarHeight = 15;

// (relative) font sizes (first in em's)
const initFontSize = 1;
const percControlBar = 1.25;
const percDrawer = 0.85;

const labelStyle = {
    color: initColors.controlBar,
    margin: '0em',
    padding: '.15em',
    fontSize: '1.25em'
};

const axesData = { show: true, showLabels: true, length: 10, radius: 0.05 };

const overhang = 2;
const canvasXOverhang = 1;

// what percentage of the horizontal window the threeScene fills
const initThreeWidth = 50;

//------------------------------------------------------------------------

export default function App() {
    const [state, setState] = useState(Object.assign({}, initState));

    const [bounds, setBounds] = useState(initState.bounds);

    const threeSceneRef = useRef(null);
    const canvasRef = useRef(null);

    // following can be passed to components that need to draw
    const threeCBs = useThreeCBs(threeSceneRef);

    //------------------------------------------------------------------------
    //
    // init effects

    const gridCenter = useRef([axesData.length - overhang, axesData.length - overhang]);

    // useGridAndOrigin({
    //     threeCBs,
    //     gridQuadSize: axesData.length,
    //     gridShow: initState.gridShow,
    //     originRadius: 0,
    //     center: gridCenter.current
    // });

    const axesBounds = useRef({
        xMin: -overhang,
        xMax: bounds.xMax + overhang,
        yMin: -overhang,
        yMax: bounds.tMax + overhang,
        zMin: bounds.zMin,
        zMax: bounds.zMax
    });

    useEffect(() => {
        axesBounds.current = {
            xMin: -overhang,
            xMax: bounds.xMax + overhang,
            yMin: -overhang,
            yMax: bounds.tMax + overhang,
            zMin: bounds.zMin,
            zMax: bounds.zMax
        };
    }, [bounds]);

    const yLabelRef = useRef('t');

    use3DAxes({
        threeCBs,
        bounds: axesBounds.current,
        radius: axesData.radius,
        show: axesData.show,
        showLabels: axesData.showLabels,
        labelStyle,
        yLabel: yLabelRef.current,
        color: initColors.axes
    });

    //------------------------------------------------------------------------
    //
    // funcGraph effect

    useEffect(() => {
        if (!threeCBs) return;

        const geometry = FunctionGraph3DGeom({
            func: state.func,
            bounds: { ...bounds, yMin: bounds.tMin, yMax: bounds.tMax },
            meshSize: 200
        });

        const material = new THREE.MeshNormalMaterial({
            color: initColors.funcGraph,
            side: THREE.DoubleSide
        });
        material.shininess = 0;
        //material.transparent = true;
        //material.opacity = .6;
        //material.wireframe = true;

        BufferGeometryUtils.computeTangents(geometry);

        const mesh = new THREE.Mesh(geometry, material);
        threeCBs.add(mesh);

        const helper = new THREE.VertexNormalsHelper(mesh, 0.25, 0x000000, 10);
        //threeCBs.add(helper);

        //const helper1 = new VertexTangentsHelper( mesh, .25, 0x000000, 10 );
        //threeCBs.add(helper1);

        return () => {
            threeCBs.remove(mesh);
            geometry.dispose();
            material.dispose();
        };
    }, [threeCBs, state.func, bounds]);

    //------------------------------------------------------------------------
    //
    // callbacks

    const funcAndBoundsInputCB = useCallback((newBounds, newFuncStr) => {
        setState(({ bounds, func, funcStr, ...rest }) => ({
            funcStr: newFuncStr,
            func: funcParser(newFuncStr),
            bounds: newBounds,
            ...rest
        }));
    }, []);

    return (
        <FullScreenBaseComponent backgroundColor={initColors.controlBar} fonts={fonts}>
            <Helmet>
                <title>Vibrating string</title>
                <meta name='viewport' content='width=device-width, user-scalable=no' />
            </Helmet>

            <ControlBar height={controlBarHeight} fontSize={initFontSize * percControlBar}>
                <FunctionAndBoundsInput
                    onChangeFunc={funcAndBoundsInputCB}
                    initFuncStr={state.funcStr}
                    initBounds={bounds}
                    leftSideOfEquation='s(x,t) ='
                />
            </ControlBar>

            <Main height={100 - controlBarHeight} fontSize={initFontSize * percDrawer}>
                <ThreeSceneComp
                    ref={threeSceneRef}
                    initCameraData={initCameraData}
                    controlsData={initControlsData}
                    width={initThreeWidth.toString() + '%'}>
                    <TGGridAndOrigin
                        gridQuadSize={axesData.length}
                        gridShow={initState.gridShow}
                        originRadius={0}
                        center={gridCenter.current}
                    />
                </ThreeSceneComp>
            </Main>
        </FullScreenBaseComponent>
    );
}
