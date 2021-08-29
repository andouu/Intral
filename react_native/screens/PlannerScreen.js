import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
    FlatList,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    PixelRatio,
    Modal,
    Pressable,
    ActivityIndicator,
    UIManager,
    LayoutAnimation,
    LogBox,
    Keyboard,
    StatusBar,
    Alert,
} from 'react-native';
import { Icon } from 'react-native-elements';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SwipeableItem from 'react-native-swipeable-item/src';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Calendar from '../components/Calendar';
import TimePicker from '../components/TimePicker';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode() on the ref of an Animated component is no longer necessary. You can now directly use the ref instead. This method will be removed in a future release.',
]);

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}

const heightPctToDP = (heightPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenHeight = Dimensions.get('window').height - 2 * padding;
    const elemHeight = parseFloat(heightPct);
    return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
}

//TODO: export below from Calendar.js and import here instead of have duplicate code
const monthDict = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dateToday = new Date();

const dayOfWeek = (d, m, y) => { // https://www.geeksforgeeks.org/find-day-of-the-week-for-a-given-date/
    let t = [ 0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4 ];
    y -= (m < 3) ? 1 : 0;
    return Math.round(( y + y/4 - y/100 + y/400 + t[m - 1] + d) % 7) % 7;
}

const dayHasPast = (y1, m1, d1, y2, m2, d2) => {
    if (y1 == y2) {
        if (m1 == m2) {
            if (d1 < d2) return true;
        } else if (m1 < m2) return true;
    } else if (y1 < y2) return true;
    return false;
}

const getDateText = (day, month, year, addParentheses=false) => {
    let selectedDayOfWeek = dayOfWeek(day, month, year);
    const wordDayOfWeek = daysOfWeek[selectedDayOfWeek];
    let dateText = wordDayOfWeek.substr(0, 3) + ', ' + 
        monthDict[month - 1] + ' ' + 
        day + ', ' + 
        year;
    const todayDay = dateToday.getDate();
    const todayMonth = dateToday.getMonth() + 1;
    const todayYear = dateToday.getFullYear();
    if (!dayHasPast(year, month, day, todayYear, todayMonth, todayDay)) { //selected date > today
        let parentheses = ' (' + dateText + ')';

        if (day == todayDay && month == todayMonth && year == todayYear) {
            dateText = 'Today';
        }
        else if (day == todayDay + 1 && month == todayMonth && year == todayYear) {
            dateText = 'Tomorrow';
        } else {
            let todayDayOfWeek = dayOfWeek(todayDay, todayMonth, todayYear);
            todayDayOfWeek = ((todayDayOfWeek - 1) + 7) % 7; //makes Monday first day of week
            let todayFirstDayOfWeek = new Date(todayYear, todayMonth - 1, todayDay);
            todayFirstDayOfWeek.setDate(todayFirstDayOfWeek.getDate() - todayDayOfWeek);
            
            let selectedFirstDayOfWeek = new Date(year, month - 1, day);
            selectedDayOfWeek = ((selectedDayOfWeek - 1) + 7) % 7;
            selectedFirstDayOfWeek.setDate(selectedFirstDayOfWeek.getDate() - selectedDayOfWeek);
            
            if (selectedFirstDayOfWeek.getDate() == todayFirstDayOfWeek.getDate() && selectedFirstDayOfWeek.getMonth() == todayFirstDayOfWeek.getMonth() && selectedFirstDayOfWeek.getFullYear() == todayFirstDayOfWeek.getFullYear()) {
                dateText = wordDayOfWeek;
            } else {
                todayFirstDayOfWeek.setDate(todayFirstDayOfWeek.getDate() + 7); //next week's first day of week
                if (selectedFirstDayOfWeek.getDate() == todayFirstDayOfWeek.getDate() && selectedFirstDayOfWeek.getMonth() == todayFirstDayOfWeek.getMonth() && selectedFirstDayOfWeek.getFullYear() == todayFirstDayOfWeek.getFullYear()) {
                    dateText = 'Next ' + wordDayOfWeek;
                } else parentheses = '';
            }
        }
        
        if (addParentheses) return dateText + parentheses;
    }

    return dateText;
}

const get12HourTimeText = (time24String) => {
    const time24Hour = parseInt(time24String.substring(0, 2));
    const minuteString = time24String.substring(2, 4);
    let timeText;
    if (time24Hour >= 12) {
        if (time24Hour === 12) timeText = '12:' + minuteString + ' PM';
        else timeText = (time24Hour - 12).toString() + ':' + minuteString + ' PM';
    } else {
        if (time24Hour === 0) timeText = '12:' + minuteString + ' AM';
        else timeText = time24Hour.toString() + ':' + minuteString + ' AM';
    }
    return timeText;
}

const randomHSL = () => {
    return (
        'hsla(' + 
        ~~(360 * Math.random()) + 
        ',70%,80%,1)'
    );
}

const maxEventChars = 80;

const bezierAnimCurve = Easing.bezier(0.5, 0.01, 0, 1);

