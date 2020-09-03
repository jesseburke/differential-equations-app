import React, { useState, useRef, useEffect, useCallback } from 'react';
import Recoil from 'recoil';
const { RecoilRoot, atom, selector, useRecoilValue, useRecoilState, useSetRecoilState } = Recoil;

import * as THREE from 'three';

import { useDialogState, Dialog, DialogDisclosure } from 'reakit/Dialog';
import { Button } from 'reakit/Button';
import { Portal } from 'reakit/Portal';
import { Provider } from 'reakit/Provider';
import { useTabState, Tab, TabList, TabPanel } from 'reakit/Tab';
import { Checkbox } from 'reakit/Checkbox';

import * as system from 'reakit-system-bootstrap';

import classnames from 'classnames';
import styles from './App_modal_test.module.css';

import { ThreeSceneComp } from '../../components/ThreeScene.jsx';
import ControlBar from '../../components/ControlBar.jsx';
import Main from '../../components/Main.jsx';
import SepEquationInput from '../../components/SepEquationInput.jsx';
import ClickablePlaneComp from '../../components/RecoilClickablePlaneComp.jsx';
import InitialPointInput from '../../components/InitialPointInput.jsx';
import FullScreenBaseComponent from '../../components/FullScreenBaseComponent.jsx';
import Input from '../../components/Input.jsx';
import BoundsInput from '../../components/BoundsInput.jsx';

import funcParser from '../../utils/funcParser.jsx';

import GridAndOrigin from '../../ThreeSceneComps/GridAndOrigin.jsx';
import Axes2D from '../../ThreeSceneComps/Axes2D.jsx';
import ArrowGrid from '../../ThreeSceneComps/ArrowGridRecoil.jsx';
import DirectionFieldApprox from '../../ThreeSceneComps/DirectionFieldApproxRecoil.jsx';
import Sphere from '../../ThreeSceneComps/SphereRecoil.jsx';

import { fonts, labelStyle } from './constants.jsx';

//------------------------------------------------------------------------
//
// initial data
//

const initColors = {
    solution: '#C2374F',
    firstPt: '#C2374F',
    secPt: '#C2374F',
    testFunc: '#E16962', //#DBBBB0',
    axes: '#0A2C3C',
    controlBar: '#0A2C3C',
    clearColor: '#f0f0f0'
};

const initControlsData = {
    mouseButtons: { LEFT: THREE.MOUSE.ROTATE },
    touches: { ONE: THREE.MOUSE.PAN, TWO: THREE.TOUCH.DOLLY, THREE: THREE.MOUSE.ROTATE },
    enableRotate: false,
    enablePan: true,
    enabled: true,
    keyPanSpeed: 50,
    screenSpaceSpanning: false
};

const aspectRatio = window.innerWidth / window.innerHeight;
const frustumSize = 20;

const initCameraData = {
    position: [0, 0, 1],
    up: [0, 0, 1],
    //fov: 75,
    near: -100,
    far: 100,
    rotation: { order: 'XYZ' },
    orthographic: {
        left: (frustumSize * aspectRatio) / -2,
        right: (frustumSize * aspectRatio) / 2,
        top: frustumSize / 2,
        bottom: frustumSize / -2
    }
};

// percentage of screen appBar will take (at the top)
// (should make this a certain minimum number of pixels?)
const controlBarHeight = 13;

// (relative) font sizes (first in em's)
const fontSize = 1;
const controlBarFontSize = 1;

const initAxesData = {
    radius: 0.01,
    show: true,
    showLabels: true,
    labelStyle
};

const ipAtom = atom({
    key: 'initialPosition',
    default: { x: 2, y: 2 }
});

const xselector = selector({
    key: 'xselector',
    set: ({ get, set }, newX) => set(ipAtom, { x: Number(newX), y: get(ipAtom).y })
});

const yselector = selector({
    key: 'yselector',
    set: ({ get, set }, newY) => set(ipAtom, { y: Number(newY), x: get(ipAtom).x })
});

const initXFuncStr = 'x';
const initYFuncStr = 'cos(y)';

const funcAtom = atom({
    key: 'function',
    default: { func: funcParser('(' + initXFuncStr + ')*(' + initYFuncStr + ')') }
});

const arrowDensityAtom = atom({
    key: 'arrow density',
    default: 1
});

const arrowLengthAtom = atom({
    key: 'arrow length',
    default: 0.75
});

const arrowColorAtom = atom({
    key: 'arrow color',
    default: '#C2374F'
});

const solutionVisibleAtom = atom({
    key: 'solution visible',
    default: true
});

const solutionVisibleSelector = selector({
    key: 'solution visible selector',
    set: ({ get, set }) => {
        set(solutionVisibleAtom, !get(solutionVisibleAtom));
    }
});

const boundsAtom = atom({
    key: 'bounds',
    default: { xMin: -20, xMax: 20, yMin: -20, yMax: 20 }
});

const initState = {
    bounds: { xMin: -20, xMax: 20, yMin: -20, yMax: 20 },
    approxH: 0.1
};

//------------------------------------------------------------------------

