import React, { useEffect, useLayoutEffect, useState } from 'react';

import { atom, useAtom, PrimitiveAtom } from 'jotai';

import * as THREE from 'three';

import DirectionFieldApproxGeom from '../graphics/DirectionFieldApprox.jsx';
import Sphere from './SphereRecoil.jsx';

import { ArrayPoint2, Bounds2, CurveData2 } from '../my-types';

export interface DirectionFieldApproxProps {
    threeCBs?: Function;
    funcAtom: PrimitiveAtom<Function>;
    initialPointAtom: PrimitiveAtom<ArrayPoint2>;
    boundsAtom: PrimitiveAtom<Bounds2>;
    curveDataAtom: PrimitiveAtom<CurveData2>;
    radius: number;
}

export default function DirectionFieldApprox({
    threeCBs,
    funcAtom,
    initialPointAtom = null,
    boundsAtom,
    curveDataAtom,
    radius = 0.05
}) {
    const [mat, setMat] = useState();

    const [meshState, setMeshState] = useState();

    const initialPt = useAtom(initialPointAtom)[0];

    const func = useAtom(funcAtom)[0];

    const bounds = useAtom(boundsAtom)[0];

    const { visible, color, approxH, width } = useAtom(curveDataAtom)[0];

    const sphereColorAtom = atom((get) => get(curveDataAtom).color);

    useEffect(() => {
        setMat(
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                side: THREE.FrontSide,
                transparent: true,
                opacity: 0.6
            })
        );

        return () => {
            if (mat) mat.dispose();
        };
    }, [color]);

    useEffect(() => {
        if (!threeCBs) {
            setMeshState((s) => s);
            return;
        }

        if (!visible) {
            threeCBs.remove(meshState);
            setMeshState(null);
            return;
        }

        const dfag = DirectionFieldApproxGeom({
            func: func.func,
            initialPt: [initialPt.x, initialPt.y],
            bounds,
            h: approxH,
            radius: width
        });

        const mesh = new THREE.Mesh(dfag, mat);

        threeCBs.add(mesh);
        setMeshState(mesh);

        return () => {
            threeCBs.remove(mesh);
            if (dfag) dfag.dispose();
            if (mat) mat.dispose();
        };
    }, [threeCBs, initialPt, bounds, func, width, approxH, mat, radius, visible]);

    return visible ? (
        <Sphere
            threeCBs={threeCBs}
            colorAtom={sphereColorAtom}
            dragPositionAtom={initialPointAtom}
            radius={(0.25 * width) / 0.1}
        />
    ) : null;
}