import React, { useState, useRef, useEffect, useCallback } from 'react';

import { atom, useAtom } from 'jotai';
import { atomWithReset } from 'jotai/utils';

import classnames from 'classnames';
import styles from './BoundsData.module.css';

import queryString from 'query-string-esm';

import Input from '../components/Input.jsx';

import { diffObjects } from '../utils/BaseUtils.jsx';

export default function LabelData({ xLabel = 'x', yLabel = 'y', zLabel = 'z', twoD = 0 } = {}) {
    const initLabels = { x: xLabel, y: yLabel, z: zLabel };

    const encode = (newObj) => {
        const { x, y, z } = diffObjects(newObj, initLabels);

        let ro = {};

        if (x) ro.x = x;
        if (y) ro.y = y;
        if (z) ro.z = z;

        return queryString.stringify(ro);
    };

    const decode = (objStr) => {
        if (!objStr || !objStr.length || objStr.length === 0) return initLabels;

        const rawObj = queryString.parse(objStr);

        const newKeys = Object.keys(rawObj);

        const ro = {};

        if (newKeys.includes('x')) ro.x = rawObj.x;
        if (newKeys.includes('y')) ro.y = rawObj.y;
        if (newKeys.includes('z')) ro.z = rawObj.z;

        return { ...initLabels, ...ro };
    };

    const labelAtom = atom(initLabels);

    const resetAtom = atom(null, (get, set) => {
        set(labelAtom, initLabels);
    });

    const component = React.memo(function LabelInput({}) {
        const [{ x, y, z }, setLabels] = useAtom(labelAtom);

        const xCB = useCallback((inputStr) => setLabels((old) => ({ ...old, x: inputStr })), [
            setLabels
        ]);
        const yCB = useCallback((inputStr) => setLabels((old) => ({ ...old, y: inputStr })), [
            setLabels
        ]);
        const zCB = useCallback((inputStr) => setLabels((old) => ({ ...old, z: inputStr })), [
            setLabels
        ]);

        return (
            <div className={classnames(styles['center-flex-column'], styles['med-padding'])}>
                <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                    <span className={styles['text-align-center']}>Dependent variable:</span>
                    <span className={styles['med-padding']}>
                        <Input size={4} initValue={z} onC={zCB} />
                    </span>
                </div>
                <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                    <span className={styles['text-align-center']}>Independent variable 1</span>
                    <span className={styles['med-padding']}>
                        <Input size={4} initValue={x} onC={xCB} />
                    </span>
                </div>
                <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                    <span className={styles['text-align-center']}>Independent variable 2</span>
                    <span className={styles['med-padding']}>
                        <Input size={4} initValue={y} onC={yCB} />
                    </span>
                </div>
            </div>
        );
    });

    const component2d = React.memo(function LabelInput({}) {
        const [{ x, y, z }, setLabels] = useAtom(labelAtom);

        const xCB = useCallback((inputStr) => setLabels((old) => ({ ...old, x: inputStr })), [
            setLabels
        ]);
        const yCB = useCallback((inputStr) => setLabels((old) => ({ ...old, y: inputStr })), [
            setLabels
        ]);

        return (
            <div className={classnames(styles['center-flex-column'], styles['med-padding'])}>
                <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                    <span className={styles['text-align-center']}>Dependent variable:</span>
                    <span className={styles['med-padding']}>
                        <Input size={4} initValue={y} onC={yCB} />
                    </span>
                </div>
                <div className={classnames(styles['center-flex-row'], styles['med-padding'])}>
                    <span className={styles['text-align-center']}>Independent variable</span>
                    <span className={styles['med-padding']}>
                        <Input size={4} initValue={x} onC={xCB} />
                    </span>
                </div>
            </div>
        );
    });

    return {
        atom: labelAtom,
        resetAtom,
        component: twoD ? component2d : component,
        encode,
        decode
    };
}