const DraggableItem = ({ theme, item, index, drag, isActive, dataSize, sectionData, handleMenuOpen, handleChangePriority, handleDelete, handleScrollEnabled }) => {
    const isLast = index === dataSize - 1;

    const priorityColors = [theme.s13, theme.s9, theme.s1];
    let priorityColor = priorityColors[item.data.priority - 1];

    const UnderlayRight = ({ item, percentOpen, open, close }) => {
        return (
            <Animated.View 
                style={[
                    styles.event_right_underlay, 
                    {
                        borderBottomWidth: !isLast ? 1 : 0, 
                        borderBottomColor: theme.s2,
                        backgroundColor: theme.s3,
                    },
                ]}
            >
                <View style={{width: 50, height: '100%', backgroundColor: theme.s4, alignItems: 'center', justifyContent: 'center'}}>
                    <Icon
                        name='chevron-down'
                        type='feather'
                        size={30}
                        color={theme.s1}
                        onPress={() => {close(); handleChangePriority(3);}}
                    />
                </View>
                <View style={{width: 50, height: '100%', backgroundColor: theme.s8, alignItems: 'center', justifyContent: 'center'}}>
                    <Icon
                        name='chevron-up'
                        type='feather'
                        size={30}
                        color={theme.s1}
                        onPress={() => {close(); handleChangePriority(2);}}
                    />
                </View>
                <View style={{width: 50, height: '100%', backgroundColor: theme.s3, alignItems: 'center', justifyContent: 'center'}}>
                    <Icon
                        name='chevrons-up'
                        type='feather'
                        size={30}
                        color={theme.s1}
                        onPress={() => {close(); handleChangePriority(1);}}
                    />
                </View>
            </Animated.View>
        );
    }

    const UnderlayLeft = ({ item, percentOpen, open, close }) => {//TODO: change to archive, have archived section
        return (
            <Animated.View 
                style={[
                    styles.event_left_underlay, 
                    {
                        borderBottomWidth: !isLast ? 1 : 0, 
                        borderBottomColor: theme.s2, 
                        opacity: percentOpen, 
                        backgroundColor: theme.s11
                    }
                ]}
            >
                <TouchableOpacity style={{right: 17}}>
                    <Icon
                        name='trash-2'
                        type='feather'
                        size={20}
                        color={theme.s1}
                        onPress={() => {close(); handleDelete(sectionData.name, item.key);}}
                    />
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <SwipeableItem
            renderUnderlayRight={({percentOpen, close}) => <UnderlayRight item={item} percentOpen={percentOpen} close={close} />}
            snapPointsRight={[150]}
            renderUnderlayLeft={({percentOpen, close}) => <UnderlayLeft item={item} percentOpen={percentOpen} close={close} />}
            snapPointsLeft={[55]}
            overSwipe={20}
        >
            <View style={{
                width: '100%',
                minHeight: 65,
                borderBottomWidth: !isLast ? 1 : 0, 
                borderBottomColor: theme.s2,
                backgroundColor: isActive ? toRGBA(theme.s4, 0.5) : priorityColor,
            }}>
                <TouchableOpacity
                    style={{
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 15,
                    }}
                    onLongPress={() => {
                        handleScrollEnabled(false);
                        drag();
                    }}
                    onPress={() => handleMenuOpen(true, {
                        key: item.key,
                        sectionName: sectionData.name,
                        priority: item.data.priority,
                        description: item.data.text,
                        startDate: {
                            day: item.data.startDate.day,
                            month: item.data.startDate.month,
                            year: item.data.startDate.year,
                        },
                        startTime: item.data.startTime,
                        endDate: {
                            day: item.data.endDate.day,
                            month: item.data.endDate.month,
                            year: item.data.endDate.year,
                        },
                        endTime: item.data.endTime,
                    })}
                >
                    <Text style={[styles.event_text, {color: theme.s6}]}>{item.data.text}</Text>
                    <Text style={[styles.event_end_text, {color: theme.s4}]}>{'Start: ' + get12HourTimeText(item.data.startTime) + ', ' + getDateText(item.data.startDate.day, item.data.startDate.month, item.data.startDate.year, true)}</Text>
                    <Text style={[styles.event_end_text, {color: theme.s4}]}>{'End: ' + get12HourTimeText(item.data.endTime) + ', ' + getDateText(item.data.endDate.day, item.data.endDate.month, item.data.endDate.year, true)}</Text>
                </TouchableOpacity>
            </View>
        </SwipeableItem>
    );
}

const BorderedFlatList = (props) => {
    if(props.data.data.length <= 0) {
        return null;
    }

    return (
        <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={[ styles.event_text, { color: props.theme.s6, alignSelf: 'flex-start', fontSize: 27.5, marginBottom: 15 }] }>{ props.data.name }:</Text>
            <View style={{ borderLeftWidth: 1.5, borderLeftColor: props.data.color, borderRadius: 11 }}>
                <View style={{ borderRadius: 11, overflow: 'hidden' }}>
                    <DraggableFlatList 
                        data={props.data.data}
                        renderItem={({item, index, drag, isActive}) => 
                            <DraggableItem 
                                theme={props.theme} 
                                sectionData={props.data}
                                item={item} 
                                index={index} 
                                drag={drag} 
                                isActive={isActive} 
                                dataSize={props.data.data.length} 
                                handleMenuOpen={props.handleMenuOpen}
                                handleChangePriority={(newPriority) => props.handleEventEdit(
                                    props.data.name,
                                    item.key,
                                    {
                                        sectionName: props.data.name, 
                                        priority: newPriority,
                                        description: item.data.text,
                                        startDate: {
                                            day: item.data.startDate.day,
                                            month: item.data.startDate.month,
                                            year: item.data.startDate.year,
                                        },
                                        startTime: item.data.startTime,
                                        endDate: {
                                            day: item.data.endDate.day,
                                            month: item.data.endDate.month,
                                            year: item.data.endDate.year,
                                        },
                                        endTime: item.data.endTime,
                                    }
                                )}
                                handleDelete={props.handleDelete}
                                handleScrollEnabled={props.handleScrollEnabled}
                            />
                        }
                        keyExtractor={item => item.key}
                        onDragEnd={({data}) => {
                            props.setSectionData(props.data.name, data);
                            props.handleScrollEnabled(true);
                        }}
                        activationDistance={50}
                    />
                </View>
            </View>
        </View>
    );
}

const EventList = (props) => {
    const [scrollEnabled, setScrollEnabled] = useState(true);
    
    const checkEventsEmpty = () => {
        for (let i = 0; i < props.sortedEvents.length; i ++) {
            if (props.sortedEvents[i].data.length !== 0) {
                return false;
            }
        }
        return true;
    };

    if(checkEventsEmpty()) {
        return (
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={[styles.helper_text, {color: props.theme.s6, bottom: 60}]}>No events right now... click the add button to create one!</Text>
            </View>
        );
    }

    return (
        <View style={{flex: 1, width: '100%'}}>
            <FlatList 
                data={props.sortedEvents}
                renderItem={({item}) => 
                    <BorderedFlatList 
                        theme={props.theme} 
                        data={item} 
                        setSectionData={props.setSectionData}
                        handleMenuOpen={props.handleMenuOpen}
                        handleEventEdit={props.handleEventEdit}
                        handleDelete={props.handleDelete}
                        handleScrollEnabled={setScrollEnabled} 
                    />
                }
                keyExtractor={(item, index) => item.key}
                scrollEnabled={scrollEnabled}
                nestedScrollEnabled={false}
                showVerticalScrollIndicator={false}
            />
        </View>
    );
}

const AddButton = ({ theme, buttonVisible, handleOpen }) => {
    const addButtonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateX: withTiming(buttonVisible ? 0 : 100, {
                duration: buttonVisible ? 1000 : 400,
                easing: Easing.in(bezierAnimCurve)
            })}]
        };
    });

    return (
        <Animated.View style={[styles.add_button, {overflow: 'hidden', backgroundColor: theme.s5}, addButtonAnimatedStyle]}>
            <Pressable
                style={({pressed}) => [
                    {
                        width: '100%', 
                        height: '100%', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: pressed ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
                    }
                ]}
                onPress={() => {
                    handleOpen();
                }}
            >
                <Icon
                    name='plus'
                    type='feather'
                    size={35}
                    color={theme.s7}
                    disabled={false}
                />
            </Pressable>
        </Animated.View>
    );
}