export default function App() {
    return (
        <RecoilRoot>
            <Provider unstable_system={system}>
                <FullScreenBaseComponent backgroundColor={initColors.controlBar} fonts={fonts}>
                    <ControlBar
                        height={controlBarHeight}
                        fontSize={fontSize * controlBarFontSize}
                        padding='0em'
                    >
                        <SepEquationInput
                            funcAtom={funcAtom}
                            initXFuncStr={initXFuncStr}
                            initYFuncStr={initYFuncStr}
                        />
                        <InitialPointInput
                            ipAtom={ipAtom}
                            xselector={xselector}
                            yselector={yselector}
                        />
                        <OptionsModal />
                    </ControlBar>

                    <Main height={100 - controlBarHeight} fontSize={fontSize * controlBarFontSize}>
                        <ThreeSceneComp
                            initCameraData={initCameraData}
                            controlsData={initControlsData}
                        >
                            <GridAndOrigin
                                gridQuadSize={initAxesData.length}
                                gridShow={initState.gridShow}
                            />
                            <Axes2D
                                bounds={initState.bounds}
                                radius={initAxesData.radius}
                                show={initAxesData.show}
                                showLabels={initAxesData.showLabels}
                                labelStyle={labelStyle}
                                color={initColors.axes}
                            />
                            <ArrowGrid
                                funcAtom={funcAtom}
                                boundsAtom={boundsAtom}
                                arrowDensityAtom={arrowDensityAtom}
                                arrowLengthAtom={arrowLengthAtom}
                                arrowColorAtom={arrowColorAtom}
                            />
                            <DirectionFieldApprox
                                color={initColors.solution}
                                initialPtAtom={ipAtom}
                                bounds={initState.bounds}
                                boundsAtom={boundsAtom}
                                funcAtom={funcAtom}
                                approxH={initState.approxH}
                                visibleAtom={solutionVisibleAtom}
                            />
                            <Sphere
                                color={initColors.solution}
                                dragPositionAtom={ipAtom}
                                radius={0.25}
                                visibleAtom={solutionVisibleAtom}
                            />
                            <ClickablePlaneComp clickPositionAtom={ipAtom} />
                        </ThreeSceneComp>
                    </Main>
                </FullScreenBaseComponent>
            </Provider>
        </RecoilRoot>
    );
}

function OptionsModal() {
    const dialog = useDialogState();
    const tab = useTabState();

    return (
        <>
            <DialogDisclosure
                style={{ backgroundColor: 'white', color: initColors.controlBar }}
                {...dialog}
            >
                <span style={{ width: '8em' }}>
                    {!dialog.visible ? 'Show options' : 'Hide options'}
                </span>
            </DialogDisclosure>
            <Dialog
                {...dialog}
                style={{
                    transform: 'none',
                    top: '15%',
                    left: 'auto',
                    right: 20,
                    width: 300,
                    height: 400
                }}
                aria-label='Welcome'
            >
                <>
                    <TabList {...tab} aria-label='Option tabs'>
                        <Tab {...tab}>Arrow grid</Tab>
                        <Tab {...tab}>Solution curve</Tab>
                        <Tab {...tab}>Bounds</Tab>
                    </TabList>
                    <TabPanel {...tab}>
                        <ArrowGridOptions
                            arrowDensityAtom={arrowDensityAtom}
                            arrowLengthAtom={arrowLengthAtom}
                            arrowColorAtom={arrowColorAtom}
                        />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <SolutionCurveOptions
                            solutionVisibleAtom={solutionVisibleAtom}
                            svSelector={solutionVisibleSelector}
                        />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <BoundsOptions boundsAtom={boundsAtom} />
                    </TabPanel>
                </>
            </Dialog>
        </>
    );
}

function ArrowGridOptions({ arrowDensityAtom, arrowLengthAtom, arrowColorAtom }) {
    const [ad, setAd] = useRecoilState(arrowDensityAtom);
    const [al, setAl] = useRecoilState(arrowLengthAtom);
    const [ac, setAc] = useRecoilState(arrowColorAtom);

    const adCb = useCallback((inputStr) => setAd(Number(inputStr)), [setAd]);
    const alCb = useCallback((inputStr) => setAl(Number(inputStr)), [setAl]);
    const acCb = useCallback((e) => setAc(e.target.value), [setAc]);

    return (
        <div className={classnames(styles['center-flex-column'], styles['med-padding'])}>
            <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                <span className={styles['text-align-center']}>Arrows per unit:</span>
                <span className={styles['med-padding']}>
                    <Input size={4} initValue={ad} onC={adCb} />
                </span>
            </div>

            <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                <span className={styles['text-align-center']}>Relative arrow length:</span>
                <span className={styles['med-padding']}>
                    <Input size={4} initValue={al} onC={alCb} />
                </span>
            </div>

            <div>
                <input type='color' name='color' id='color' value={ac} onChange={acCb} />
            </div>
        </div>
    );
}

function SolutionCurveOptions({ solutionVisibleAtom, svSelector }) {
    const checked = useRecoilValue(solutionVisibleAtom);

    const toggle = useSetRecoilState(svSelector);

    return (
        <label>
            <Checkbox checked={checked} onChange={toggle} />
            <span className={styles['med-margin']}>Show solution curve</span>
        </label>
    );
}

function BoundsOptions({ boundsAtom }) {
    const [bounds, setBounds] = useRecoilState(boundsAtom);

    const cb = useCallback(() => null, []);

    return <BoundsInput bounds={bounds} onChange={cb} />;
}
