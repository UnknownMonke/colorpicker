import { converter } from './lib/converter.js';
import { store } from './lib/state.js';

// ==================================================================== //
//                              Listeners                               //
// ==================================================================== //

// ----------------------------- On Load ------------------------------ //

window.addEventListener('load', () => init_state({ s: 50, v: 0, h: 50, a: 0 }));

// -------------------------------------------------------------------- //

// -------------------------- Sliders change -------------------------- //

window.addEventListener('mousedown', (e) => {
    const code = e.target.dataset.code;

    if (code) {
        store.dispatch('set_dragging', code);
        slider_change(code, e.target.querySelector('.clpk-selector'), e.clientX, e.clientY);
    }
});

window.addEventListener('mousemove', (e) => {
    const code = store.state.dragging;

    if (code !== '') {
        slider_change(code, document.querySelector(`[data-code="${code}"] .clpk-selector`), e.clientX, e.clientY);
    }
});

window.addEventListener('mouseup', () => store.dispatch('set_dragging', ''));

// -------------------------------------------------------------------- //

// -------------------------- Inputs change --------------------------- //

for (const color of ['red', 'green', 'blue', 'alpha', 'hex']) {
    document.getElementById(`clpk-input-${color}`).addEventListener('keyup', (e) => input_change(color, e.target.value));
}

// -------------------------------------------------------------------- //

function drag(pos_raw, length, origin) {
    let pos_scaled = pos_raw - origin; // Scales to the parent container.
    let inbound = pos_scaled;

    if (pos_scaled >= length) inbound = length ; // Sticks to boundaries.
    if (pos_scaled <= 0) inbound = 0;

    return inbound * 100 / length; // Scales from 0 to 100.
}

/**
 * Updates state based on scaled slider value while clicking or dragging the mouse.
 * 
 * ---
 * 
 * @param {string} code The slider element code, among `["hue","alpha","sat"]`.
 * @param {HTMLElement} target The slider element.
 * @param {number} pos_x Cursor absolute x position.
 * @param {number} pos_y Cursor absolute y position. Only used for the sat & val sliders.
 */
function slider_change(code, target, pos_x, pos_y) {
    const slider_val_x = drag(pos_x, target.offsetWidth, target.offsetLeft);
    
    switch (code) {
        case 'hue':
            store.dispatch('set_hsv', { h: slider_val_x * 360 / 100, s: store.state.hsv.s, v: store.state.hsv.v });
            store.dispatch('set_rgb', converter.hsv_to_rgb(store.state.hsv));
            break;

        case 'alpha':
            store.dispatch('set_alpha', (100 - slider_val_x) / 100);
            break;

        case 'sat':
            const slider_val_y = drag(pos_y, target.offsetHeight, target.offsetTop);

            store.dispatch('set_hsv', { h: store.state.hsv.h, s: slider_val_x / 100, v: 1 - slider_val_y / 100 });
            store.dispatch('set_rgb', converter.hsv_to_rgb(store.state.hsv));
            break;

        default:
            break;
    }
}

/**
 * Inits the state.
 * 
 * The initial state values have to be updated through actions the DOM elements are subscribed to,
 * otherwise they will not display those values as they are not defined inside components, and there is no binding.
 * 
 * @param {object} sliders `{ h, s, v, a }` sliders initial values (50 => 50%).
 */ 
function init_state(sliders) {
    const hsv = {
        h: sliders.h * 360 / 100,
        s: sliders.s / 100,
        v: 1 - sliders.v / 100
    };
    store.dispatch('set_rgb', converter.hsv_to_rgb(hsv)); // Updates rgb values with full hsv values.
    store.dispatch('set_hsv', hsv);
    store.dispatch('set_alpha', (100 - sliders.a) / 100);
}

// -------------------------------------------------------------------- //

