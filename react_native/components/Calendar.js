import React, { useState, useContext, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    ScrollView,
    Dimensions
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

    let dayBoxes = [];
    let firstDayOfMonth = dayOfWeek(1, displayDate.month, displayDate.year);
    for (let i = 0; i < firstDayOfMonth; i++) {
        dayBoxes.push(
            <View key={i} style={styles.day_box} />
        );
    }
    const selectedSameMonthYear = (selectedDate.month === displayDate.month && selectedDate.year === displayDate.year)
    let count = 0;
    for (let i = firstDayOfMonth; i < 42; i++) {
        count++;
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

export const StaticCalendar = ({ dateToday, selectedDate, setSelectedDate, containerStyle, monthSelectorStyle, calendarMonthStyle }) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    
    const [displayDate, setDisplayDate] = useState({
        month: selectedDate.month,
        year: selectedDate.year
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

export const SmallPressableCalendar = (props) => {
    const { month, year, boxSize, theme } = props;

    let dayBoxes = [];
    const DayBox = ({ day }) => {
        return (
            <View style={styles.day_box}>
                <Text style={[styles.date_text, {color: theme.s4}]}>{day}</Text>
            </View>
        );
    }
    let numDays = getDaysOfMonth(month, year);
    let firstDayOfMonth = dayOfWeek(1, month, year);
    for (let i = 0; i < firstDayOfMonth; i++) {
        dayBoxes.push(
            <DayBox key={i} day={null} />
        );
    }
    let count = 0;
    for (let i = firstDayOfMonth; i < 42; i++) {
        count++;
        if (count > numDays) break;
        dayBoxes.push(
            <DayBox key={i} day={count} />
        );
    }

    return (
        <Pressable 
            style={({pressed}) => [
                styles.card, 
                {
                    width: boxSize, 
                    height: boxSize, 
                    borderColor: theme.s2,
                    backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                }
            ]}
            onPress={() => {}}
        >
            <View style={styles.smallCalendarHeader}>
                <Text style={[styles.smallCalendarHeaderText, {color: theme.s4}]}>{monthDict[month - 1]}</Text>
            </View>
            <View style={styles.smallCalendarDaysContainer}>
                {dayBoxes}
            </View>
        </Pressable>
    )
}

const HourBoxes = ({ theme, axis, boxSize, dateToday }) => {
    let theBoxes = [];
    for(let hour = 0; hour < 24; hour++) {
        let isHighlighted;
        if(dateToday.getHours() === hour) {
            isHighlighted = true;
        }
        theBoxes.push(
            <View 
                key={hour} 
                style={[
                    styles.hourBox, 
                    { 
                        width: boxSize.width,
                        height: boxSize.height,
                        backgroundColor: toRGBA(theme.s13, 0.25), 
                        borderRightColor: axis === 'horizontal' ? theme.s4 : 'transparent', 
                        borderBottomColor: axis === 'vertical' ? theme.s4 : 'transparent', 
                    }   
                ]}
            >
                <View 
                    style={[
                        styles.hourBoxLeftDecorator, 
                        { 
                            width: axis === 'vertical' ? 40 : '100%', 
                            height: axis === 'vertical' ? '100%' : 40,
                            backgroundColor: toRGBA(theme.s2, isHighlighted ? 0.75 : 0.25) 
                        }
                    ]}
                >
                    <Text style={[styles.hourText, { color: toRGBA(theme.s6, 0.75) }]}>
                        { hour % 12 === 0 ? 12 : hour - Math.floor(hour / 12) * 12 }{(hour <= 11) ? 'AM' : 'PM'}
                    </Text>
                </View>
            </View>
        );
    }
    return theBoxes;
}

const HourIndicator = ({ theme, axis, boxSize, dateToday }) => {    // Only for aesthetics right now
    let hourBoxSize = (axis === 'vertical') ? boxSize.height : boxSize.width;
    let hour = dateToday.getHours();
    let minute = dateToday.getMinutes();
    let dist = hour * hourBoxSize + minute * hourBoxSize / 60;

    return (
        <View 
            style={[
                styles.hourIndicatorLine, 
                {
                    top: axis === 'vertical' ? dist : 0,
                    left: axis === 'vertical' ? 0 : dist,
                    width: axis === 'vertical' ? '100%' : 1, 
                    height: axis === 'vertical' ? 1 : '100%', 
                    borderColor: theme.s5, 
                }
            ]}
        >
            <View 
                style={[
                    styles.hourIndicatorKnob, 
                    { 
                        top: -5,
                        left: -5, 
                        backgroundColor: theme.s5
                    }
              ]}
            />
        </View>
    );
}

const getRandomKey = (length) => { // only pseudorandom, do not use for any sensitive data
    let result = ''
    let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let charlen = characters.length;
    for(let i = 0; i < length; i ++) {
        result += characters.charAt(Math.floor(Math.random() * charlen));
    }
    return result;
};

function hslStringToHSLA(hslString, opacity)
{
    let alphaComma = hslString.lastIndexOf(',');
    let hsl = hslString.substr(0, alphaComma + 1);
    return hsl + opacity.toString() + ')';
}

/**
 * Renders the eventboxes for the scrolling calendar.
 * 
 * @param {object} theme: theme object
 * @param {object} boxSize: { width, height }
 * @param {string} axis: 'horizontal' or 'vertical'
 * @param {number} decoratorSize: size of each hour box decorator (hour textbox)
 * @returns {array} array of React Components
 */
const EventBoxes = ({ theme, eventData, axis, boxSize, decoratorSize }) => {
    function formatEventData(eventData) {
        // TODO: only include events for the day
        let formattedData = [];
        for (let section = 0; section < eventData.length; section++) {
            let sectionColor = eventData[section].color;
            let sectionEvents = eventData[section].events;
            for (let event of sectionEvents) {
                formattedEvent = {
                    startDate: event.event.startDate,
                    endDate: event.event.endDate,
                    name: event.event.text,
                    startTime: event.event.startTime,
                    endTime: event.event.endTime,
                    color: sectionColor,
                }
                if (isNotToday(formattedEvent.endDate)) {
                    formattedEvent.endTime = '2400';
                }
                formattedData.push(formattedEvent);
            }
        }
        return formattedData;
    }

    function isNotToday({ day, month, year }) {
        let today = new Date();
        if (today.getFullYear() !== year) return true;
        if (today.getMonth() + 1 !== month) return true;
        if (today.getDate() !== day) return true;
        return false;
    }
    
    let theBoxes = []; // array of React Components to return
    let eventDataCopy = formatEventData(eventData);
    let sortedData = eventDataCopy.sort((firstElem, secondElem) => {
        if (firstElem.startTime < secondElem.startTime)
            return -1;
        else if (firstElem.startTime > secondElem.startTime)
            return 1;

        // else the element starting times must be equal, so have the longer event take precedence
        if (firstElem.endTime > secondElem.endTime)
            return -1;
        else if (firstElem.endTime < secondElem.endTime)
            return 1;
        else
            return 0;
    });

    let earliestPerHour = [new Array(24).fill(0)];
    let numRows = 1;
    let numEvents = sortedData.length;

    const boxMargin = 15;

    for (let currRow = 0; currRow < numRows; currRow++) {
        let toErase = [];
        for (let currEvent = 0; currEvent < numEvents; currEvent++) {
            let event = sortedData[currEvent];

            let startHour, endHour, startMinute, endMinute;
            let xStart, yStart, xEnd, yEnd;
            let extensionSize = 45;
            let dividend = (axis === 'vertical') ? boxSize.height : boxSize.width;

            startHour = Number(event.startTime.substr(0, 2));
            endHour = Number(event.endTime.substr(0, 2));
            startMinute = Number(event.startTime.substr(2, 2));
            endMinute = Number(event.endTime.substr(2, 2));

            if (earliestPerHour[currRow][startHour] <= startMinute) {
                const randomKey = getRandomKey(10);

                if (axis === 'horizontal') {
                    xStart = startHour * dividend + dividend / 60 * startMinute;
                    xEnd = endHour * dividend + dividend / 60 * endMinute;
                    yStart = decoratorSize + boxMargin + currRow * boxMargin + currRow * extensionSize;
                    yEnd = yStart + extensionSize;
                } else {
                    xStart = decoratorSize + boxMargin + currRow * boxMargin + currRow * extensionSize;
                    xEnd = xStart + extensionSize;
                    yStart = startHour * dividend + dividend / 60 * startMinute;
                    yEnd = endHour * dividend + dividend / 60 * endMinute;
                }
                //TODO: On eventbox press, open a modal showing the details of the event
                let eventStartDate = event.startDate;
                if (!isNotToday(eventStartDate)) theBoxes.push(
                    <View 
                        key={randomKey} 
                        style={{ 
                            justifyContent: 'center',
                            padding: 10,
                            position: 'absolute', 
                            top: yStart, 
                            left: xStart,
                            width: xEnd - xStart, 
                            height: yEnd - yStart,
                            borderRadius: 0,
                            borderTopWidth: axis === 'vertical' ? 5 : 0,
                            borderLeftWidth: axis === 'vertical' ? 0 : 5,
                            borderColor: sortedData[currEvent].color,
                            backgroundColor: hslStringToHSLA(sortedData[currEvent].color, 0.5), 
                        }}
                    >
                        <Text 
                            style={[
                                styles.eventBoxText, 
                                { 
                                    alignSelf: axis === 'vertical' ? 'center' : null,
                                    width: axis === 'vertical' ? yEnd - yStart - 20 : null,
                                    height: axis === 'vertical' ? 'auto' : null,
                                    transform: [{rotateZ: axis === 'vertical' ? '90deg' : '0deg'}], 
                                    color: toRGBA(theme.s6, 0.8),
                                }
                            ]}
                            numberOfLines={1}
                        >
                            { sortedData[currEvent].name }
                        </Text>
                    </View>
                );

                toErase.push(sortedData[currEvent]);
                if (endHour > startHour) {
                    for (let currHourUntilEnd = startHour; currHourUntilEnd < endHour; currHourUntilEnd++) {
                        earliestPerHour[currRow][currHourUntilEnd] = 60;
                    }
                }
                earliestPerHour[currRow][endHour] = endMinute;
            }
        }
        for (let itemToErase = 0; itemToErase < toErase.length; itemToErase++) {
            let indexToErase = sortedData.findIndex(compElem => compElem.name === toErase[itemToErase].name);
            sortedData.splice(indexToErase, 1);
            numEvents--;
        }
        if (numEvents > 0) {
            numRows++;
            earliestPerHour.push(new Array(24).fill(0));
        }
    }
    return theBoxes;
}

export const ScrollingCalendar = ({ theme, eventData }) => {
    const [axis, setAxis] = useState('horizontal');
    const [scrollPositon, setScrollPosition] = useState({
        x: 0,
        y: 0
    });
    const [hourBoxSize, setHourBoxSize] = useState({
        width: 140,
        height: '100%'
    });

    const handleScroll = (event) => {
        const xPosition = event.nativeEvent.contentOffset.x;
        const yPosition = event.nativeEvent.contentOffset.y;
        setScrollPosition({ x: xPosition, y: yPosition });
    }

    const handleRotate = () => {
        prevAxis = axis;
        setHourBoxSize({
            width: prevAxis === 'vertical' ? 140 : Dimensions.get('window').width - 15,
            height: prevAxis === 'vertical' ? '100%' : 140 
        });
        setAxis(axis === 'horizontal' ? 'vertical' : 'horizontal');
    }

    let dateToday = new Date();

    return (
        <View>
            <Pressable
                style={({pressed}) => [
                    {
                        opacity: pressed ? 0.5 : 1,
                    },
                    styles.dayViewRotateButton
                ]}
                onPress={() => {
                    handleRotate();
                }}
            >
                <MaterialDesignIcons name={axis === 'vertical' ? 'rotate-right' : 'rotate-left'} size={25} color={theme.s4} />
            </Pressable>
            <ScrollView
                // contentOffset={{ x: axis === 'vertical' ? 0 : hourBoxSize.width * 8, y: axis === 'vertical' ? hourBoxSize.height * 8 : 0 }} 
                onScroll={handleScroll}
                scrollEventThrottle={16}
                horizontal={axis !== 'vertical'} 
                containerStyle={[
                    { 
                        overflow: 'visible',
                        width: axis === 'vertical' 
                            ? '100%' 
                            : hourBoxSize.width * 24,
                        height: axis === 'vertical'
                            ? hourBoxSize.height * 24
                            : hourBoxSize.height * 24,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                <HourIndicator theme={theme} axis={axis} boxSize={hourBoxSize} dateToday={dateToday} />
                <HourBoxes theme={theme} axis={axis} boxSize={hourBoxSize} scrollPosition={scrollPositon} dateToday={dateToday} />
                <EventBoxes theme={theme} axis={axis} boxSize={hourBoxSize} decoratorSize={40} eventData={eventData} />
            </ScrollView>
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
    card: {
        margin: 2.5,
        marginBottom: 15, 
        borderWidth: 1, 
        borderRadius: 15,
        overflow: 'hidden',
    },
    smallCalendarHeader: {
        flex: 1, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallCalendarHeaderText: {
        fontFamily: 'Proxima Nova Bold',
    },
    smallCalendarDaysContainer: {
        flex: 5, 
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 5, 
        paddingTop: 0,
    },
    dayViewRotateButton: {
        position: 'absolute',
        top: -50,
        right: 0,
        width: 25,
        height: 25,
    },
    hourBox: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    hourBoxLeftDecorator: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    hourText: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 8.5,
    },
    hourIndicatorLine: { 
        position: 'absolute',
        top: 0, 
        left: 0, 
        zIndex: 1,
        borderTopWidth: 1, 
        borderLeftWidth: 1, 
    },
    hourIndicatorKnob: {
        position: 'absolute',
        width: 10, 
        height: 10, 
        borderRadius: 15,
    },
    eventBoxText: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 16,
    },
});