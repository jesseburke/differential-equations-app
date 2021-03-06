import React, { useState, useRef, useEffect, useCallback } from 'react';

import { Provider as JotaiProvider } from 'jotai';

import * as THREE from 'three';

import { useDialogState, Dialog, DialogDisclosure } from 'reakit/Dialog';
import { Provider as ReakitProvider } from 'reakit/Provider';
import { useTabState, Tab, TabList, TabPanel } from 'reakit/Tab';
import * as system from 'reakit-system-bootstrap';

import './styles.css';

import { ThreeSceneComp } from './components/ThreeScene';

import Grid from './ThreeScene/Grid';
import Axes2D from './ThreeScene/Axes2D.jsx';
import ArrowGrid from './ThreeScene/ArrowGrid.jsx';
import IntegralCurve from './ThreeScene/IntegralCurve';
import CameraControls from './ThreeScene/CameraControls.jsx';

import {
    arrowGridDataAtom,
    boundsAtom,
    initialPointAtom,
    diffEqAtom,
    labelAtom,
    solutionCurveDataAtom,
    axesDataAtom,
    orthoCameraDataAtom,
    zHeightAtom,
    DataComp
} from './atoms';

const initControlsData = {
    mouseButtons: { LEFT: THREE.MOUSE.PAN },
    touches: { ONE: THREE.MOUSE.PAN, TWO: THREE.TOUCH.DOLLY_PAN },
    enableRotate: true,
    enablePan: true,
    enabled: true,
    keyPanSpeed: 50,
    zoomSpeed: 2,
    screenSpacePanning: true
};

const aspectRatio = window.innerWidth / window.innerHeight;

const fixedCameraData = {
    up: [0, 1, 0],
    near: 0.1,
    far: 100,
    aspectRatio,
    orthographic: true
};

const btnClassStr =
    'absolute left-8 p-2 border med:border-2 rounded-md border-solid border-persian_blue-900 bg-gray-200 cursor-pointer text-lg';

const saveBtnClassStr = btnClassStr + ' bottom-40';

const resetBtnClassStr = btnClassStr + ' bottom-24';

/* const photoBtnClassStr = btnClassStr + ' bottom-8'; */

const photoButtonClassStr = btnClassStr + ' bottom-8';

//------------------------------------------------------------------------

export default function App() {
    return (
        <JotaiProvider>
            <div className='full-screen-base'>
                <header
                    className='control-bar bg-persian_blue-900 font-sans
		    p-8 text-white'
                >
                    <diffEqAtom.component />
                    <initialPointAtom.component />
                    <ReakitProvider unstable_system={system}>
                        <OptionsModal />
                    </ReakitProvider>
                </header>

                <main className='flex-grow relative p-0'>
                    <ThreeSceneComp
                        fixedCameraData={fixedCameraData}
                        controlsData={initControlsData}
                        cameraDataAtom={orthoCameraDataAtom}
                        photoButton={true}
                        photoButtonClassStr={photoButtonClassStr}
                    >
                        <Axes2D
                            tickLabelDistance={1}
                            boundsAtom={boundsAtom}
                            axesDataAtom={axesDataAtom}
                            labelAtom={labelAtom}
                        />
                        <Grid boundsAtom={boundsAtom} gridShow={true} />
                        <ArrowGrid
                            diffEqAtom={diffEqAtom}
                            boundsAtom={boundsAtom}
                            arrowGridDataAtom={arrowGridDataAtom}
                            zHeightAtom={zHeightAtom}
                        />
                        <IntegralCurve
                            initialPointAtom={initialPointAtom}
                            boundsAtom={boundsAtom}
                            diffEqAtom={diffEqAtom}
                            curveDataAtom={solutionCurveDataAtom}
                            zHeightAtom={zHeightAtom}
                        />

                        <CameraControls classStr={photoButtonClassStr} />
                    </ThreeSceneComp>
                    <DataComp
                        resetBtnClassStr={resetBtnClassStr}
                        saveBtnClassStr={saveBtnClassStr}
                    />
                </main>
            </div>
        </JotaiProvider>
    );
}

function OptionsModal() {
    const dialog = useDialogState({ modal: false });
    const tab = useTabState();

    useEffect(() => {
        window.dispatchEvent(new Event('resize'));
    });

    const cssRef = useRef({
        transform: 'none',
        top: '15%',
        left: 'auto',
        backgroundColor: 'white',
        right: 20,
        width: 600,
        height: 300
    });

    const cssRef1 = useRef({
        backgroundColor: 'white',
        color: '#0A2C3C'
    });

    return (
        <div zindex={-10} className='text-sm'>
            <DialogDisclosure style={cssRef1.current} {...dialog}>
                <span className='w-32'>{!dialog.visible ? 'Show options' : 'Hide options'}</span>
            </DialogDisclosure>
            <Dialog
                {...dialog}
                style={cssRef.current}
                aria-label='Options'
                hideOnClickOutside={false}
            >
                <>
                    <TabList {...tab} aria-label='Option tabs'>
                        <Tab {...tab}>Arrow grid</Tab>
                        <Tab {...tab}>Axes</Tab>
                        <Tab {...tab}>Bounds</Tab>
                        <Tab {...tab}>Camera Options</Tab>
                        <Tab {...tab}>Solution curve</Tab>
                        <Tab {...tab}>Variable labels</Tab>
                    </TabList>
                    <TabPanel {...tab}>
                        <arrowGridDataAtom.component />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <axesDataAtom.component />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <boundsAtom.component />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <orthoCameraDataAtom.component />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <solutionCurveDataAtom.component />
                    </TabPanel>
                    <TabPanel {...tab}>
                        <labelAtom.component />
                    </TabPanel>
                </>
            </Dialog>
        </div>
    );
}
