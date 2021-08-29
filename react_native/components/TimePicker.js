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
    withSpring,
    withTiming,
    Easing,
    useAnimatedGestureHandler,
    runOnJS,
} from 'react-native-reanimated';
import {
    PanGestureHandler,
} from 'react-native-gesture-handler';
import { BackgroundImage } from 'react-native-elements/dist/config';

const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
//const minutes = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
const ampm = ['AM ', 'PM ']; //space for better formatting

const itemHeight = 60;
const displayYOffset = 3;

const TimeItem = ({ name, index, halfItemsLength, translate, theme }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const dif = (translate.value - (-(index + 1 - halfItemsLength) * itemHeight + (itemHeight / 2) + displayYOffset));
        const rotateX = -dif * 0.6;
        const opacity = 1 - (Math.abs(dif) / 100);
        return {
            transform: [
                { rotateX: rotateX + 'deg' },
                { perspective: 100 },
            ],
            opacity: opacity,
        };
    });

    return (
        <Animated.View
            style={animatedStyle}
        >
            <Text style={[styles.text, { color: theme.s6 }]}>{name}</Text>
        </Animated.View>
    );
}

const TimeItemScroller = ({ items, curTimeItem, setTimeItem, theme }) => { // setTimeItem's parameter is an item of items list (a string)
    const halfItemsLength = items.length / 2;
    const curIdx = items.indexOf(curTimeItem);
    const initialTranslateY = -(curIdx + 1 - halfItemsLength) * itemHeight + (itemHeight / 2) + displayYOffset
    const translateY = useSharedValue(initialTranslateY);
    const panGestureEvent = useAnimatedGestureHandler({
        onStart: (event, context) => {
            context.translateY = translateY.value;
        },
        onActive: (event, context) => {
            translateY.value = event.translationY + context.translateY;
        },
        onEnd: (event, context) => {
            let selectedIdx = Math.floor(-(translateY.value / itemHeight) + halfItemsLength);
            if (selectedIdx < 0) selectedIdx = 0;
            if (selectedIdx >= items.length) selectedIdx = items.length - 1;
            const selectedTranslateY = -(selectedIdx + 1 - halfItemsLength) * itemHeight + (itemHeight / 2) + displayYOffset
            translateY.value = withSpring(selectedTranslateY, {
                stiffness: 175,
            });
            runOnJS(setTimeItem)(items[selectedIdx]);
        },
    });
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
            ]
        };
    });

    const timeItems = items.map((item, index) => <TimeItem name={item} index={index} halfItemsLength={halfItemsLength} translate={translateY} theme={theme} key={index} />);

    return (
        <View style={styles.time_pan_container}> 
            <PanGestureHandler onGestureEvent={panGestureEvent}>
                <Animated.View
                    style={[
                        animatedStyle,
                    ]}
                >
                    {timeItems}
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
}

const TimePicker = ({ time, setTime, defaultTime }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const timeHourString = time.substring(0, 2);
    const timeHour = parseInt(timeHourString);

    let timeHourItem = (timeHour > 12 ? timeHour - 12 : (timeHour === 0 ? 12 : timeHour)).toString();
    if (timeHourItem.length === 1) timeHourItem = '0' + timeHourItem;

    return (
        <View style={styles.container}>
            <TimeItemScroller
                items={hours}
                curTimeItem={timeHourItem}
                setTimeItem={(hourString) => {
                    //note: timeHour is previous time. If timeHour is < 12 that means AM must be maintained. If timeHour is >= 12, then new timeHour should be int(hourString) + 12.
                    let tmpHourString = hourString;
                    if (timeHour >= 12 && tmpHourString !== '12') tmpHourString = (parseInt(tmpHourString) + 12).toString();
                    else if (timeHour < 12 && tmpHourString === '12') tmpHourString = '00';
                    setTime(tmpHourString + time.substring(2, 4));
                }}
                theme={theme}
            />
            <View style={styles.colon_container}>
                <Text style={[styles.text, { color: theme.s6 }]}>:</Text>
            </View>
            <TimeItemScroller
                items={minutes}
                curTimeItem={time.substring(2, 4)}
                setTimeItem={(minuteString) => {
                    setTime(timeHourString + minuteString);
                }}
                theme={theme}
            />
            <View style={{ flex: 0.3 }} />
            <TimeItemScroller
                items={ampm}
                curTimeItem={ampm[timeHour >= 12 ? 1 : 0]}
                setTimeItem={(ampmString) => {
                    const ampmIdx = ampm.indexOf(ampmString);
                    if (ampmIdx === 0 && timeHour >= 12) {
                        let hourString = (timeHour - 12).toString();
                        if (hourString.length === 1) hourString = '0' + hourString;
                        setTime(hourString + time.substring(2, 4));
                    } else if (ampmIdx === 1 && timeHour < 12) {
                        const hourString = (timeHour + 12).toString();
                        setTime(hourString + time.substring(2, 4));
                    }
                }}
                theme={theme}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    time_pan_container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colon_container: {
        flex: 0.3,
        width: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        letterSpacing: 5,
        textAlign: 'center',
        height: itemHeight,
    },
});

export default TimePicker;