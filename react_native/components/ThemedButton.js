//TODO - implement into all button fields in PlannerScreen and possibly also into Settings screen after merging.

import React, { useState, useEffect, useContext } from 'react';
import {
    Pressable,
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { ThemeContext } from './themeContext';
import { toRGBA } from './utils';

const ThemedButton = ({ text, sideComponent=null, color=null, widthPct, heightPct, onPress }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    if (!color) color = theme.s2;

    //TODO: implement all button settings through context

    return (
        <Pressable
            style={({ pressed }) => [styles.button_container, {
                width: widthPct + '%',
                height: heightPct + '%',
                backgroundColor: pressed ? toRGBA(color, 0.7) : 'transparent',
                borderColor: color,
            }]}
            onPress={onPress}
        >
            <Text style={{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: theme.s6, marginRight: sideComponent === null ? 0 : 10 }}>
                {text}
            </Text>
            {sideComponent}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button_container: {
        width: '100%',
        height: '100%',
        borderWidth: 1.5,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ThemedButton;