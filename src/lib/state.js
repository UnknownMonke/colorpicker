import Store from './store.js';

// ==================================================================== //
//                           State management                           //
// ==================================================================== //

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
 * Slider changes are set on mousedown and mousemove (dragging).
 * 
 * Only event listeners are used to avoid exposing javascript in the html and polluting the window with window functions.
 * 
 * The sliders positions are not stored to avoid redundancy, as they have a direct relation with the hsv value.
 */

const actions = {
    set_rgb: (context, payload) => context.commit('set_rgb', payload),
    set_hsv: (context, payload) => context.commit('set_hsv', payload),
    set_alpha: (context, payload) => context.commit('set_alpha', payload),
    set_dragging: (context, payload) => context.commit('set_dragging', payload)
};

const mutations = {
    set_rgb: (state, payload) => state.rgb = payload,
    set_hsv: (state, payload) => state.hsv = payload,
    set_alpha: (state, payload) => state.alpha = payload,
    set_dragging: (state, payload) => state.dragging = payload
};

const defaultState = {
    rgb: { r: 0, g: 0, b: 0 },
    hsv: { h: 0, s: 0, v: 0 },
    alpha: 0,
    dragging: ''
};

export const store = new Store({
    actions,
    mutations,
    state: defaultState
});