/**
 * @param {*} props
 * Required:
 * - theme = theme object
 * - text = left text
 * - rightComponent = component to render on right side of the field
 * ---
 * Optional:
 * - containerStyle = custom style of field
 * - textStyle = custom style of text
 */
const Field = (props) => {
    const defaultStyle = StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            height: 65,
            marginBottom: 5,
        },
        main_text: {
            fontFamily: 'Proxima Nova Bold',
            fontSize: 20,
            color: props.theme.s4,
        }
    });
    return (
        <View style={[defaultStyle.container, props.containerStyle]}>
            <View style={{ height: '100%', justifyContent: 'center' }}>
                <Text style={[defaultStyle.main_text, props.textStyle]}>{props.text}</Text>
            </View>
            {props.rightComponent}
        </View>
    );
}
/**
 * @param {*} props
 * Required:
 * - theme = theme object
 * - name = name of the dropdown
 * - selectedItem (string) = current selected item string
 * - items (list) = all items (strings)
 * - dropdownOpen (bool) = whether dropdown is open
 * - handleDropdownOpen (function) = function to open dropdown
 * - handleAddNew (function) = function for add button *(required if add button is enabled, else optional)*
 * ---
 * Optional:
 * - containerStyle = custom style of menu
 * - decorator (obj) = left decorator for each box
 * - textStyle = custom style of text
 * - handlePress (function) = function to call for each button when it's pressed
 * - otherDropdownOpening (bool) = whether another dropdown is opening causing this dropdown to close (used to handle zIndex)
 * - multiselect (bool) = whether to allow dropdown multiselect                                       //TODO! (also, if this is true, selectedItem should not exist)
 * - addNewBtnEnabled (bool) = whether to have an add new button
 */
