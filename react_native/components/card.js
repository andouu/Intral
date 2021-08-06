import React from 'react';
import { toRGBA, widthPctToDP } from './utils';
import {
    StyleSheet,
    View,
    Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';

export const Card = ({ customStyle, outlined=false, children, animatedStyle, theme }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                height: 150,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: outlined ? 'transparent' : theme.s2,
                borderRadius: 30,
                borderWidth: 1.5,
                borderColor: theme.s2,
                padding: 15,
                marginBottom: 20,
            },
        });
    }
    const cardStyle = getStyle();
    const widthDP = widthPctToDP('100%', 0);

    return (
        <Animated.View style={[cardStyle.card, customStyle, animatedStyle]}>
            {children}
        </Animated.View>
    );
}

export const PressableCard = ({ customStyle, outlined=false, children, onPress, animatedStyle, theme }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                height: 150,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: outlined ? 'transparent' : theme.s2,
                borderRadius: 30,
                borderWidth: 1.5,
                borderColor: theme.s2,
                padding: 10,
                marginBottom: 20,
            },
        });
    }
    const cardStyle = getStyle();
    const widthDP = widthPctToDP('100%', 0);

    return (
        <Animated.View style={[cardStyle.card, customStyle, animatedStyle]}>
            <Pressable
                style={({pressed}) => [
                    styles.pressableCard_btn, {backgroundColor: pressed ? toRGBA(theme.s2, 0.75) : 'transparent'}
                ]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    pressableCard_btn: {
        width: '100%', 
        height: '100%', 
        borderRadius: 28,
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingLeft: 15,
        paddingRight: 15,
    },
});