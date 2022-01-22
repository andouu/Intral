import React, { useState, useEffect } from 'react';
import { toRGBA } from './utils';
import {
    StyleSheet,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons';

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

export const DropdownCard = ({ theme, outlined, heightCollapsed, heightExpanded, headerComponent, contentComponent }) => {
    const [isHidden, setIsHidden] = useState(true);

    const cardHeight = useSharedValue(heightCollapsed);
    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(cardHeight.value, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    const contentOpacity = useSharedValue(0);
    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(contentOpacity.value, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    useEffect(() => {
        cardHeight.value = isHidden ? heightCollapsed : heightExpanded;
        contentOpacity.value = isHidden ? 0 : 1;
    }, [isHidden]);

    return (
        <Animated.View style={[ {
            width: '100%',
            backgroundColor: outlined ? 'transparent' : theme.s2,
            borderColor: outlined ? theme.s2 : 'transparent',
            borderRadius: 25,
            borderWidth: outlined ? 1.5 : 0,
            overflow: 'hidden',
            marginBottom: 20,
        }, animatedCardStyle]}>
            <Pressable
                style={({pressed}) => [{
                    backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                    width: '100%',
                    height: heightCollapsed,
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: 10
                }]}
                onPress={() => {
                    setIsHidden(!isHidden);
                }}
            >
                {headerComponent}
                <MaterialDesignIcon name={isHidden ? 'menu-down' : 'menu-up'} size={40} color={theme.s4} style={{ position: 'absolute', right: 5, top: 4 }} />
            </Pressable>
            <Animated.View style={[ { width: '100%' }, animatedContentStyle ]}>
                {contentComponent}
            </Animated.View>
        </Animated.View>
    );
}