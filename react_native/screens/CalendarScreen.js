import React, { useState, useContext, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
} from 'react-native';
import { toRGBA } from '../components/utils';
import { useIsFocused } from '@react-navigation/core';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeContext } from '../components/themeContext';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const monthDict = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SingleCalendar = ({ size, hwr=75, view='single', style }) => { // hwr = height width ratio
    let height = size * 0.75;
    if(typeof size === 'string') {
        height = parseInt(size) * (hwr/100) + '%';
    }
    return (
        <Animated.View style={[{width: size, height: height, backgroundColor: 'red'}, style]}>
            <Text>Calendar here lol</Text>
        </Animated.View>
    );
}

const Calendar = ({ themeData }) => {
    const dateToday = new Date();
    const [selectedDate, setSelectedDate] = useState({});
    
    const isFocused = useIsFocused();

    const theme = themeData.swatch;

    const handleDateChange = (delta) => {
        let newMonth = selectedDate.month + delta;
        let yearChange = 0;
        if(newMonth < 0)
        {
            newMonth += 12;
            yearChange = -1;
        }
        else if(newMonth > 11)
        {
            newMonth -= 12;
            yearChange = 1;
        }
        setSelectedDate({
            month: newMonth,
            year: selectedDate.year + yearChange,
        });
    }

    useEffect(() => {
        setSelectedDate({
            month: dateToday.getMonth(),
            year: dateToday.getFullYear(),
        })
    }, [isFocused])

    return (
        <View style={styles.calendar_container}>
            <View 
                style={[
                    styles.calendar_header, 
                    {
                        // TODO: uncomment below lines after settings merge with main
                        // borderWidth: themeData.cardOutlined 
                        //     ? 1.5
                        //     : 0,
                        borderWidth: 1.5,
                        borderColor: theme.s2,
                    }
                ]}
            >
                <Pressable 
                    style={({pressed}) => [{
                        flex: 3, 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 50,
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                    }]}
                    onPress={() => handleDateChange(-1)}
                > 
                    {/* Left arrow */}
                    <MaterialDesignIcons name='chevron-left' size={35} color={theme.s4} style={{right: 2}} />
                </Pressable>
                <View style={{flex: 16, alignItems: 'center', justifyContent: 'center'}}> 
                    {/* Date */}
                    <Text style={{fontFamily: 'ProximaNova-Regular', fontSize: 20, color: theme.s6}}>{monthDict[selectedDate.month]} {selectedDate.year}</Text>
                </View>
                <Pressable 
                    style={({pressed}) => [{
                        flex: 3, 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 50,
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                    }]}
                    onPress={() => handleDateChange(1)}
                > 
                    {/* Right arrow */}
                    <MaterialDesignIcons name='chevron-right' size={35} color={theme.s4} style={{left: 2}} />
                </Pressable>
            </View>
            <SingleCalendar size={'100%'} hwr={80} />
        </View>
    );
}

const CalendarScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;

    return (
        <View style={[styles.container, {backgroundColor: theme.s1}]}>
            <View style={styles.optionsBar}>
                <View style={[styles.menu_button, {borderColor: toRGBA(theme.s4, 0.5)}]}>
                    <MaterialDesignIcons.Button 
                        underlayColor={toRGBA(theme.s4, 0.5)}
                        activeOpacity={0.5}
                        right={2}
                        bottom={4}
                        hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                        borderRadius = {80}
                        name='menu' 
                        color={theme.s4} 
                        size={35}
                        backgroundColor='transparent'
                        onPress={() => navigation.openDrawer()} 
                        style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                    />
                </View>
            </View>
            <View style={styles.main_container}>
                <Text style={[styles.header_text, {color: theme.s6}]}>Your Calendar:</Text>
                <Calendar themeData={themeData} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: '100%',
        paddingTop: 0,
        paddingBottom: 0,
    },
    main_container: {
        flex: 1, 
        width: '100%', 
        height: '100%', 
        alignItems: 'flex-start', 
        justifyContent: 'flex-start', 
        flexDirection: 'column',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 0,
    },
    optionsBar: {
        height: 100,
        top: 0,
        paddingLeft: 15,
        paddingRight: 15,
        width: '100%',
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
    },  
    menu_button: {
        alignSelf: 'center',
        padding: 0,
        marginRight: 'auto',
        width: 45,
        maxHeight: 45,
        borderRadius: 40,
        borderWidth: 1,
    },
    header_text: {
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
        left: 2,
        marginBottom: 20,
    },
    cardHeader_text: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 20,
        marginBottom: 15,
        left: 2,
    },
    calendar_container: {
        width: '100%', 
        height: 280,
    },
    calendar_header: {
        width: '100%',
        height: 45,
        flexDirection: 'row',
        borderRadius: 30,
        overflow: 'hidden',
        marginBottom: 10,
    },
});

export default CalendarScreen;