export const swatch = {
    s1: '#080a0f',
    s2: '#484851',
    s3: '#0170ff',
    s4: '#a09891',
    s5: '#c99b3b',
    s6: '#f7f8f9',
    s7: '#a37133',
    s8: '#598ac5',
    s9: '#191919',
    s10: '#04cc47',
    s11: '#ff3b3b',
    s12: '#7733ff',
    s13: '#34343b',
}

export const hexToRgb = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

export const swatchRGB = (() => {
    let tmp = {};
    for(var color in swatch) {
        tmp[`${color}`] = hexToRgb(swatch[color]);
    }
    return tmp;
})(); 

export const toRGBA = (color, opacity) => { // takes rgb color (no hex)
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

