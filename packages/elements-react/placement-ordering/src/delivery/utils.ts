// @ts-nocheck
/**
 * @synced-from pie-elements/packages/placement-ordering/src/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const haveSameValuesButDifferentOrder = (arr1, arr2) => {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;

    const toSortedJson = (arr) =>
        arr
            .map((item) => JSON.stringify(item))
            .sort();

    const sortedArr1 = toSortedJson(arr1);
    const sortedArr2 = toSortedJson(arr2);

    const hasSameValues = sortedArr1.every((val, i) => val === sortedArr2[i]);
    const hasSameOrder = arr1.every((item, i) =>
        JSON.stringify(item) === JSON.stringify(arr2[i])
    );

    return hasSameValues && !hasSameOrder;
};
