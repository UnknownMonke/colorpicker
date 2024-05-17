import { converter } from "../lib/converter";

/**
 * Configure Jest for ECMAScript modules (2024) :
 * 
 * - Add "type": "module" to package.json to treat all .js files as modules.
 * - Add "jest": { "transform": {}, ... } to package.json to prevent Jest from converting modules to CommonJS modules.
 * - Enable experimental feature in scripts : "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js".
 */

describe('rgb_to_hsv tests', () => {
    test('rgb to hsv white', () => {
        const rgb = {r: 255, g: 255, b: 255};
        expect(converter.rgb_to_hsv(rgb)).toEqual({h: 0, s: 0, v: 1});
    });

    test('rgb to hsv black', () => {
        const rgb = {r: 0, g: 0, b: 0};
        expect(converter.rgb_to_hsv(rgb)).toEqual({h: 0, s: 0, v: 0});
    });

    test('rgb to hsv 1', () => {
        const rgb = {r: 28, g: 206, b: 55};
        const hsv = converter.rgb_to_hsv(rgb);
        // Rounding floats.
        expect(Math.round(hsv.h)).toBe(129);
        expect(Math.round(hsv.s * 100)).toBe(86);
        expect(Math.round(hsv.v * 100)).toBe(81);
    });

    test('rgb to hsv 2', () => {
        const rgb = {r: 78, g: 92, b: 140};
        const hsv = converter.rgb_to_hsv(rgb);
        // Rounding floats.
        expect(Math.round(hsv.h)).toBe(226);
        expect(Math.round(hsv.s * 100)).toBe(44);
        expect(Math.round(hsv.v * 100)).toBe(55);
    });
});

describe('hsv_to_rgb tests', () => {
    test('hsv to rgb white', () => {
        const hsv = {h: 0, s: 0, v: 1};
        expect(converter.hsv_to_rgb(hsv)).toEqual({r: 255, g: 255, b: 255});
    });

    test('hsv to rgb black', () => {
        const hsv = {h: 0, s: 0, v: 0};
        expect(converter.hsv_to_rgb(hsv)).toEqual({r: 0, g: 0, b: 0});
    });

    test('hsv to rgb 1', () => {
        const hsv = {h: 129, s: 0.86, v: 0.81};
        expect(converter.hsv_to_rgb(hsv)).toEqual({r: 29, g: 207, b: 56});
    });

    test('hsv to rgb 2', () => {
        const hsv = {h: 226, s: 0.44, v: 0.55};
        expect(converter.hsv_to_rgb(hsv)).toEqual({r: 79, g: 93, b: 140});
    });
});

describe('rgba_to_hex tests', () => {
    test('rgba to hex + alpha white', () => {
        const rgb = {r: 255, g: 255, b: 255};
        expect(converter.rgba_to_hex(rgb, 0, false)).toBe("#ffffff00");
    });

    test('rgba to hex + alpha black', () => {
        const rgb = {r: 0, g: 0, b: 0};
        expect(converter.rgba_to_hex(rgb, 0, false)).toBe("#00000000");
    });

    test('rgba to hex + alpha 1', () => {
        const rgb = {r: 28, g: 206, b: 55};
        expect(converter.rgba_to_hex(rgb, 0.5, false)).toBe("#1cce3780");
    });

    test('rgba to hex + alpha 2', () => {
        const rgb = {r: 78, g: 92, b: 140};
        expect(converter.rgba_to_hex(rgb, 1, false)).toBe("#4e5c8cff");
    });

    test('rgba to hex no alpha white', () => {
        const rgb = {r: 255, g: 255, b: 255};
        expect(converter.rgba_to_hex(rgb, 0, true)).toBe("#ffffff");
    });

    test('rgba to hex no alpha black', () => {
        const rgb = {r: 0, g: 0, b: 0};
        expect(converter.rgba_to_hex(rgb, 0, true)).toBe("#000000");
    });

    test('rgba to hex no alpha 1', () => {
        const rgb = {r: 28, g: 206, b: 55};
        expect(converter.rgba_to_hex(rgb, 0.5, true)).toBe("#1cce37");
    });

    test('rgba to hex no alpha 2', () => {
        const rgb = {r: 78, g: 92, b: 140};
        expect(converter.rgba_to_hex(rgb, 1, true)).toBe("#4e5c8c");
    });
});

describe('hex_to_rgba tests', () => {
    test(' hex to rgba black', () => {
        expect(converter.hex_to_rgba("#ffffff")).toEqual({r: 255, g: 255, b: 255, a: 1});
    });

    test(' hex to rgba white', () => {
        expect(converter.hex_to_rgba("#000000")).toEqual({r: 0, g: 0, b: 0, a: 1});
    });

    test(' hex to rgba 1', () => {
        expect(converter.hex_to_rgba("#1cce37")).toEqual({r: 28, g: 206, b: 55, a: 1});
    });

    test(' hex to rgba 2', () => {
        expect(converter.hex_to_rgba("#4e5c8c")).toEqual({r: 78, g: 92, b: 140, a: 1});
    });

    test(' hex to rgba with alpha', () => {
        const rgba = converter.hex_to_rgba("#4e5c8c80");
        // Rounding floats.
        expect(rgba.r).toBe(78);
        expect(rgba.g).toBe(92);
        expect(rgba.b).toBe(140);
        expect(rgba.a).toBeCloseTo(0.5);
    });
});