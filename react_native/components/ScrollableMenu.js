import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { ThemeContext } from './themeContext';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { toRGBA } from '../components/utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CloseButton = ({ theme, handleClose }) => {
    return (
        <Pressable
            style={({pressed}) => [
                {
                    width: 40,
                    height: 40,
                    position: 'absolute', 
                    top: 2, 
                    right: -5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 30,
                    backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent'
                }
            ]}
            onPress={handleClose}
        >
            <MaterialDesignIcons name='close' size={30} color={theme.s4} style={{ bottom: 0, right: 0 }}/>
        </Pressable>
    );
}

const ScrollableMenu = ({ headerText, nonScrollingComponent, menuVisible, bezierAnimCurve, handleCloseMenu, setMenuAnimationFinished=null, children }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const menuHeightPct = useSharedValue(100);
    const animatedMenuStyle = useAnimatedStyle(() => {
        return {
            top: withTiming(menuHeightPct.value + '%', {duration: 500, easing: Easing.in(bezierAnimCurve)}, (finished) => {
                if (setMenuAnimationFinished !== null) runOnJS(setMenuAnimationFinished)(true);
            }),
        }
    });

    const menuScrollViewRef = useRef();
    useEffect(() => {
        if (menuVisible) {
            menuHeightPct.value = 0;
            menuScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
        } else {
            menuHeightPct.value = 100;
        }
    }, [menuVisible]);

    return (
        <Animated.View style={[styles.container, { backgroundColor: theme.s1 }, animatedMenuStyle]}>
            <Text style={[styles.header_text, { color: theme.s6 }]}>{headerText}</Text>
            <CloseButton theme={theme} handleClose={handleCloseMenu} />
            <View style={{ borderBottomWidth: 2, borderBottomColor: theme.s4 }} />
            {nonScrollingComponent}
            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: 5 }} ref={menuScrollViewRef}>
                {children}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 3,
    },
    header_text: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 40,
        width: '75%',
        marginBottom: 10,
    }
});

export default ScrollableMenu;