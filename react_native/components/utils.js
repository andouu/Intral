import { Dimensions, PixelRatio } from 'react-native';

export const toRGBA = (color, opacity) => { // takes rgb color (no hex)
    return `rgba${color.substr(3, color.length-4)}, ${opacity})`;
}

export const hslStringToHSLA = (hslString, opacity) => {
    let alphaComma = hslString.lastIndexOf(',');
    let hsl = hslString.substr(0, alphaComma + 1);
    return hsl + opacity.toString() + ')';
}

export const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}

export const heightPctToDP = (heightPct, padding=0) => {
    const screenHeight = Dimensions.get('window').height - 2 * padding;
    const elemHeight = parseFloat(heightPct);
    return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
}

export const capitalizeWord = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

export const getRandomKey = (length) => { // only pseudorandom, do not use for any sensitive data
    let result = ''
    let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let charlen = characters.length;
    for(let i = 0; i < length; i ++) {
        result += characters.charAt(Math.floor(Math.random() * charlen));
    }
    return result;
};