function input_change(color, value_raw) {
    switch (color) {
        case 'hex':
            const hex = hex_input_validation(value_raw);

            if (hex !== null) {
                const rgba = converter.hex_to_rgba(hex);
                const rgb = ( ({ r, g, b }) => ({ r, g, b }) )(rgba);

                store.dispatch('set_rgb', rgb);
                store.dispatch('set_hsv', converter.rgb_to_hsv(rgb));
                store.dispatch('set_alpha', rgba.a);
            }
            break;

        case 'alpha':
            const alpha = num_input_validation(value_raw, true);

            store.dispatch('set_alpha', alpha / 100);
            break;

        default:
            const value = num_input_validation(value_raw);

            const rgb = store.state.rgb;
            rgb[color.charAt(0)] = value;
        
            store.dispatch('set_rgb', rgb);
            store.dispatch('set_hsv', converter.rgb_to_hsv(rgb));
            break;
    }
}

/**
 * Input validation for color inputs (r, g, b, a).
 * 
 * Validation :
 * 
 * - If value is not a positive integer -> sets to 0.
 * - If value is > 255, or 100 for alpha -> sets to 255 (or 100).
 * - If value is valid, returns value.
 * 
 * ---
 * 
 * @param {number} value_raw The unvalidated input value.
 * @param {boolean} alpha `false` if not specified, sets the upper bound for the alpha input.
 * 
 * @returns The validated value.
 */
function num_input_validation(value_raw, alpha = false) {
    const reg = new RegExp('\^[0-9]\+$');
    const isPositiveInteger = reg.test(value_raw);

    let value = value_raw;

    if (!isPositiveInteger) {
        value = 0;
    }
    else if (parseInt(value_raw) > ( alpha ? 100 : 255 )) { // Parenthesis needed : precedence of ">" over "?".
        value = alpha ? 100 : 255;
    }
    return value;
}

/** 
 * Input validation for the hex input.
 * 
 * If a value for the alpha channel is present, the string has a 4th tuple.
 * 
 * The string is matched to validate a valid hexadecimal string in the form `"#{2}{2}{2}"` or `"#{2}{2}{2}{2}"`,
 * where `"{2}"` means 2 characters between in `[0-9]` or `[a-fA-F]`.
 * No `"0x"` prefix or shortened syntax.
 */
function hex_input_validation(value_raw) {
    const isValid = /^#?([a-f\d]{2}){3,4}$/i.test(value_raw);
    
    return isValid ? value_raw : null;
}

// -------------------------------------------------------------------- //


// ==================================================================== //
//                            Subscriptions                             //
// ==================================================================== //

store.events.subscribe(['set_rgb'], () => {
    document.getElementById('clpk-input-red').value = store.state.rgb.r;
    document.getElementById('clpk-input-green').value = store.state.rgb.g;
    document.getElementById('clpk-input-blue').value = store.state.rgb.b;

    document.getElementById('clpk-bg-alpha').style.background = 
        `linear-gradient(to right, rgb(${store.state.rgb.r}, ${store.state.rgb.g}, ${store.state.rgb.b}) 0%, rgba(${store.state.rgb.r}, ${store.state.rgb.g}, ${store.state.rgb.b}, 0) 100%)`; 
});

store.events.subscribe(['set_alpha'], () => {
    document.getElementById('clpk-input-alpha').value = Math.round(store.state.alpha * 100);

    document.getElementById('clpk-pointer-alpha').style.left = (100 - store.state.alpha * 100) + '%';
});

store.events.subscribe(['set_rgb', 'set_alpha'], () => {
    document.getElementById('clpk-input-hex').value = converter.rgba_to_hex(store.state.rgb, store.state.alpha, store.state.alpha === 1);
    document.getElementById('clpk-bg-preview').style.background = `rgba(${store.state.rgb.r}, ${store.state.rgb.g}, ${store.state.rgb.b}, ${store.state.alpha})`;
});

store.events.subscribe(['set_hsv'], () => {
    const rgb_bg = converter.hsv_to_rgb({ h: store.state.hsv.h, s: 1, v: 1 }); // Gets rgb values from hue with max saturation & value.
    document.getElementById('clpk-bg-sat').style.background = `rgb(${rgb_bg.r}, ${rgb_bg.g}, ${rgb_bg.b})`;

    document.getElementById('clpk-pointer-hue').style.left = (store.state.hsv.h / 360 * 100) + '%';
    document.getElementById('clpk-pointer-sat').style.left = (store.state.hsv.s * 100) + '%';
    document.getElementById('clpk-pointer-sat').style.top = ((1 - store.state.hsv.v) * 100) + '%';
});