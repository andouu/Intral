import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
} from 'react-native';
import { ThemeContext } from './themeContext';
import { toRGBA } from './utils';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing
} from 'react-native-reanimated';

const TimePicker = ({  }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style={styles.container}>
            <View style={styles.time_scroll_container}>
                <Text style={styles.text}>12</Text>
            </View>
            <View style={styles.colon_container}>
                <Text style={styles.text}>:</Text>
            </View>
            <View style={styles.time_scroll_container}>
                <Text style={styles.text}>45</Text>
            </View>
            <View style={styles.time_scroll_container}>
                <Text style={styles.text}>PM </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    time_scroll_container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colon_container: {
        position: 'absolute',
        left: 108,
        bottom: 46,
    },
    text: {
        fontSize: 50,
        fontFamily: 'Proxima Nova Bold',
        letterSpacing: 5,
    },
});

export default TimePicker;