const DropdownMenu = (props) => {                                                           
    const [dropdownZIndex, setDropdownZIndex] = useState(1);

    const defaultStyle = StyleSheet.create({
        container: {
            top: '3%',
            width: '50%',
            height: '80%',
            zIndex: dropdownZIndex,
            borderWidth: 1.5,
            borderColor: props.theme.s2,
            borderRadius: 15,
            overflow: 'hidden',
            backgroundColor: props.theme.s1,
        }
    });

    const collapsedHeight = heightPctToDP(6, 15); // same height as one box
    const expandedHeight = collapsedHeight * (props.items.length + props.addNewBtnEnabled + 1); //+ 1 because of top selected item

    const animatedDropdownStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(props.dropdownOpen ? expandedHeight : collapsedHeight, {duration: 300, easing: Easing.in(bezierAnimCurve)}),
        }
    });

    useEffect(() => {
        if(props.dropdownOpen) {
            setDropdownZIndex(4);
        } else {
            if (props.otherDropdownOpening) {
                setDropdownZIndex(2);
            } else {
                setTimeout(() => setDropdownZIndex(2), 200);
            }
        }
    }, [props.dropdownOpen]);

    const DropdownBox = ({ name, showCheck=false }) => {
        return (
            <Pressable
                style={({pressed}) => [
                    {
                        width: '100%', 
                        height: collapsedHeight,
                        borderBottomWidth: StyleSheet.hairlineWidth, 
                        borderBottomColor: props.theme.s2,
                        zIndex: 3,
                        backgroundColor: pressed ? toRGBA(props.theme.s4, 0.5) : 'transparent'
                    }
                ]}
                onPress={() => {
                    props.handleDropdownOpen(props.name, !props.dropdownOpen);
                    props.handlePress(name);
                }}
            >
                <View style={{ width: '85%', height: '100%', alignSelf: 'flex-start', flexDirection: 'row' }}>
                    {props.decorator &&
                        <View style={{flex: 1}}>
                            {props.decorator}
                        </View>
                    }
                    <View style={{ flex: 4, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: props.theme.s6, textAlign: 'center' }, props.textStyle]}>{name}</Text>
                    </View>
                </View>
                {showCheck && <View style={{ position: 'absolute', right: 5, top: 11 }}>
                    <Icon
                        name='check'
                        type='feather'
                        size={20}
                        color={props.theme.s4}
                    />
                </View>}
            </Pressable>
        );
    }

    const dropdownBoxes = props.items.map((item, index) => <DropdownBox name={item} showCheck={props.selectedItem === item} key={index} />);

    return (
        <Animated.View style={[defaultStyle.container, props.containerStyle, animatedDropdownStyle]}>
            <Pressable
                style={({pressed}) => [
                    {
                        flex: 1,
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        backgroundColor: pressed ? toRGBA(props.theme.s4, 0.5) : 'transparent',
                    }
                ]}
                onPress={() => props.handleDropdownOpen(props.name, !props.dropdownOpen)}
            >
                <MaterialDesignIcons 
                    name={props.dropdownOpen ? 'chevron-up' : 'chevron-down'} 
                    size={22} 
                    color={props.theme.s4} 
                    style={{
                        position: 'absolute',
                        top: 9,
                        right: 7,
                        zIndex: 10,
                    }}
                />
                <DropdownBox name={props.selectedItem}/>
                {dropdownBoxes}
                {props.addNewBtnEnabled &&
                    <Pressable 
                        style={({pressed}) => [
                            {
                                width: '100%', 
                                height: collapsedHeight,
                                borderBottomWidth: StyleSheet.hairlineWidth, 
                                borderBottomColor: props.theme.s2,
                                zIndex: 3,
                                backgroundColor: pressed ? toRGBA(props.theme.s4, 0.5) : props.theme.s9
                            }
                        ]}
                        onPress={() => {
                            props.handleDropdownOpen(props.name, !props.dropdownOpen);
                            // TODO: add handleAddNew function
                        }}
                    >
                        <View style={{ width: '85%', height: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                            <View style={{ flex: 3, alignItems: 'flex-end', justifyContent: 'center' }}>
                                <MaterialDesignIcons name='plus' size={20} color={props.theme.s4} style={{ marginRight: 5 }} />
                            </View>
                            <View style={{ flex: 4, alignItems: 'flex-start', justifyContent: 'center' }}>
                                <Text style={[{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: props.theme.s6, marginLeft: 5 }]}>Add New</Text>
                            </View>
                        </View>
                    </Pressable>
                }
            </Pressable>
        </Animated.View>
    );
}

const DateField = ({ text, selectedDate, setSelectedDate, theme }) => {
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);

    return (
        <React.Fragment>
            <Field
                theme={theme}
                text={text}
                rightComponent={
                    <View style={styles.add_date_button_container}>
                        <Pressable
                            style={({ pressed }) => [{
                                width: '100%',
                                height: '75%',
                                backgroundColor: pressed ? theme.s2 : theme.s1,
                                borderWidth: 1.5,
                                borderRadius: 30,
                                borderColor: theme.s2,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }]}
                            onPress={() => setCalendarModalVisible(true)}
                        >
                            <Text style={{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: theme.s6, marginRight: 10 }}>
                                {getDateText(selectedDate.day, selectedDate.month, selectedDate.year)}
                            </Text>
                            <Icon
                                name='calendar'
                                type='feather'
                                size={20}
                                color={theme.s6}
                            />
                        </Pressable>
                    </View>
                }
            />
            <Modal
                animationType='fade'
                transparent={true}
                visible={calendarModalVisible}
                onRequestClose={() => setCalendarModalVisible(false)}
            >
                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[styles.calendar_container, {backgroundColor: theme.s9}]}>
                        <Calendar
                            dateToday={dateToday}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            isRefreshing={false}
                        />
                    </View>
                    <View style={[styles.modal_back_button_container, {backgroundColor: theme.s9}]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.modal_back_button,
                                {
                                    backgroundColor: pressed ? theme.s13 : theme.s1
                                },
                            ]}
                            onPress={() => setCalendarModalVisible(false)}
                        >
                            <Text style={[styles.modal_back_button_text, {color: theme.s2}]}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </React.Fragment>
    );
}

const TimeField = ({ text, time, setTimeModalOpen, timeModalOpacity, theme }) => { // separate from time picker modal
    return (
        <Field
            theme={theme}
            text={text}
            rightComponent={
                <View style={styles.add_time_button_container}>
                    <Pressable
                        style={({ pressed }) => [{
                            width: '100%',
                            height: '75%',
                            backgroundColor: pressed ? theme.s2 : theme.s1,
                            borderWidth: 1.5,
                            borderRadius: 30,
                            borderColor: theme.s2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }]}
                        onPress={() => {
                            setTimeModalOpen(true);
                            timeModalOpacity.value = 1;
                        }}
                    >
                        <Text style={{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: theme.s6, marginRight: 10 }}>
                            {get12HourTimeText(time)}
                        </Text>
                        <Icon
                            name='clock'
                            type='feather'
                            size={20}
                            color={theme.s6}
                        />
                    </Pressable>
                </View>
            }
        />
    );
}

