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
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayOfWeek(d, m, y) { // https://www.geeksforgeeks.org/find-day-of-the-week-for-a-given-date/
    let t = [ 0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4 ];
    y -= (m < 3) ? 1 : 0;
    return ( y + y/4 - y/100 + y/400 + t[m-1] + d) % 7;
}

const CalendarDay = ({ displayDay, month, year, theme }) => {
    const dateToday = new Date();
    const dayToday = dateToday.getDate();
    const monthToday = dateToday.getMonth();
    const yearToday = dateToday.getFullYear();

    const sameDay = (displayDay === dayToday && monthToday === month && yearToday === year);

    return (
        <View style={[styles.calendar_day, {}]}>
            <View style={[styles.calendar_day_selected, {backgroundColor: sameDay ? theme.s6 : 'transparent'}]}>
                <Text style={{fontFamily: 'ProximaNova-Regular', right: 0.4, color: sameDay ? theme.s1 : theme.s4}}>
                    {displayDay}
                </Text>
            </View>
        </View>
    );
}

const SingleCalendar = ({ size, hwr=75, view='single', style, theme, month, year }) => { // hwr = height width ratio
    let height = size * hwr/100;
    if(typeof size === 'string') {
        height = parseInt(size) * (hwr/100) + '%';
    }
    const getDaysOfMonth = (month) => { // days in month
        if(month === 2) {
            if(year % 400 === 0)
                return 29;
            else if(year % 100 === 0)
                return 28;
            else if(year % 4 === 0)
                return 29;
            else
                return 28;
        } else if(month === 4 || month === 6 || month === 9 || month === 11) {
            return 30;
        } else {
            return 31;
        }
    }
    const numDays = getDaysOfMonth(month+1);

    let dayLabels = daysOfWeek.map((day, index) => {
        return (
            <View 
                key={index} 
                style={{
                    flex: 1, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderBottomWidth: StyleSheet.hairlineWidth, 
                    borderBottomColor: theme.s4,
                }}
            >
                <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 12, color: theme.s4}}>{day.substr(0, 2)}</Text>
            </View>
        );
    });

    let dayBoxes = [];
    let count = '';
    let firstDayOfMonth = Math.round(dayOfWeek(1, month+1, year))%7;
    let startedCounting = false;
    let finishedCounting = false;
    for(let i=0; i<42; i++) {
        if(i%7 === firstDayOfMonth && !startedCounting && !finishedCounting) {
            startedCounting = true;
            count = 0;
        }
        if(startedCounting) {
            count++;
            if(count > numDays) {
                count = '';
                startedCounting = false;
                finishedCounting = true;
            }
        }
        dayBoxes.push(
            <CalendarDay key={i} theme={theme} displayDay={count} month={month} year={year} />
        );
    }

    return (
        <Animated.View style={[{width: size, height: height}, style]}>
            <View style={{flex: 2, flexDirection: 'row', marginBottom: 10}}>
                {dayLabels}
            </View>
            <View style={{flex: 10, flexDirection: 'row', flexWrap: 'wrap'}}>
                {dayBoxes}
            </View>
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
        });
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
            <SingleCalendar size={'100%'} hwr={80} theme={theme} month={selectedDate.month} year={selectedDate.year} />
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
        height: 300,
    },
    calendar_header: {
        width: '100%',
        height: 45,
        flexDirection: 'row',
        borderRadius: 30,
        overflow: 'hidden',
        marginBottom: 10,
    },
    calendar_day: {
        width: 100/7+'%', 
        height: 100/6+'%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendar_day_selected: {
        width: 25, 
        height: 25, 
        borderRadius: 30, 
        alignItems: 'center', 
        justifyContent: 'center', 
    }
});

export default CalendarScreen;