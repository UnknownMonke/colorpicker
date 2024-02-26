// ==================================================================== //
//                   Color Spaces Convertion Functions                  //
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

    return { h: (h < 0 ? 360 + h : h), s, v };
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
 * Converts a valid hex string to rgba.
 * 
 * If a value for the alpha channel is present, the strings has a 4th tuple.
 * 
 * ---
 * 
 * @param {string} hex Hex string in the form `"#{2}{2}{2}"` or `"#{2}{2}{2}{2}"`, where `"{2}""` are 2 characters between in `[0-9]` or `[a-fA-F]`.
 * 
 * @returns rgba values. 
 */
function hex_to_rgba(hex) {
    let result = [];

    if (hex.length === 9) {
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    }
    else if (hex.length === 7) {
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result.length === 5 ? parseInt(result[4], 16) / 255 : 1 // Fixed according to input rules (no value if alpha = 1).
    };
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
    console.log(result === expectation ? "✓" : "X", result, expectation);
}

// -------------------------------------------------------------------- //

converter = {
    rgb_to_hsv,
    hsv_to_rgb,
    rgba_to_hex,
    hex_to_rgba
};