const TimeModal = ({ timeModalOpen, setTimeModalOpen, timeModalOpacity, time, setTime, theme }) => {
    const transitionDuration = 300; //for opening and closing the modal

    const timeModalAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(timeModalOpacity.value, { duration: transitionDuration, easing: Easing.in }),
        };
    });

    return (
        <View>
            {timeModalOpen &&
                <Animated.View style={[
                    timeModalAnimatedStyle,
                    {
                        position: 'absolute',
                        width: '100%',
                        height: 600, // has to cover screen (600 to be safe with bigger phones) to disable user clicking
                        zIndex: 10,
                    },
                ]}>
                    <View style={{ width: '100%', height: '80%', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={[styles.time_container, {backgroundColor: theme.s9}]}>
                            <TimePicker
                                time={time}
                                setTime={setTime}
                            />
                        </View>
                        <View style={[styles.modal_back_button_container, {backgroundColor: theme.s9}]}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.modal_back_button,
                                    {
                                        backgroundColor: pressed ? theme.s13 : theme.s1
                                    },
                                ]}
                                onPress={() => {
                                    timeModalOpacity.value = 0;
                                    setTimeout(() => {
                                        setTimeModalOpen(false);
                                    }, transitionDuration);
                                }}
                            >
                                <Text style={[styles.modal_back_button_text, {color: theme.s2}]}>Done</Text>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            }
        </View>
    );
}

//military 24-hour time as string
const DEFAULT_START_TIME = '0800'; //8:00 AM
const DEFAULT_END_TIME = '1200'; //12:00 PM

