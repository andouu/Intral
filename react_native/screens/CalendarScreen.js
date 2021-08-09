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
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const monthDict = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayOfWeek = (d, m, y) => { // https://www.geeksforgeeks.org/find-day-of-the-week-for-a-given-date/
    let t = [ 0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4 ];
    y -= (m < 3) ? 1 : 0;
    return Math.round(( y + y/4 - y/100 + y/400 + t[m - 1] + d) % 7) % 7;
}

const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}

const getDaysOfMonth = (month, year) => { // days in month, month is 1-indexed
    if (month === 2) {
        if (year % 400 === 0)
            return 29;
        else if (year % 100 === 0)
            return 28;
        else if (year % 4 === 0)
            return 29;
        else
            return 28;
    } else if (month === 4 || month === 6 || month === 9 || month === 11) {
        return 30;
    } else {
        return 31;
    }
};

const CalendarDay = ({ dayNumber, month, year, isToday=false, isSelected=false, setSelectedDate, theme }) => {
    return (
        <View style={styles.calendar_day}>
            <Pressable
                style={({pressed}) => [
                    styles.calendar_day_selected,
                    {backgroundColor: isToday ? theme.s6 : (isSelected ? theme.s8 : (pressed ? theme.s13 : 'transparent'))}
                ]}
                onPress={() => setSelectedDate({
                    day: dayNumber,
                    month: month,
                    year: year
                })}
            >
                <Text style={{fontFamily: 'ProximaNova-Regular', fontSize: 15, color: isToday ? theme.s1 : (isSelected ? theme.s6 : theme.s4)}}>
                    {dayNumber}
                </Text>
            </Pressable>
        </View>
    );
}

const SingleCalendar = ({ size, hwr=75, style, theme, dateToday, displayDate, selectedDate, setSelectedDate }) => { // hwr = height width ratio percent    
    let height = size * hwr/100;
    if (typeof size === 'string') {
        height = parseInt(size) * (hwr/100) + '%';
    }

    const dayToday = dateToday.getDate();
    const monthToday = dateToday.getMonth() + 1;
    const yearToday = dateToday.getFullYear();
    const todayDayOfWeek = dateToday.getDay();
    const todaySameMonthYear = (monthToday === displayDate.month && yearToday === displayDate.year);

    const numDays = getDaysOfMonth(displayDate.month, displayDate.year);

    let dayLabels = daysOfWeek.map((day, index) => {
        return (
            <View 
                key={index} 
                style={[styles.calendar_day_label, {borderBottomColor: theme.s4}]}
            >
                <Text 
                    style={[styles.calendar_day_label_text, {
                        color: index === todayDayOfWeek && todaySameMonthYear
                            ? theme.s6 
                            : theme.s4
                    }]}
                >
                    {day.substr(0, 3)}
                </Text>
            </View>
        );
    });

    let dayBoxes = []
    let firstDayOfMonth = dayOfWeek(1, displayDate.month, displayDate.year);
    for (let i = 0; i < firstDayOfMonth; i ++) {
        dayBoxes.push(
            <View key={i} style={styles.calendar_day}/>
        );
    }
    const selectedSameMonthYear = (selectedDate.month === displayDate.month && selectedDate.year === displayDate.year)
    let count = 0;
    for (let i = firstDayOfMonth; i < 42; i ++) {
        count ++;
        if (count > numDays) break;
        const isToday = (todaySameMonthYear && count === dayToday);
        const isSelected = (selectedSameMonthYear && count === selectedDate.day);
        dayBoxes.push(
            <CalendarDay
                key={i}
                theme={theme}
                dayNumber={count}
                month={displayDate.month}
                year={displayDate.year}
                isToday={isToday}
                isSelected={isSelected}
                setSelectedDate={setSelectedDate}
            />
        );
    }

    return (
        <Animated.View style={[{width: size, height: height}, style]}>
            <View style={styles.calendar_labels_container}>
                {dayLabels}
            </View>
            <View style={styles.calendar_days_container}>
                {dayBoxes}
            </View>
        </Animated.View>
    );
}

