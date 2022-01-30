import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    useAnimatedGestureHandler,
    runOnJS,
} from 'react-native-reanimated';
import {
    PanGestureHandler,
} from 'react-native-gesture-handler';

const markerWidth = 2;
const dotDiameter = 25;

const SliderDot = ({ theme, sliderWidth, optionsLength, optionIndex, onChange }) => {
    const translateXOffset = -(sliderWidth / optionsLength / 2 + dotDiameter / 2);
    const initialTranslateX = ((optionIndex + 1) / optionsLength) * sliderWidth + translateXOffset;
    const translateX = useSharedValue(initialTranslateX);
    const panGestureEvent = useAnimatedGestureHandler({
        onStart: (event, context) => {
            context.translateX = translateX.value;
        },
        onActive: (event, context) => {
            const newX = event.translationX + context.translateX;
            if (newX < 0) translateX.value = 0;
            else if (newX > sliderWidth - dotDiameter) translateX.value = sliderWidth - dotDiameter;
            else translateX.value = newX;
        },
        onEnd: (event, context) => {
            const selectedIdx = Math.round(optionsLength / sliderWidth * (translateX.value - translateXOffset)) - 1;
            const selectedTranslateX = ((selectedIdx + 1) / optionsLength) * sliderWidth + translateXOffset;
            translateX.value = withTiming(selectedTranslateX, {
                duration: 200,
            });
            runOnJS(onChange)(selectedIdx);
        },
    });
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
            ]
        };
    });

    return (
        <PanGestureHandler onGestureEvent={panGestureEvent}>
            <Animated.View
                style={[
                    styles.dot,
                    animatedStyle,
                    { backgroundColor: theme.s6 },
                ]}
            />
        </PanGestureHandler>
    );
}

const DiscreteSlider = ({ theme, widthPixels, options, curOptionIndex=0, onChange }) => {
    const [optionIndex, setOptionIndex] = useState(curOptionIndex);
    const optionsLength = options.length;

    return (
        <View style={{ width: widthPixels }}>
            <View style={styles.text_container}>
                {options.map((option, index) => 
                    <View key={index} style={styles.markerContainer}>
                        <Text style={[ styles.text, { color: theme.s4 } ]}>{option}</Text>
                    </View>
                )}
            </View>
            <View style={{ justifyContent: 'center' }}>
                <View style={[ styles.background, { backgroundColor: theme.s2 } ]}>
                    {options.map((option, index) => 
                        <View key={index} style={styles.markerContainer}>
                            <View style={[ styles.marker, { backgroundColor: theme.s4 } ]} />
                        </View>
                    )}
                </View>
                <SliderDot
                    theme={theme}
                    sliderWidth={widthPixels}
                    optionsLength={optionsLength}
                    optionIndex={optionIndex}
                    onChange={(index) => {
                        onChange(index);
                        setOptionIndex(index);
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    text_container: {
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 15,
    },
    background: {
        width: '100%',
        height: 10,
        borderRadius: 10,
        justifyContent: 'center',
        flexDirection: 'row',
    },
    markerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    marker: {
        width: markerWidth,
        height: '75%',
        borderRadius: 1,
    },
    dot: {
        position: 'absolute',
        width: dotDiameter,
        height: dotDiameter,
        borderRadius: dotDiameter,
    },
    text: {
        fontSize: 15,
        fontFamily: 'Proxima Nova Bold',
        textAlign: 'center',
    },
});

export default DiscreteSlider;