const AddMenu = ({ sectionsData, priorityData, handleAdd, handleChange, menuVisible, setMenuAnimationFinished, closeMenu, theme, editing, editData }) => {
    const [eventToAdd, setEventToAdd] = useState({
        sectionName: sectionsData.sectionNames[0],
        priority: priorityData[0],
        description: '',
        startDate: {
            day: dateToday.getDate(),
            month: dateToday.getMonth() + 1,
            year: dateToday.getFullYear(),
        },
        startTime: DEFAULT_START_TIME,
        endDate: {
            day: dateToday.getDate(),
            month: dateToday.getMonth() + 1,
            year: dateToday.getFullYear(),
        },
        endTime: DEFAULT_END_TIME,
    });
    const [charsLeft, setCharsLeft] = useState(maxEventChars);
    const [openMenus, setOpenMenus] = useState({
        sectionName: false,
        priority: false,
    });
    const [otherDropdownOpening, setOtherDropdownOpening] = useState(false);
    const menuHeight = useSharedValue(100);
    const animatedMenuStyle = useAnimatedStyle(() => {
        return {
            top: withTiming(menuHeight.value + '%', {duration: 500, easing: Easing.in(bezierAnimCurve)}, (finished) => {
                runOnJS(setMenuAnimationFinished)(true);
            }),
        }
    });
    const menuScrollViewRef = useRef();
    const [startTimeModalOpen, setStartTimeModalOpen] = useState(false);
    const startTimeModalOpacity = useSharedValue(0);
    const [endTimeModalOpen, setEndTimeModalOpen] = useState(false);
    const endTimeModalOpacity = useSharedValue(0);

    const handleDropdownOpen = (key, newValue) => {
        let newOpenMenus = { ...openMenus };
        if (!newValue) {
            newOpenMenus[key] = false;
            setOpenMenus(newOpenMenus);
            setOtherDropdownOpening(false);
        } else {
            let keys = Object.keys(newOpenMenus);
            let otherOpening = false;
            for (let i = 0; i < keys.length; i ++) {
                let curKey = keys[i];
                if (curKey === key) {
                    newOpenMenus[key] = true;
                } else {
                    if (newOpenMenus[curKey]) {
                        otherOpening = true;
                        newOpenMenus[curKey] = false;
                    }
                }
            }
            setOpenMenus(newOpenMenus);
            setOtherDropdownOpening(otherOpening);
        }
    }

    const handleEditEvent = (type) => {
        let changeFunction;
        switch(type) {
            case 'sectionName':
                changeFunction = (newSectionName) => {
                    setEventToAdd({
                        ...eventToAdd,
                        sectionName: newSectionName,
                    });
                }
                break;
            case 'priority':
                changeFunction = (newPriority) => {
                    setEventToAdd({
                        ...eventToAdd,
                        priority: newPriority,
                    });
                }
                break;
            case 'startDate':
                changeFunction = (newDate) => {
                    setEventToAdd({
                        ...eventToAdd,
                        startDate: {
                            day: newDate.day,
                            month: newDate.month,
                            year: newDate.year,
                        },
                    });
                }
                break;
            case 'startTime':
                changeFunction = (newTime) => {
                    setEventToAdd({
                        ...eventToAdd,
                        startTime: newTime,
                    });
                }
                break;
            case 'endDate':
                changeFunction = (newDate) => {
                    setEventToAdd({
                        ...eventToAdd,
                        endDate: {
                            day: newDate.day,
                            month: newDate.month,
                            year: newDate.year,
                        },
                    });
                }
                break;
            case 'endTime':
                changeFunction = (newTime) => {
                    setEventToAdd({
                        ...eventToAdd,
                        endTime: newTime,
                    });
                }
                break;
        }
        return changeFunction;
    }

    const expandedHeight = 100;

    const resetStates = () => {
        setEventToAdd({
            sectionName: sectionsData.sectionNames[0],
            priority: priorityData[0],
            description: '',
            startDate: {
                day: dateToday.getDate(),
                month: dateToday.getMonth() + 1,
                year: dateToday.getFullYear(),
            },
            startTime: DEFAULT_START_TIME,
            endDate: {
                day: dateToday.getDate(),
                month: dateToday.getMonth() + 1,
                year: dateToday.getFullYear(),
            },
            endTime: DEFAULT_END_TIME,
        });
        setCharsLeft(maxEventChars);
    };
    
    useEffect(() => {
        setMenuAnimationFinished(false);
        setOpenMenus({ // close all dropdowns regardless of opening or closing the add menu
            sectionName: false,
            priority: false,
        });
        if(menuVisible) {
            menuHeight.value = 0;
            menuScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
            if (editing) {
                setEventToAdd({
                    sectionName: editData.sectionName,
                    priority: editData.priority,
                    description: editData.description,
                    startDate: {
                        day: editData.startDate.day,
                        month: editData.startDate.month,
                        year: editData.startDate.year,
                    },
                    startTime: editData.startTime,
                    endDate: {
                        day: editData.endDate.day,
                        month: editData.endDate.month,
                        year: editData.endDate.year,
                    },
                    endTime: editData.endTime,
                });
                setCharsLeft(maxEventChars - editData.description.length);
            } else {
                resetStates(); // repeated code for safety
            }
        } else {
            menuHeight.value = expandedHeight;
            setTimeout(resetStates, 500);
        }
    }, [menuVisible]);

    return (
        <Animated.View
            style={[{width: '100%', height: '100%', position: 'absolute', backgroundColor: theme.s1}, animatedMenuStyle]}
        >
            <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 45, width: '75%', color: theme.s6, marginBottom: 10}}>New Event:</Text>
            {/* TODO: make the close button a custom component for reuse? */}
            <Pressable
                style={({pressed}) => [
                    {
                        width: 40,
                        height: 40,
                        position: 'absolute', 
                        top: 2, 
                        right: -5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 30,
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent'
                    }
                ]}
                onPress={() => {
                    Keyboard.dismiss();
                    closeMenu();
                }}
            >
                <MaterialDesignIcons name='close' size={30} color={theme.s4} style={{bottom: 0, right: 0}}/>
            </Pressable>
            <View style={{borderBottomWidth: 2, borderBottomColor: theme.s4, marginBottom: 5}} />
            <TimeModal
                timeModalOpen={startTimeModalOpen}
                setTimeModalOpen={setStartTimeModalOpen}
                timeModalOpacity={startTimeModalOpacity}
                time={eventToAdd.startTime}
                setTime={handleEditEvent('startTime')}
                theme={theme}
            />
            <TimeModal
                timeModalOpen={endTimeModalOpen}
                setTimeModalOpen={setEndTimeModalOpen}
                timeModalOpacity={endTimeModalOpacity}
                time={eventToAdd.endTime}
                setTime={handleEditEvent('endTime')}
                theme={theme}
            />
            <ScrollView showsVerticalScrollIndicator={false} ref={menuScrollViewRef}>
                <Field
                    theme={theme}
                    text='Section Name:'
                    rightComponent={
                        <DropdownMenu
                            theme={theme}
                            selectedItem={eventToAdd.sectionName}
                            items={sectionsData.sectionNames}
                            textStyle={{left: 10}}
                            addNewBtnEnabled={true}
                            handlePress={handleEditEvent('sectionName')}
                            name='sectionName'
                            dropdownOpen={openMenus.sectionName}
                            handleDropdownOpen={handleDropdownOpen}
                            otherDropdownOpening={otherDropdownOpening}
                        />
                    }
                />
                <Field
                    theme={theme}
                    text='Priority:'
                    rightComponent={
                        <DropdownMenu 
                            theme={theme}
                            selectedItem={eventToAdd.priority}
                            items={priorityData}
                            containerStyle={{width: '30%'}}
                            textStyle={{left: 5}}
                            addNewBtnEnabled={false}
                            handlePress={handleEditEvent('priority')}
                            name='priority'
                            dropdownOpen={openMenus.priority}
                            handleDropdownOpen={handleDropdownOpen}
                            otherDropdownOpening={otherDropdownOpening}
                        />
                    }
                />
                <View style={{borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.s4, marginBottom: 5}} />
                <DateField
                    text='Start Date:'
                    selectedDate={eventToAdd.startDate}
                    setSelectedDate={handleEditEvent('startDate')}
                    theme={theme}
                />
                <TimeField
                    text='Start Time:'
                    time={eventToAdd.startTime}
                    setTimeModalOpen={setStartTimeModalOpen}
                    timeModalOpacity={startTimeModalOpacity}
                    theme={theme}
                />
                <DateField
                    text='End Date:'
                    selectedDate={eventToAdd.endDate}
                    setSelectedDate={handleEditEvent('endDate')}
                    theme={theme}
                />
                <TimeField
                    text='End Time:'
                    time={eventToAdd.endTime}
                    setTimeModalOpen={setEndTimeModalOpen}
                    timeModalOpacity={endTimeModalOpacity}
                    theme={theme}
                />
                <View style={{borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.s4, marginBottom: 5}} />
                <Field
                    theme={theme}
                    text='Description:'
                    containerStyle={{marginBottom: 0}}
                />
                <View
                    style={{
                        width: '100%', 
                        height: 150,
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 15,
                        borderWidth: 1.5,
                        borderColor: theme.s2,
                        borderRadius: 30,
                        marginBottom: 40,
                        overflow: 'hidden',
                    }}
                >
                    <TextInput
                        scrollEnabled={false}
                        multiline={true}
                        maxLength={maxEventChars}
                        textBreakStrategy='simple'
                        placeholder='Tap to edit'
                        placeholderTextColor={toRGBA(theme.s4, 0.5)}
                        value={eventToAdd.description}
                        onChangeText={text => {
                            if (text.slice().split('').indexOf('\n') === -1) {
                                setEventToAdd({
                                    ...eventToAdd,
                                    description: text,
                                });
                                setCharsLeft(maxEventChars - text.length);
                            } else {
                                Keyboard.dismiss();
                            }
                        }}
                        style={[styles.event_text, { width: '95%', height: '100%', marginRight: 15, borderRadius: 15, color: theme.s6 }]}
                    />
                    <Text style={{ position: 'absolute', right: 8, top: '60%', color: theme.s4 }}>{charsLeft}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', height: 40, marginBottom: 50 }}>
                    <Pressable
                        style={({pressed}) => [
                            {
                                width: 100,
                                height: 40,
                                borderRadius: 30,
                                borderWidth: 1.5,
                                borderColor: theme.s2,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: pressed ? theme.s2 : 'transparent',
                            },
                        ]}
                        onPress={() => {
                            if(eventToAdd.description.trim() !== '') {
                                if(editing) {
                                    handleChange(
                                        editData.sectionName,                           // editData.sectionName is the previous section of the current eventToAdd
                                        editData.key,                                   // key is only used for lookup and should not be changed.
                                        {
                                            sectionName: eventToAdd.sectionName, 
                                            priority: eventToAdd.priority,
                                            description: eventToAdd.description,
                                            startDate: {
                                                day: eventToAdd.startDate.day,
                                                month: eventToAdd.startDate.month,
                                                year: eventToAdd.startDate.year,
                                            },
                                            startTime: eventToAdd.startTime,
                                            endDate: {
                                                day: eventToAdd.endDate.day,
                                                month: eventToAdd.endDate.month,
                                                year: eventToAdd.endDate.year,
                                            },
                                            endTime: eventToAdd.endTime,
                                        }
                                    );
                                    Keyboard.dismiss();
                                    closeMenu();
                                } else {
                                    handleAdd(
                                        eventToAdd.sectionName,
                                        eventToAdd.priority,
                                        eventToAdd.description,
                                        eventToAdd.startDate,
                                        eventToAdd.startTime,
                                        eventToAdd.endDate,
                                        eventToAdd.endTime,
                                    );
                                    Keyboard.dismiss();
                                    closeMenu();
                                }
                            } else {
                                Alert.alert('mhmahmawj you can\'t have an empty description');
                            }
                        }}
                    >
                        <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 18, color: theme.s6}}>Done</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </Animated.View>
    );
}

