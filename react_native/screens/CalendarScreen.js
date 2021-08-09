import React, { useState, useContext, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Dimensions,
    PixelRatio,
} from 'react-native';
import { toRGBA } from '../components/utils';
import { useIsFocused } from '@react-navigation/core';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeContext } from '../components/themeContext';
import Animated, {
    useSharedValue,
    withTiming,
    withSpring,
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

const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}

const CalendarDay = ({ displayDay, sameDay=false, theme }) => {

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

    const dateToday = new Date();
    const dayToday = dateToday.getDate();
    const monthToday = dateToday.getMonth();
    const yearToday = dateToday.getFullYear();
    
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
        const sameMonthYear = (monthToday === month && yearToday === year);
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
                <Text 
                    style={{
                        fontFamily: 'Proxima Nova Bold', 
                        fontSize: 12, 
                        color: index === Math.round(dayOfWeek(dayToday, month+1, year))%7 && sameMonthYear
                            ? theme.s6 
                            : theme.s4
                    }}
                >
                    {day.substr(0, 3)}
                </Text>
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
        const sameDay = (count === dayToday && monthToday === month && yearToday === year);
        dayBoxes.push(
            <CalendarDay key={i} theme={theme} displayDay={count} month={month} year={year} sameDay={sameDay} />
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

const Calendar = ({ themeData, selectedDate, setSelectedDate, dateToday }) => {    
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
            ...selectedDate,
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

const EListBtnGroup = ({ theme, style, range, setRange }) => {
    const rangeDict = {
        Today: 0,
        Tomorrow: 1,
        'This Week': 2,
    }
    const groupWidth = widthPctToDP(80, 20);

    const animatedSelectedIndicatorStyle = useAnimatedStyle(() => {
        return {
            left: withTiming(rangeDict[range] * groupWidth/3 + 5, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    return (
        // TODO: refactor below lines to use themecontext cardOutlined after merge with settings/main
        <View style={[styles.eList_btn_group, {backgroundColor: theme.s1, borderWidth: 1.5, borderColor: theme.s13}, style]}>
            <Animated.View style={[{width: groupWidth/3 - 5, height: '100%', position: 'absolute', top: 5, borderRadius: 30, backgroundColor: theme.s8}, animatedSelectedIndicatorStyle]} /> 
            <Pressable
                style={{
                    flex: 1, 
                    height: '100%', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                }}
                onPress={() => setRange('Today')}
            >
                <Text style={[styles.btn_group_text, {color: theme.s6}]}>Today</Text>
            </Pressable>
            <Pressable
                style={{
                    flex: 1, 
                    height: '100%', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                }}
                onPress={() => setRange('Tomorrow')}
            >
                <Text style={[styles.btn_group_text, {color: theme.s6}]}>Tomorrow</Text>
            </Pressable>
            <Pressable
                style={{
                    flex: 1, 
                    height: '100%', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                }}
                onPress={() => setRange('This Week')}
            >
                <Text style={[styles.btn_group_text, {color: theme.s6}]}>Week</Text>
            </Pressable>
        </View>
    );
}

const CalendarScreen = ({ navigation }) => {
    const [eventListExpanded, setEventListExpanded] = useState(false);
    const dateToday = new Date();
    const [selectedDate, setSelectedDate] = useState({
        day: dateToday.getDate(),
        month: dateToday.getMonth(),
        year: dateToday.getFullYear(),
    });
    const [range, setRange] = useState('Tomorrow');
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;

    const animatedEventListStyle = useAnimatedStyle(() => {
        return {
            top: withTiming(eventListExpanded ? -360 : 0, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    const animatedEventListHeaderStyle = useAnimatedStyle(() => {
        return {
            fontSize: withTiming(eventListExpanded ? 35 : 25, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
            marginBottom: withTiming(eventListExpanded ? 5 : 20, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    const animatedEventListSubheaderStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(eventListExpanded ? 1 : 0, {duration: 1400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
            fontSize: withTiming(eventListExpanded ? 18 : 0, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    let eventListSubheaderText;
    let selectedDayOfWeek = Math.round(dayOfWeek(selectedDate.day, selectedDate.month+1, selectedDate.year))%7;
    switch(range) {
        case 'Today':
            eventListSubheaderText = `${daysOfWeek[selectedDayOfWeek]}, ${selectedDate.month+1}/${selectedDate.day}/${selectedDate.year}`;
            break;
        case 'Tomorrow':
            const dateTomorrow = new Date(dateToday);
            dateTomorrow.setDate(dateTomorrow.getDate() + 1);

            const tmrOfSelectedDayOfWeek = Math.round(dayOfWeek(dateTomorrow.getDate(), dateTomorrow.getMonth()+1, dateTomorrow.getFullYear()))%7;
            eventListSubheaderText = `${daysOfWeek[tmrOfSelectedDayOfWeek]}, ${dateTomorrow.getMonth()+1}/${dateTomorrow.getDate()}/${dateTomorrow.getFullYear()}`;
            break;
        case 'This Week':
            let firstDayOfWeek, lastDayOfWeek;
            
            firstDayOfWeek = new Date(dateToday);
            if(selectedDayOfWeek !== 0) {
                firstDayOfWeek.setDate(firstDayOfWeek.getDate() - selectedDayOfWeek);
            }

            lastDayOfWeek = new Date(dateToday);
            lastDayOfWeek.setDate(lastDayOfWeek.getDate() + (7 - selectedDayOfWeek));

            eventListSubheaderText = `${firstDayOfWeek.getMonth()+1}/${firstDayOfWeek.getDate()}/${lastDayOfWeek.getFullYear()} - ${lastDayOfWeek.getMonth()+1}/${lastDayOfWeek.getDate()}/${lastDayOfWeek.getFullYear()}`
            break;
    }
    
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
                <Animated.View style={[styles.header_text, {left: 0, width: '100%'}, /* animatedMainHeaderStyle */]}>
                    <Text style={[styles.header_text, {color: theme.s6, marginBottom: 0}]}>Your Calendar:</Text>
                </Animated.View>
                <Calendar themeData={themeData} selectedDate={selectedDate} setSelectedDate={setSelectedDate} dateToday={dateToday} />
                <Animated.View style={[{width: '100%', height: '100%', backgroundColor: theme.s1}, animatedEventListStyle]}>
                    <Animated.Text style={[styles.header_text, {color: theme.s6}, animatedEventListHeaderStyle]}>{range}'s Events:</Animated.Text>
                    <Animated.Text style={[{fontFamily: 'Proxima Nova Bold', left: 5, color: theme.s4}, animatedEventListSubheaderStyle]}>
                        {eventListSubheaderText}
                    </Animated.Text>
                    <Pressable
                        style={({pressed}) => [
                            {
                                position: 'absolute',
                                right: 0,
                                width: 35,
                                height: 35,
                                top: -5,
                                borderRadius: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                            },
                        ]}
                        onPress={() => {
                            setEventListExpanded(!eventListExpanded);
                        }}
                    >
                        <MaterialDesignIcons name='arrow-expand' size={18} color={theme.s4} />
                    </Pressable>  
                </Animated.View>
                <EListBtnGroup theme={theme} range={range} setRange={setRange} />
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
        marginBottom: 5,
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
    },
    eList_btn_group: {
        width: '80%',
        height: 40, 
        position: 'absolute',
        left: '15%',
        bottom: 25,
        padding: 5,
        flexDirection: 'row',
        borderRadius: 30,
    },
    btn_group_text: {
        fontFamily: 'Proxima Nova Bold',
    },
});

export default CalendarScreen;