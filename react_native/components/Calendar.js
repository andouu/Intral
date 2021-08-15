import React, { useState, useContext, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
} from 'react-native';
import { toRGBA } from './utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeContext } from './themeContext';

const monthDict = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayOfWeek = (d, m, y) => { // https://www.geeksforgeeks.org/find-day-of-the-week-for-a-given-date/
    let t = [ 0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4 ];
    y -= (m < 3) ? 1 : 0;
    return Math.round(( y + y/4 - y/100 + y/400 + t[m - 1] + d) % 7) % 7;
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
        <View style={styles.day_box}>
            <Pressable
                style={({pressed}) => [
                    styles.day_selected,
                    {backgroundColor: isToday ? theme.s6 : (isSelected ? theme.s8 : (pressed ? theme.s13 : 'transparent'))}
                ]}
                onPress={() => setSelectedDate({
                    day: dayNumber,
                    month: month,
                    year: year
                })}
            >
                <Text style={[styles.date_text,
                    {color: isToday ? theme.s1 : (isSelected ? theme.s6 : theme.s4)}
                ]}>
                    {dayNumber}
                </Text>
            </Pressable>
        </View>
    );
}

const CalendarMonth = ({ calendarMonthStyle, dateToday, displayDate, selectedDate, setSelectedDate, theme }) => {
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
                style={[styles.day_label, { borderBottomColor: theme.s4 }]}
            >
                <Text 
                    style={[styles.day_label_text, {
                        color: index === todayDayOfWeek && todaySameMonthYear
                            ? theme.s6 
                            : theme.s4,
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
            <View key={i} style={styles.day_box} />
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
        <View style={[styles.calendar_month_container, calendarMonthStyle]}>
            <View style={styles.labels_container}>
                {dayLabels}
            </View>
            <View style={styles.days_container}>
                {dayBoxes}
            </View>
        </View>
    );
}

const Calendar = ({ dateToday, selectedDate, setSelectedDate, isRefreshing, containerStyle, monthSelectorStyle, calendarMonthStyle }) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    
    const [displayDate, setDisplayDate] = useState({
        month: dateToday.getMonth() + 1,
        year: dateToday.getFullYear()
    }); // what calendar displays, only month and year

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

    useEffect(() => { // reload calendar when refreshing (i.e. when dateToday changes)
        setSelectedDate({
            day: dateToday.getDate(), //day as in day of the month
            month: dateToday.getMonth() + 1,
            year: dateToday.getFullYear()
        });
        setDisplayDate({
            month: dateToday.getMonth() + 1,
            year: dateToday.getFullYear()
        });
    }, [isRefreshing]);

    return (
        <View style={[styles.container, containerStyle]}>
            <View
                style={[
                    styles.month_selecter,
                    {
                        // TODO: uncomment below lines after settings merge with main
                        // borderWidth: themeData.cardOutlined 
                        //     ? 1.5
                        //     : 0,
                        borderWidth: 1.5,
                        borderColor: theme.s2,
                    },
                    monthSelectorStyle,
                ]}
            >
                <Pressable 
                    style={({pressed}) => [styles.selector_arrow_button, {
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                    }]}
                    onPress={() => handleDisplayDateChange(-1)}
                > 
                    {/* Left arrow */}
                    <MaterialDesignIcons name='chevron-left' size={35} color={theme.s4} style={{right: 2}} />
                </Pressable>
                <View style={styles.selector_date_container}> 
                    {/* Date */}
                    <Text style={[styles.selector_date_text, {color: theme.s6}]}>{monthDict[displayDate.month - 1]} {displayDate.year}</Text>
                </View>
                <Pressable 
                    style={({pressed}) => [styles.selector_arrow_button, {
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                    }]}
                    onPress={() => handleDisplayDateChange(1)}
                > 
                    {/* Right arrow */}
                    <MaterialDesignIcons name='chevron-right' size={35} color={theme.s4} style={{left: 2}} />
                </Pressable>
            </View>
            <CalendarMonth
                calendarMonthStyle={calendarMonthStyle}
                dateToday={dateToday}
                displayDate={displayDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                theme={theme}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    month_selecter: {
        width: '100%',
        height: 45,
        borderRadius: 30,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 5,
    },
    selector_date_container: {
        flex: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selector_arrow_button: {
        flex: 3,
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: 50,
    },
    selector_date_text: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 20,
    },
    calendar_month_container: {
        width: '100%',
        height: '100%',
    },
    labels_container: {
        flex: 1,
        flexDirection: 'row',
    },
    day_label: {
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    day_label_text: {
        fontFamily: 'Proxima Nova Bold', 
        fontSize: 12, 
    },
    days_container: {
        flex: 6,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    day_box: {
        width: '14.2857%', //100/7+'%' 
        height: '16.6666%', //100/6+'%'
        alignItems: 'center',
        justifyContent: 'center',
    },
    day_selected: {
        width: 25,
        height: 25,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    date_text: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
    },
});

export default Calendar;