import React from 'react';
import { toRGBA } from './utils';
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
                justifyContent: 'center',
                backgroundColor: outlined ? 'transparent' : theme.s2,
                borderRadius: 25,
                borderWidth: outlined ? 1.5 : 0,
                borderColor: theme.s2,
                marginBottom: 20,
            },
        });
    }
    const cardStyle = getStyle();

    return (
        <Animated.View style={[cardStyle.card, customStyle, animatedStyle]}>
            {children}
        </Animated.View>
    );
}

export const PressableCard = ({ containerStyle, pressableStyle, outlined=false, children, onPress, animatedStyle, theme }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                height: 150,
                backgroundColor: outlined ? 'transparent' : theme.s2,
                borderRadius: 25,
                borderWidth: outlined ? 1.5 : 0,
                borderColor: theme.s2,
                marginBottom: 20,
            },
            pressableCard_button: {
                width: '100%', 
                height: '100%',
                borderRadius: 25,
                justifyContent: 'center'
            }
        });
    }
    const cardStyle = getStyle();

    return (
        <Animated.View style={[cardStyle.card, containerStyle, animatedStyle]}>
            <Pressable
                style={({pressed}) => [
                    cardStyle.pressableCard_button,
                    pressableStyle,
                    {backgroundColor: pressed ? toRGBA(theme.s2, 0.75) : 'transparent'}
                ]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}