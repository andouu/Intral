import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Dimensions,
    PixelRatio,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StaticCalendar, SmallPressableCalendar, ScrollingCalendar, isToday, isTomorrow, isThisWeek, isSameDate } from '../components/Calendar';
import { toRGBA, heightPctToDP, hslStringToHSLA } from '../components/utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeContext } from '../components/themeContext';
import Animated, {
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

function random_rgb() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + 1 + ')';
}

const Header = ({ theme, navigation, changeView }) => {
    return (
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
            <Pressable 
                style={({pressed}) => [
                    styles.calendarViewBtnContainer,
                    {
                        opacity: pressed ? 0.5 : 1, 
                        backgroundColor: pressed ? theme.s4 : 'transparent',
                        borderColor: pressed ? theme.s4 : toRGBA(theme.s4, 0.5),
                    },  
                ]}
                onPress={() => changeView()}
            >
                <MaterialDesignIcons name='calendar-multiple' color={toRGBA(theme.s4, 0.5)} size={23} />
            </Pressable>
        </View>
    );
}

const EventListBtnGroup = (props) => {
    const { theme, style, range, setRange } = props;
    const rangeDict = {
        'Today': 0,
        'Tomorrow': 1,
        'This Week': 2,
    }
    let displayRange = range in rangeDict;
    const groupWidth = widthPctToDP(80, 20);

    const animatedSelectedIndicatorStyle = useAnimatedStyle(() => {
        let leftPos = displayRange ? rangeDict[range] * groupWidth/3 + 5 : 0; // extra safety in case somehow this is displayed when there is nothing to display
        return {
            left: withTiming(leftPos, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    return (
        // TODO: refactor below lines to use themecontext cardOutlined after merge with settings/main
        <View style={[styles.eList_btn_group, { backgroundColor: theme.s1, borderColor: theme.s13 }, style]}>
            {displayRange && 
                <Animated.View style={[styles.eList_selector, { width: groupWidth / 3 - 5, backgroundColor: theme.s8 }, animatedSelectedIndicatorStyle]} />
            }
            <TouchableOpacity
                style={{
                    flex: 1, 
                    height: '100%', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                }}
                onPress={() => setRange('Today')}
            >
                <Text style={[styles.btn_group_text, {color: theme.s6}]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    flex: 1, 
                    height: '100%', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                }}
                onPress={() => setRange('Tomorrow')}
            >
                <Text style={[styles.btn_group_text, {color: theme.s6}]}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    flex: 1, 
                    height: '100%', 
                    alignItems: 'center',
                    justifyContent: 'center', 
                }}
                onPress={() => setRange('This Week')}
            >
                <Text style={[styles.btn_group_text, {color: theme.s6}]}>Week</Text>
            </TouchableOpacity>
        </View>
    );
}

const Assignment = ({ theme, color, text }) => {
    return (
        <View style={[styles.assignment, { borderLeftColor: color, backgroundColor: hslStringToHSLA(color, 0.5) }]}>
            <Text style={[styles.assignment_text, { color: theme.s1 }]}>{text}</Text>
        </View>
    );
}

const CalendarScreen = ({ navigation }) => {
    const dateToday = new Date();
    const [eventListExpanded, setEventListExpanded] = useState(false);
    const [expandedHeight, setExpandedHeight] = useState(400);
    const [selectedView, setSelectedView] = useState(null);
    const [selectedDate, setSelectedDate] = useState({
        day: dateToday.getDate(),
        month: dateToday.getMonth() + 1,
        year: dateToday.getFullYear()
    });
    const [range, setRange] = useState('Today');
    const [eventSections, setEventSections] = useState([]);
    const [formattedEvents, setFormattedEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const viewTypes = ['month', 'year', 'day'];             // types of views the user can switch between: month(default), year(multiple calendar view), day(scrolling), etc.

    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;

    function formatEvents(eventSections) {
        let formattedEvents = [];
        eventSections.forEach(section => {
            section.events.forEach(event => {
                let formattedEvent = event;
                formattedEvent.color = section.color;
                formattedEvent.section = section.name;
                formattedEvents.push(formattedEvent);
            });
        });
        setFormattedEvents(formattedEvents);
    }

    // today, tomorrow, this week
    function sortEventsByRange(events, range) {
        switch (range) {
            case 'Today':
                const eventsToday = events.filter(event => isToday(event.event.startDate));
                return eventsToday;
            case 'Tomorrow':
                const eventsTomorrow = events.filter(event => isTomorrow(event.event.startDate));
                return eventsTomorrow;
            case 'This Week':
                const eventsThisWeek = events.filter(event => isThisWeek(event.event.startDate));
                return eventsThisWeek;
            case 'User Selected Date':
                const eventsOnDate = events.filter(event => isSameDate(event.event.startDate, selectedDate));
                return eventsOnDate;
            default:
                return events;
        }
    }

    const animatedEventListStyle = useAnimatedStyle(() => {
        return {
            bottom: withTiming(eventListExpanded ? expandedHeight : -20, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
            height: withTiming(eventListExpanded ? '90%' : '35%', {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)})
        }
    });

    const animatedEventListHeaderStyle = useAnimatedStyle(() => {
        return {
            fontSize: withTiming(eventListExpanded ? 30 : 25, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
            marginBottom: withTiming(eventListExpanded ? 5 : 20, {duration: 200, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
            top: withTiming(eventListExpanded ? 0 : 15, {duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
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
    switch (range) {
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

    let calendarBoxes = useMemo(() => {
        let boxes = [];
        let boxSize = Dimensions.get('window').width / 2 - 20;
        for(let currMonth = 0; currMonth < 12; currMonth++) {
            boxes.push(
                <SmallPressableCalendar key={currMonth} month={currMonth + 1} year={dateToday.getFullYear()} boxSize={boxSize} theme={theme} />
            );
        }
        return (
            <ScrollView contentContainerStyle={styles.calendarYearViewContainer}>
                { boxes }
            </ScrollView>
        )
    }, []);

    function handleSelectDate(date) {
        setSelectedDate({
            day: date.day,
            month: date.month,
            year: date.year
        });
        setRange('User Selected Date');
    }

    let CalendarComponent = ({ viewTypeIdx }) => {
        let viewType = viewTypes[viewTypeIdx];
        
        switch(viewType) {
            case 'month':
                return (
                    <View style={{ width: '100%', height: '45%', marginBottom: 20 }}>
                        <StaticCalendar 
                            dateToday={dateToday} 
                            selectedDate={selectedDate} 
                            setSelectedDate={handleSelectDate} 
                            containerStyle={{ marginBottom: 5}} 
                        />
                    </View>
                );
            case 'year':
                return (
                    calendarBoxes
                );
            case 'day':
                return (
                    <ScrollingCalendar theme={theme} eventData={eventSections} />
                );
            default:
                return null;
        }
    }
    
    let MemoizedCalendarComponent = React.memo(CalendarComponent);

    const handleViewChange = () => {
        if(selectedView != viewTypes.length - 1)
            setSelectedView(selectedView + 1);
        else
            setSelectedView(0);
    }

    const isFocused = useIsFocused();

    useEffect(async () => {
        try {
            if (!isFocused) return;

            setExpandedHeight(heightPctToDP(55, 10));
            setSelectedView(0);
            // get events from storage
            let events = await AsyncStorage.getItem('plannerEvents');
            let parsed = await JSON.parse(events);
            setEventSections(parsed);
            formatEvents(parsed);
            setIsLoading(false);
        } catch (err) {
            console.log(err);
        }
    }, [isFocused]);

    if (isLoading)
    {
        return (
            <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}}>
                <ActivityIndicator size = 'large' color = {theme.s4} />
            </View>
        );
    }

    // render function for day/week/month view of events
    const renderItem = ({ item, index }) => {
        let theme = themeData.swatch;
        let color = item.color;
        let { text } = item.event;
        return (
            <Assignment theme={theme} color={color} text={text} />
        );
    };
    
    return (
        <View style={[styles.container, {backgroundColor: theme.s1}]}>
            <Header theme={theme} navigation={navigation} changeView={handleViewChange} />
            <View style={styles.main_container}>
                <Animated.View style={[styles.header_text, {left: 0, width: '100%'}, /* animatedMainHeaderStyle */]}>
                    <Text style={[styles.header_text, {color: theme.s6, marginBottom: 0}]}>Your Calendar:</Text>
                </Animated.View>
                <MemoizedCalendarComponent viewTypeIdx={selectedView} />     
                {viewTypes[selectedView] == 'month' &&                  // BUG: shows expanded event list for a split second before rendering correctly
                    <View style={{width: '100%', height: '100%'}}> 
                        <Animated.View style={[styles.event_list_container, {backgroundColor: theme.s1}, animatedEventListStyle]}>
                            <Animated.Text 
                                style={[
                                    styles.header_text, 
                                    { color: theme.s6 }, 
                                    animatedEventListHeaderStyle
                                ]}
                            >
                                {range !== 'User Selected Date'
                                    ? `${range}'s Events:`
                                    : `Events on ${selectedDate.month}/${selectedDate.day}/${selectedDate.year}:`
                                }
                            </Animated.Text>
                            <Animated.Text style={[{fontFamily: 'Proxima Nova Bold', left: 5, color: theme.s4}, animatedEventListSubheaderStyle]}>
                                {eventListSubheaderText}
                            </Animated.Text>
                            <Pressable
                                style={({pressed}) => [
                                    {
                                        position: 'absolute',
                                        top: eventListExpanded ? 0 : 12.5,
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
                            <View style={{ paddingTop: 15, paddingBottom: eventListExpanded ? 10 : 30, }}>
                                <SafeAreaView>
                                    <FlatList
                                        data={sortEventsByRange(formattedEvents, range)}
                                        renderItem={(item) => renderItem(item)}
                                        keyExtractor={(item) => item.key}
                                        ListFooterComponent={<View style={styles.assignment} />}
                                    />
                                </SafeAreaView>
                            </View>
                        </Animated.View>
                    </View>
                }
                {/* can't put the button group with event list because of absolute position */}
                {viewTypes[selectedView] == 'month' &&
                    <EventListBtnGroup theme={theme} range={range} setRange={setRange} />
                }
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
    eList_selector: {
        height: '100%',
        position: 'absolute',
        top: 5,
        borderRadius: 30
    },
    event_list_container: {
        width: '100%',
        height: '100%',
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
    calendarViewBtnContainer: {
        width: 45,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 0,
        borderRadius: 40,
        borderWidth: 1,
    },
    calendarYearViewContainer: {
        width: '100%', 
        flexDirection: 'row', 
        flexWrap: 'wrap',
    },
    assignment: {
        width: '100%',
        height: 50,
        paddingLeft: 10,
        borderLeftWidth: 5,
        borderRadius: 3.5,
        justifyContent: 'center',
        marginBottom: 5,
    },
    assignment_text: {
        fontFamily: 'Proxima Nova Bold',
    }
});

export default CalendarScreen;