(function(global) {
    'use strict';

    const state = {
        rgb: { r: 0, g: 0, b: 0 },
        hsv: { h: 0, s: 0, v: 0 },
        alpha: 0,
        dragging: ''
    };
    const initial_slider_values = { s: 50, v: 0, h: 50, a: 0 };

    // -------------------------------------------------------------------- //

    //TODO flowcharts & interactions.
    /**
     * Actions that modify the state :
     * 
     * - Loading page with default values.
     * 
     * - Individual slider change (1 at a time).
     *      - Hue slider.
     *      - Alpha slider.
     *      - Saturation / Value pointer.
     *
     * - Input value change (1 at a time) :
     *      - R, G, B inputs.
     *      - Alpha input.
     *      - Hex input.
     * 
     * Slider changes are on mousedown and mousemove (dragging).
     * 
     * Only event listeners are used to avoid exposing javascript in the html and polluting the window with global functions.
     */

    // ==================================================================== //
    //                           State management                           //
    // ==================================================================== //

    // ----------------------------- On Load ------------------------------ //

    global.addEventListener('load', () => {
        state.hsv = {
            h: initial_slider_values.h * 360 / 100,
            s: initial_slider_values.s / 100,
            v: 1 - initial_slider_values.v / 100
        };
        state.alpha = (100 - initial_slider_values.a) / 100;
        state.rgb = hsv_to_rgb(state.hsv); // Updates rgb values with full hsv values.

        update({ sliders: [], backgrounds: ['sat', 'alpha', 'preview'], inputs: ['red', 'green', 'blue', 'alpha', 'hex'] });
    });

    // -------------------------------------------------------------------- //

    // -------------------------- Sliders change -------------------------- //

    global.addEventListener('mousedown', (e) => {

        switch (e.target.id) {
            case 'clpk-wrapper-hue':
                state.dragging = 'hue';
                slider_change_hue(document.getElementById('clpk-selector-hue'), e.clientX);
                break;

            case 'clpk-wrapper-alpha':
                state.dragging = 'alpha';
                slider_change_alpha(document.getElementById('clpk-selector-alpha'), e.clientX);
                break;

            case 'clpk-wrapper-sat':
                state.dragging = 'sat';
                slider_change_sat(document.getElementById('clpk-selector-sat'), e.clientX, e.clientY);
                break;

            default:
                break;
        }
    });
    
    global.addEventListener('mousemove', (e) => {

        switch (state.dragging) {
            case 'hue':
                slider_change_hue(document.getElementById('clpk-selector-hue'), e.clientX);
                break;

            case 'alpha':
                slider_change_alpha(document.getElementById('clpk-selector-alpha'), e.clientX);
                break;

            case 'sat':
                slider_change_sat(document.getElementById('clpk-selector-sat'), e.clientX, e.clientY);
                break;

            default:
                break;
        }
    });
    
    global.addEventListener('mouseup', () => state.dragging = '');

    // -------------------------------------------------------------------- //

    function slider_change_hue(target, pos_raw) {
        const slider_val = drag(pos_raw, target.offsetWidth, target.offsetLeft); // Gets mouse relative value from 0 to 100%.
        
        state.hsv.h = slider_val * 360 / 100; // Updates hue value on the fly. Scales from 0 to 360.
        state.rgb = hsv_to_rgb(state.hsv); // Updates rgb values with full hsv values.

        update({ sliders: ['hue'], backgrounds: ['sat', 'alpha', 'preview'], inputs: ['red', 'green', 'blue', 'hex'] });
    }

    function slider_change_alpha(target, pos_raw) {
        const slider_val = drag(pos_raw, target.offsetWidth, target.offsetLeft);

        state.alpha = (100 - slider_val) / 100; // Updates value in state.

        update({ sliders: ['alpha'], backgrounds: ['preview'], inputs: ['alpha', 'hex'] });
    }

    function slider_change_sat(target, pos_x, pos_y) {
        const slider_val_x = drag(pos_x, target.offsetWidth, target.offsetLeft);
        const slider_val_y = drag(pos_y, target.offsetHeight, target.offsetTop);

        state.hsv.s = slider_val_x / 100;
        state.hsv.v = 1 - slider_val_y / 100;
        state.rgb = hsv_to_rgb(state.hsv);

        update({ sliders: ['sat'], backgrounds: ['alpha', 'preview'], inputs: ['red', 'green', 'blue', 'hex'] });
    }

    function drag(pos_raw, length, origin) {
        let pos_scaled = pos_raw - origin; // Scales to the parent container.
        let inbound = pos_scaled;

        if (pos_scaled >= length) inbound = length ; // Sticks to boundaries.
        if (pos_scaled <= 0) inbound = 0;

        return inbound * 100 / length; // Scales from 0 to 100.
    }

    // -------------------------------------------------------------------- //

    // -------------------------- Inputs change --------------------------- //

    const color_inputs = ['red', 'green', 'blue'];

    for (const color of color_inputs) {
        document.getElementById(`clpk-input-${color}`).addEventListener('keyup', (e) => {
            num_input_validation(color, e.target.value);
        });
    }
    document.getElementById('clpk-input-alpha').addEventListener('keyup', (e) => {
        num_input_validation('alpha', e.target.value, true);
    });
    document.getElementById('clpk-input-hex').addEventListener('keyup', (e) => {
        hex_input_validation(e.target.value);
    });

    // -------------------------------------------------------------------- //

    /**
     * Input validation & change handling for color inputs (r, g, b, a).
     * 
     * Validation :
     * 
     * - If value is not a positive integer -> sets to 0.
     * - If value is > 255, or 100 for alpha -> sets to 255 (or 100).
     * - If value is valid, changes state, hex, backgrounds, sliders.
     * 
     * ---
     * 
     * @param {string} color The input color class among `("red", "green", "blue", "alpha")`.
     * @param {number} value_raw The unvalidated input value.
     * @param {boolean} alpha `false` if not specified, sets the upper bound and handling function when editing alpha input.
     */
    function num_input_validation(color, value_raw, alpha = false) {
        const reg = new RegExp('\^[0-9]\+$');
        const isPositiveInteger = reg.test(value_raw);

        if (!isPositiveInteger) {
            document.getElementById(`clpk-input-${color}`).value = 0;

        } else {
            const value = parseInt(value_raw);

            if (value > ( alpha ? 100 : 255 )) { // Parenthesis needed : precedence of ">" over "?".
                document.getElementById(`clpk-input-${color}`).value = alpha ? 100 : 255;
            } else {
                alpha ? input_alpha_change(value) : input_rgb_change(color.charAt(0), value);
            }
        }
    }

    /** Input validation & change handling for the hex input. */
    function hex_input_validation(value_raw) {
        const rgba = hex_to_rgba(value_raw);

        if (rgba !== null) input_hex_change(rgba);
    }

    function input_rgb_change(color, value) {
        state.rgb[color] = value;
        state.hsv = rgb_to_hsv(state.rgb);

        update({ sliders: ['hue', 'sat'], backgrounds: ['sat', 'alpha', 'preview'], inputs: ['hex'] });
    }

    function input_alpha_change(value) {
        state.alpha = value / 100;

        update({ sliders: ['alpha'], backgrounds: [], inputs: ['hex'] });
    }

    function input_hex_change(rgba) {
        state.rgb = ( ({ r, g, b }) => ({ r, g, b }) )(rgba);
        state.hsv = rgb_to_hsv(state.rgb);
        state.alpha = rgba.a;

        update({ sliders: ['hue', 'alpha', 'sat'], backgrounds: ['sat', 'alpha', 'preview'], inputs: ['red', 'green', 'blue', 'alpha'] });
    }

    // -------------------------------------------------------------------- //

    /** 
     * Updates a set of individual sliders, backgrounds and values.
     * //TODO might have optimization problems with so many loops.
     */
    function update({ sliders, backgrounds, inputs }) {
        for (const slider of sliders) {
            if (slider === 'hue') {
                document.getElementById('clpk-pointer-hue').style.left = (state.hsv.h / 360 * 100) + '%';
            }
            if (slider === 'alpha') {
                document.getElementById('clpk-pointer-alpha').style.left = (100 - state.alpha * 100) + '%';
            }
            if (slider === 'sat') {
                document.getElementById('clpk-pointer-sat').style.left = (state.hsv.s * 100) + '%';
                document.getElementById('clpk-pointer-sat').style.top = ((1 - state.hsv.v) * 100) + '%';
            }
        }
        for (const bg of backgrounds) {
            if (bg === 'sat') {
                const rgb_bg = hsv_to_rgb({h: state.hsv.h, s: 1, v: 1}); // Gets rgb values from hue with max saturation & value.
                document.getElementById('clpk-bg-sat').style.background = `rgb(${rgb_bg.r}, ${rgb_bg.g}, ${rgb_bg.b})`;
            }
            if (bg === 'alpha') {
                document.getElementById('clpk-bg-alpha').style.background = `linear-gradient(to right, rgb(${state.rgb.r}, ${state.rgb.g}, ${state.rgb.b}) 0%, rgba(${state.rgb.r}, ${state.rgb.g}, ${state.rgb.b}, 0) 100%)`; 
            }
            if (bg === 'preview') {
                document.getElementById('clpk-bg-preview').style.background = `rgba(${state.rgb.r}, ${state.rgb.g}, ${state.rgb.b}, ${state.alpha})`;
            }
        }
        for (const color of inputs) {
            if (color === 'red') {
                document.getElementById(`clpk-input-${color}`).value = state.rgb.r;
            }
            if (color === 'green') {
                document.getElementById(`clpk-input-${color}`).value = state.rgb.g;
            }
            if (color === 'blue') {
                document.getElementById(`clpk-input-${color}`).value = state.rgb.b;
            }
            if (color === 'alpha') {
                document.getElementById(`clpk-input-${color}`).value = Math.round(state.alpha * 100);
            }
            if (color === 'hex') {
                document.getElementById(`clpk-input-${color}`).value = rgba_to_hex(state.rgb, state.alpha, state.alpha === 1);
            }
        }
    }

    // -------------------------------------------------------------------- //


    // ==================================================================== //
    //                             Processing                               //
    // ==================================================================== //

    function rgb_to_hsv({r, g, b}) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const chroma = max - min;

        let h = 0;

        if (chroma !== 0 && max === r) {
            h = ( ((g - b) / chroma) % 6 ) * 60;
        }
        if (chroma !== 0 && max === g) {
            h = ( (b - r) / chroma + 2 ) * 60;
        }
        if (chroma !== 0 && max === b) {
            h = ( (r - g) / chroma + 4 ) * 60;
        }
        const s = max === 0 ? 0 : chroma / max;
        const v = max / 255;

        return { h: h < 0 ? 360 + h : h, s, v };
    }

    function hsv_to_rgb({h, s, v}) {
        const chroma = s * v;
        const interval = h / 60;
        const m = v - chroma;

        const x = chroma * (1 - Math.abs(interval % 2 - 1));

        let rgb_temp = { r: 0, g: 0, b: 0 };

        if (interval >= 0 && interval < 1) {
            rgb_temp = { r: chroma, g: x, b: 0 };
        }
        if (interval >= 1 && interval < 2) {
            rgb_temp = { r: x, g: chroma, b: 0 };
        }
        if (interval >= 2 && interval < 3) {
            rgb_temp = { r: 0, g: chroma, b: x };
        }
        if (interval >= 3 && interval < 4) {
            rgb_temp = { r: 0, g: x, b: chroma };
        }
        if (interval >= 4 && interval < 5) {
            rgb_temp = { r: x, g: 0, b: chroma };
        }
        if (interval >= 5 && interval <= 6) {
            rgb_temp = { r: chroma, g: 0, b: x };
        }

        return { 
            r: Math.round( (rgb_temp.r + m) * 255 ), 
            g: Math.round( (rgb_temp.g + m) * 255 ), 
            b: Math.round( (rgb_temp.b + m) * 255 )
        };
    }

    /**
     * Converts a RGBA string into its hex value.
     * 
     * - Works with alpha : `"rgba(255, 255, 255, 0)"" => "#ffffff00"`
     * - Works with single digits : `"rgba(0, 0, 0, 0) => #00000000"`
     * - Works with RGB : `"rgb(124, 255, 3) => #7cff03"`
     * 
     * RGB values are integers between 0 and 255.
     * The alpha channel is a decimal number between 0 and 1.
     * 
     * ---
     * 
     * @param {string} rgba RGBA formatted string (ex : `"rgba(124, 255, 3, 0.5)"`).
     * @param {boolean} remove_alpha Ignores the alpha channel to convert simple rgb strings (ex : `"rgb(124, 255, 3)"`)
     * 
     * @returns hexadecimal representation of the RGBA or rgb string (ex : `"#7cff0380"`, `"#7cff03"`).
     */
    function rgba_to_hex(rgb, alpha, remove_alpha) {
        const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

        return '#' + rgba.replace(/^rgba?\(|\s+|\)$/g, '')
            .split(',')
            .filter((_str, index) => !remove_alpha || index !== 3)
            .map(str => parseFloat(str))
            .map((num, index) => index === 3 ? Math.round(num * 255) : num) // Converts alpha to 255 number.
            .map(num => num.toString(16)) // Converts to hex.
            .map(str => str.length === 1 ? '0' + str : str) // Adds 0 when length of one number is 1
            .join('');
    }

    /**
     * Converts a hex string to rgba.
     * 
     * The string is matched to validate a valid hexadecimal string in the form `"#{2}{2}{2}"` or `"#{2}{2}{2}{2}"`,
     * where `"{2}""` are 2 characters between in `[0-9]` or `[a-f]`.
     * 
     * If a value for the alpha channel is present, the strings has a 4th tuple.
     * 
     * ---
     * 
     * @param {string} hex The raw hex string.
     * 
     * @returns `null` if the string is not valid, else the rgba values. 
     */
    function hex_to_rgba(hex) {
        let result = null;

        if (hex.length === 9) {
            result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        } 
        else if (hex.length === 7) {
            result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        }

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: result.length === 5 ? parseInt(result[4], 16) / 255 : 1 // Fixed according to input rules (no value if alpha = 1).
        } : null;
    }

    // -------------------------------------------------------------------- //

    // -------------------------- Alternatives ---------------------------- //

    /**
     * `<<` is the bitwise left shift operator.
     * Assuming g is a non-zero integer, `g << 8` therefore effectively multiplies g by 256, adding to zeroes to the end of its hex representation.
     * Likewise `r << 16` adds 4 zeroes. 
     * Adding `1 << 24` (1000000 in hex) ensures that the hex representation is left-padded with any required zeroes once the leading 1 is stripped off using `slice()`.
     * 
     * For example, if r and g were both zero and b was 51, `((r << 16) + (g << 8) + b).toString(16)` would return the string `"33"`.
     * Add `1 << 24` and you get `"1000033"`. Then strip the 1 and you're there.
     */
    function rgb_to_hex_2(r, g, b) {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    }

    const rgb_to_hex_3 = (r, g, b) => 
        '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');

    const rgb_to_hex_4 = (r, g, b) => 
        '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0')).join('');

    const hex_to_rgb_2 = hex =>
        hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
            .substring(1).match(/.{2}/g)
            .map(x => parseInt(x, 16));

    // -------------------------------------------------------------------- //

    /*
    // RGBA with Alpha value
    expect(rgba_to_hex("rgba(255, 255, 255, 0)"), "#ffffff00")
    expect(rgba_to_hex("rgba(0, 0, 0, 0)"), "#00000000")
    expect(rgba_to_hex("rgba(124, 255, 3, 0.5)"), "#7cff0380")
    expect(rgba_to_hex("rgba(124, 255, 3, 1)"), "#7cff03ff")

    // RGB value 
    expect(rgba_to_hex("rgba(255, 255, 255)"), "#ffffff")
    expect(rgba_to_hex("rgba(0, 0, 0)"), "#000000")
    expect(rgba_to_hex("rgba(124, 255, 3)"), "#7cff03")

    // RGBA without Alpha value
    expect(rgba_to_hex("rgba(255, 255, 255, 0)", true), "#ffffff")
    expect(rgba_to_hex("rgba(0, 0, 0, 0)", true), "#000000")
    expect(rgba_to_hex("rgba(124, 255, 3, 0.5)", true), "#7cff03")
    expect(rgba_to_hex("rgba(124, 255, 3, 1)", true), "#7cff03")
    */

    function expect(result, expectation) {
        console.log(result === expectation ? "✓" : "X", result, expectation)
    }
})(this);