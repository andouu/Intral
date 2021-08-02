export const toRGBA = (color, opacity) => { // takes rgb color (no hex)
    return `rgba${color.substr(3, color.length-4)}, ${opacity})`;
}