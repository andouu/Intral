import { Dimensions, PixelRatio } from 'react-native';

export const toRGBA = (color, opacity) => { // takes rgb color (no hex)
    return `rgba${color.substr(3, color.length-4)}, ${opacity})`;
}

export const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}