const PlannerPage = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [isLoading, setIsLoading] = useState(true);
    const [addButtonVisible, setAddButtonVisible] = useState(true);
    const [addMenuData, setAddMenuData] = useState({ visible: false, isEditing: false, editData: {} });
    const [addMenuAnimationFinished, setAddMenuAnimationFinished] = useState(true);

    const [events, setEvents] = useState([]);
    const [sectionsData, setSectionsData] = useState({});
    const [priorityData, setPriorityData] = useState([1, 2, 3]); // TODO: allow user to add or change priority array

    const refreshClasses = async () => {
        try {
            let storedClasses = await AsyncStorage.getItem('classes');
            let parsed = await JSON.parse(storedClasses);
            if (Array.isArray(parsed)) {
                let eventSections, sectionNames = [];
                if (events.length === 0) {
                    eventSections = [];
                    for (let i = 0; i < parsed.length; i++) {
                        const item = parsed[i];
                        const cleanTitle = item.Title.substr(0, item.Title.indexOf('(')).trim();
                        eventSections.push({
                            // TODO: get color from async storage
                            key: getRandomKey(10),
                            color: '',
                            index: i,
                            name: cleanTitle,
                            data: []
                        });
                        sectionNames.push(cleanTitle);
                    }
                } else {
                    eventSections = events.slice();
                    parsed.map((item, index) => {
                        let cleanTitle = item.Title.substr(0, item.Title.indexOf('(')).trim();
                        eventSections[index].name = cleanTitle;
                        sectionNames.push(cleanTitle);
                    });
                }
                await AsyncStorage.setItem('plannerEvents', JSON.stringify(eventSections));
                setSectionsData({
                    ...sectionsData,
                    sectionNames: sectionNames,
                });
                setEvents(eventSections);
                setIsLoading(false);
            }
        } catch(err) {
            console.log(err);
        }
    };

    useEffect(async () => {
        try {
            await refreshClasses();
            let storedEvents = await AsyncStorage.getItem('plannerEvents');
            let parsed = await JSON.parse(storedEvents);
            if(Array.isArray(parsed)) {
                setEvents(parsed);
            }
            let sectionNames = [];
            for(let i = 0; i < parsed.length; i ++) {
                sectionNames.push(parsed[i].name);
            }
            setSectionsData({
                ...sectionsData, 
                sectionNames: sectionNames,
            });
            setIsLoading(false);
        } catch(err) {
            console.log(err);
        }
    }, []);

    const handleAdd = async (sectionName, initData) => {
        try {
            let newEvents = events.slice();
            let randomKey = getRandomKey(10);
            let randomColor = randomHSL();
            let dataArr = newEvents.find(elem => elem.name === sectionName);
            if(dataArr.color === '') {
                dataArr.color = randomColor;
            }
            dataArr.data.push({
                key: randomKey,
                data: {
                    text: initData.description,
                    priority: initData.priority,
                    charsLeft: maxEventChars - initData.description.length,
                    startDate: {
                        day: initData.startDate.day,
                        month: initData.startDate.month,
                        year: initData.startDate.year,
                    },
                    startTime: initData.startTime,
                    endDate: {
                        day: initData.endDate.day,
                        month: initData.endDate.month,
                        year: initData.endDate.year,
                    },
                    endTime: initData.endTime,
                }
            });
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            //LayoutAnimation.configureNext(LayoutAnimation.create(300, 'easeInEaseOut', 'scaleY'));
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    };

    const handleDelete = async (sectionName, itemKey) => {
        try {
            let newEvents = events.slice();
            let section = newEvents.find(elem => elem.name === sectionName);
            section.data.splice(section.data.findIndex(event => event.key === itemKey), 1);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    };

    const handleUpdateSection = async (sectionName, newSectionData) => {
        try {
            let newEvents = events.slice();
            newEvents.find(elem => elem.name === sectionName).data = newSectionData;
            setEvents(newEvents);                                                      // call setEvents before setting asyncstorage!! await will make the draggable flatlist laggy
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
        } catch(err) {
            console.log(err);
        }
    };

    const handleEventEdit = async (prevSectionName, key, newData) => {
        try {
            let eventCopy = events.slice();
            let section = eventCopy.find(elem => elem.name === prevSectionName);
            eventObjIdx = section.data.findIndex(elem => elem.key === key);
            eventObj = section.data[eventObjIdx];
            eventObj.data = {
                ...eventObj.data,
                priority: newData.priority,
                text: newData.description,
                startDate: {
                    day: newData.startDate.day,
                    month: newData.startDate.month,
                    year: newData.startDate.year,
                },
                startTime: newData.startTime,
                endDate: {
                    day: newData.endDate.day,
                    month: newData.endDate.month,
                    year: newData.endDate.year,
                },
                endTime: newData.endTime,
            }
            if(newData.sectionName !== prevSectionName) {
                let newSection = eventCopy.find(elem => elem.name === newData.sectionName).name;
                handleAdd(newSection, {
                    priority: eventObj.data.priority,
                    description: eventObj.data.text,
                    startDate: {
                        day: eventObj.data.startDate.day,
                        month: eventObj.data.startDate.month,
                        year: eventObj.data.startDate.year,
                    },
                    startTime: eventObj.data.startTime,
                    endDate: {
                        day: eventObj.data.endDate.day,
                        month: eventObj.data.endDate.month,
                        year: eventObj.data.endDate.year,
                    },
                    endTime: eventObj.data.endTime,
                });
                section.data.splice(eventObjIdx, 1);
            }
            setEvents(eventCopy);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(events));
        } catch(err) {
            console.log(err);
        }
    }

    const handleMenuOpen = (isEditing=false, editData={}) => {
        if (addMenuAnimationFinished) {
            setAddMenuData({visible: addButtonVisible, isEditing: isEditing, editData: editData});
            setAddButtonVisible(!addButtonVisible);
        }
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

    if(isLoading) {
        return (
            <View style = {[styles.container, {alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}]}>
                <ActivityIndicator size='large' color={theme.s4} />
            </View> 
        );
    }

    return ( 
        <View style = {[styles.container, {backgroundColor: theme.s1}]}>
            <StatusBar
                animated={false}
                backgroundColor={theme.s1}
                hidden={false}
            />
            <View style={styles.options_bar}>
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
                <EventList
                    sortedEvents={events}
                    handleMenuOpen={handleMenuOpen}
                    handleEventEdit={handleEventEdit}
                    handleDelete={handleDelete}
                    setSectionData={handleUpdateSection}
                    theme={theme}
                />
                <AddMenu
                    events={events}
                    isLoading={isLoading}
                    theme={theme}
                    sectionsData={sectionsData}
                    priorityData={priorityData}
                    handleAdd={(prevSectionName, priority, description, startDate, startTime, endDate, endTime) => {
                        handleAdd(prevSectionName, initData={
                            description: description,
                            priority: priority,
                            startDate: startDate,
                            startTime: startTime,
                            endDate: endDate,
                            endTime: endTime,
                        });
                    }}
                    handleChange={handleEventEdit}
                    editing={addMenuData.isEditing}
                    editData={addMenuData.editData}
                    menuVisible={addMenuData.visible}
                    setMenuAnimationFinished={setAddMenuAnimationFinished}
                    closeMenu={handleMenuOpen}
                />
            </View>
            <AddButton 
                theme={theme} 
                buttonVisible={addButtonVisible}
                handleOpen={handleMenuOpen}
            /> 
        </View>
    );
}

const StackNav = createStackNavigator();

const PlannerScreen = () => {
    return(
        <StackNav.Navigator>
            <StackNav.Screen 
                name = 'Planner' 
                component = {PlannerPage} 
                options={{
                    headerShown: false,
                }}
            />
        </StackNav.Navigator> 
    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%',
    },
    main_container: {
        flex: 1,
        alignItems: 'center',
        paddingLeft: 15,
        paddingRight: 15,
    },
    event_right_underlay: { // right swipe underlay
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    event_left_underlay: { // left swipe underlay
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    event_text: {
        fontSize: 18,
        fontFamily: 'Proxima Nova Bold',
    },
    event_end_text: {
        marginTop: 5,
        fontSize: 12,
        fontFamily: 'Proxima Nova Thin',
    },
    add_button: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        position: 'absolute',
        bottom: 20,
        right: 15,
    },
    add_date_button_container: {
        width: '60%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendar_container: {
        width: '100%',
        height: '50%',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 5,
        paddingTop: 10,
        paddingBottom: 50,
    },
    add_time_button_container: {
        width: '50%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    time_container: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 5,
    },
    modal_back_button_container: {
        width: '100%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        alignItems: 'center',
        paddingBottom: 10,
    },
    modal_back_button: {
        width: '50%',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    modal_back_button_text: {
        fontSize: 15,
        fontFamily: 'Proxima Nova Bold',
    },
    helper_container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '90%',
        paddingBottom: 75
    },
    helper_text: {
        fontFamily: 'ProximaNova-Regular',
        textAlign: 'center',
        opacity: 0.5,
    },
    options_bar: {
        height: '15%',
        top: 0,
        width: '100%',
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },  
    menu_button: {
        alignSelf: 'center',
        padding: 0,
        marginRight: 'auto',
        width: 45,
        left: 15,
        maxHeight: 45,
        borderRadius: 40,
        borderWidth: 1,
    },
});

export default PlannerScreen;
