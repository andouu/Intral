import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Dimensions,
    PixelRatio,
} from 'react-native';
import Calendar from '../components/Calendar';
import { toRGBA } from '../components/utils';
import { useIsFocused } from '@react-navigation/core';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeContext } from '../components/themeContext';
import Animated, {
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

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
    const isFocused = useIsFocused();

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
                <View style={{ width: '100%', height: '45%', marginBottom: 20 }}>
                    <Calendar dateToday={dateToday} selectedDate={selectedDate} setSelectedDate={setSelectedDate} isRefreshing={isFocused} />
                </View>
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
});

export default CalendarScreen;