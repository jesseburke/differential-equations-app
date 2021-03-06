import React, { useEffect, useRef } from 'react';
import { useAtom, atom } from 'jotai';

import '../styles.css';

export default function CameraControls({ cameraDataAtom, classStr, threeCBs }) {
    const [cameraData, setCameraData] = useAtom(cameraDataAtom);

    useEffect(() => {
        if (!threeCBs) return;

        const center = cameraData.center;
        //console.log('cameraData.center = ', center);

        threeCBs.setControlsTarget(center);
    }, [threeCBs, cameraData.center]);

    useEffect(() => {
        if (!threeCBs) return;

        const zoom = cameraData.zoom;
        //console.log('cameraData.zoom = ', zoom);

        threeCBs.setCameraZoom(zoom);
    }, [threeCBs, cameraData.zoom]);

    useEffect(() => {
        if (!threeCBs) return;

        const position = cameraData.position;
        //console.log('cameraData.position = ', position);

        threeCBs.setCameraPosition(position);
    }, [threeCBs, cameraData.position]);

    useEffect(() => {
        if (!threeCBs) return;

        threeCBs.controlsPubSub.subscribe((newData) => {
            //console.log('subscribe funtion called with newData = ', newData);
            setCameraData(newData);
        });
    }, [threeCBs]);

    return null;
}
