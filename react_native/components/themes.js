export const swatchDark = {
    s1: 'rgb(8,10,15)',
    s2: 'rgb(72,72,81)',
    s3: 'rgb(1,112,255)',
    s4: 'rgb(160,152,145)',
    s5: 'rgb(201,155,59)',
    s6: 'rgb(247,248,249)',
    s7: 'rgb(163,113,51)',
    s8: 'rgb(89,138,197)',
    s9: 'rgb(25,25,25)',
    s10: 'rgb(4,204,71)',
    s11: 'rgb(255,59,59)',
    s12: 'rgb(119,51,255)',
    s13: 'rgb(52,52,59)',
}

export const hexToRgb = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}


