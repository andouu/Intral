import React, { useState, useEffect } from 'react';
import { toRGBA } from './utils';
import {
    StyleSheet,
    Pressable,
    View,
    Text,
} from 'react-native';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons';

export const Card = ({ customStyle, outlined=false, children, theme }) => {
    const style = {
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
    }

    return (
        <View style={[ style.card, customStyle ]}>
            {children}
        </View>
    );
}

export const PressableCard = ({ containerStyle, pressableStyle, outlined=false, children, onPress, animatedStyle, theme }) => {
    const style = {
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
        },
    };

    return (
        <Animated.View style={[style.card, containerStyle, animatedStyle]}>
            <Pressable
                style={({pressed}) => [
                    style.pressableCard_button,
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

export const DropdownCard = ({ theme, outlined, containerStyle={}, heightCollapsed, heightExpanded, headerComponent, contentComponent }) => {
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
        }, animatedCardStyle, containerStyle]}>
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
                <MaterialDesignIcon name={isHidden ? 'menu-down' : 'menu-up'} size={40} color={theme.s4} style={{ position: 'absolute', right: 1, top: 4 }} />
            </Pressable>
            <Animated.View style={[ { width: '100%' }, animatedContentStyle ]}>
                {contentComponent}
            </Animated.View>
        </Animated.View>
    );
}

export const DropdownSelectionCard = ({ theme, name, outlined, containerStyle={}, heightCollapsed, heightExpanded, optionsList, initialSelectIndex=0, selectOptionHeight, onChange }) => {
    const [selectIndex, setSelectIndex] = useState(initialSelectIndex);

    return (
        <DropdownCard
            theme={theme}
            outlined={outlined}
            containerStyle={containerStyle}
            heightCollapsed={heightCollapsed}
            heightExpanded={heightExpanded}
            headerComponent={
                <Text style={{ color: theme.s4, fontSize: 20, fontFamily: 'Proxima Nova Bold', }}>
                    {name} <Text style={{ color: theme.s3 }}>{optionsList[selectIndex]}</Text>
                </Text>
            }
            contentComponent={
                optionsList.map((text, index) => 
                    <Pressable
                        key={index}
                        style={({ pressed }) => [{
                            width: '100%', 
                            height: selectOptionHeight,
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderColor: theme.s4,
                            marginBottom: 0,
                            justifyContent: 'center',
                            opacity: pressed ? 0.7 : 1,
                            padding: 10,
                        }]}
                        onPress={() => {
                            setSelectIndex(index);
                            onChange(index);
                        }}
                    >
                        <Text style={{ color: theme.s4, fontSize: 17, fontFamily: 'Proxima Nova Bold' }}>{text}</Text>
                        <View style={{width: 20, height: 20, position: 'absolute', right: 10, borderRadius: 30, borderWidth: 1.5, borderColor: theme.s4, padding: 2}}>
                            {index == selectIndex &&
                                <View style={{ flex: 1, borderRadius: 30, backgroundColor: theme.s3 }} />
                            }
                        </View>
                    </Pressable>
                )
            }
        />
    );
}