const Calendar = ({ selectedDate, setSelectedDate, dateToday, theme }) => {    
    const [displayDate, setDisplayDate] = useState({
        month: dateToday.getMonth() + 1,
        year: dateToday.getFullYear()
    }); // what calendar displays, only month and year

    const isFocused = useIsFocused();

    const handleDisplayDateChange = (deltaMonth) => {
        let newMonth = (displayDate.month + deltaMonth);
        let yearChange = 0;
        if (newMonth < 1)
        {
            newMonth += 12;
            yearChange = -1;
            if (displayDate.year + yearChange < 1900) return;
        }
        else if (newMonth > 12)
        {
            newMonth -= 12;
            yearChange = 1;
        }
        setDisplayDate({
            month: newMonth,
            year: displayDate.year + yearChange,
        });
    }

    useEffect(() => { // reload calendar
        setSelectedDate({
            day: dateToday.getDate(), //day as in day of the month
            month: dateToday.getMonth() + 1,
            year: dateToday.getFullYear()
        });
        setDisplayDate({
            month: dateToday.getMonth() + 1,
            year: dateToday.getFullYear()
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
                    onPress={() => handleDisplayDateChange(-1)}
                > 
                    {/* Left arrow */}
                    <MaterialDesignIcons name='chevron-left' size={35} color={theme.s4} style={{right: 2}} />
                </Pressable>
                <View style={{flex: 16, alignItems: 'center', justifyContent: 'center'}}> 
                    {/* Date */}
                    <Text style={{fontFamily: 'ProximaNova-Regular', fontSize: 20, color: theme.s6}}>{monthDict[displayDate.month - 1]} {displayDate.year}</Text>
                </View>
                <Pressable 
                    style={({pressed}) => [{
                        flex: 3, 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 50,
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                    }]}
                    onPress={() => handleDisplayDateChange(1)}
                > 
                    {/* Right arrow */}
                    <MaterialDesignIcons name='chevron-right' size={35} color={theme.s4} style={{left: 2}} />
                </Pressable>
            </View>
            <SingleCalendar
                size={'100%'}
                hwr={80}
                theme={theme}
                dateToday={dateToday}
                displayDate={displayDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
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
        <View style={[styles.eList_btn_group, {backgroundColor: theme.s1, borderColor: theme.s13}, style]}>
            <Animated.View style={[styles.eList_selector, {width: groupWidth/3 - 5, backgroundColor: theme.s8}, animatedSelectedIndicatorStyle]} /> 
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
        month: dateToday.getMonth() + 1,
        year: dateToday.getFullYear()
    });
    const [range, setRange] = useState('Today');
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
            fontSize: withTiming(eventListExpanded ? 30 : 25, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
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
    let selectedDayOfWeek = dayOfWeek(selectedDate.day, selectedDate.month, selectedDate.year);
    switch(range) {
        case 'Today':
            eventListSubheaderText = `${daysOfWeek[selectedDayOfWeek]}, ${selectedDate.month}/${selectedDate.day}/${selectedDate.year}`;
            break;
        case 'Tomorrow':
            const dateTomorrow = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
            dateTomorrow.setDate(dateTomorrow.getDate() + 1);
            
            const tmrOfSelectedDayOfWeek = dayOfWeek(dateTomorrow.getDate(), dateTomorrow.getMonth() + 1, dateTomorrow.getFullYear());
            eventListSubheaderText = `${daysOfWeek[tmrOfSelectedDayOfWeek]}, ${dateTomorrow.getMonth() + 1}/${dateTomorrow.getDate()}/${dateTomorrow.getFullYear()}`;
            break;
        case 'This Week':            
            let firstDayOfWeek = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
            firstDayOfWeek.setDate(firstDayOfWeek.getDate() - selectedDayOfWeek);

            let lastDayOfWeek = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
            lastDayOfWeek.setDate(lastDayOfWeek.getDate() + (7 - selectedDayOfWeek - 1));

            eventListSubheaderText = `Sun, ${firstDayOfWeek.getMonth() + 1}/${firstDayOfWeek.getDate()}/${lastDayOfWeek.getFullYear()} - Sat, ${lastDayOfWeek.getMonth() + 1}/${lastDayOfWeek.getDate()}/${lastDayOfWeek.getFullYear()}`
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
                <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} dateToday={dateToday} theme={theme} />
                <Animated.View style={[styles.event_list_container, {backgroundColor: theme.s1}, animatedEventListStyle]}>
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
        fontSize: 30,
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
    calendar_labels_container: {
        flex: 2,
        flexDirection: 'row',
        marginBottom: 10
    },
    calendar_day_label: {
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
        borderBottomWidth: StyleSheet.hairlineWidth
    },
    calendar_day_label_text: {
        fontFamily: 'Proxima Nova Bold', 
        fontSize: 12, 
    },
    calendar_days_container: {
        flex: 10,
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    calendar_day: {
        width: '14.2857%', //100/7+'%' 
        height: '16.6666%', //100/6+'%'
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendar_day_selected: {
        width: 25,
        height: 25,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center'
    },
    eList_selector: {
        height: '100%',
        position: 'absolute',
        top: 5,
        borderRadius: 30
    },
    event_list_container: {
        width: '100%',
        height: '100%'
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
        borderWidth: 1.5
    },
    btn_group_text: {
        fontFamily: 'Proxima Nova Bold',
    },
});

export default CalendarScreen;