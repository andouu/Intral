import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
    FlatList,
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
import ScrollableMenu from '../components/ScrollableMenu';
import ThemedButton from '../components/ThemedButton';
import { StaticCalendar } from '../components/Calendar';
import TimePicker from '../components/TimePicker';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    sub,
    multiply,
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

const getDateText = (day, month, year) => {
    const selectedDate = new Date(year, month - 1, day);
    const dayDif = Math.floor((selectedDate - dateToday) / (1000 * 60 * 60 * 24)) + 1; //+ 1 because selectedDate has time 00:00:00
    const wordDayOfWeek = daysOfWeek[selectedDate.getDay()];
    const shortenedWordDayOfWeek = wordDayOfWeek.substr(0, 3);
    let dateText = shortenedWordDayOfWeek + ', ' + 
        monthDict[month - 1] + ' ' + 
        day + ', ' + 
        year;
    if (dayDif >= 0) {
        if (dayDif === 0) {
            dateText = 'Today';
        } else if (dayDif === 1) {
            dateText = 'Tomorrow';
        } else if (dayDif <= 7) {
            dateText = wordDayOfWeek;
        } else if (dayDif <= 14) {
            dateText = 'Next ' + wordDayOfWeek;
        }
    }
    return dateText;
}

const get12HourTimeText = (time24String, showMinute=true) => {
    const time24Hour = parseInt(time24String.substring(0, 2));
    const minuteString = showMinute ? (':' + time24String.substring(2, 4) + ' ') : '';
    let timeText;
    if (time24Hour >= 12) {
        if (time24Hour === 12) timeText = '12' + minuteString + 'PM';
        else timeText = (time24Hour - 12).toString() + minuteString + 'PM';
    } else {
        if (time24Hour === 0) timeText = '12' + minuteString + 'AM';
        else timeText = time24Hour.toString() + minuteString + 'AM';
    }
    return timeText;
}

const getAlertInfo = (date, time24String, theme) => { // returns PST if time past, 12-hour time if within 24 hours, TMR if tomorrow, or FTR otherwise
    const hour = parseInt(time24String.substring(0, 2));
    const selectedDate = new Date(date.year, date.month - 1, date.day, hour, parseInt(time24String.substring(2, 4)));
    const hourDif = Math.floor((selectedDate - dateToday) / (1000 * 60 * 60));
    if (hourDif < 0) return { alertText: 'PST', alertColor: theme.s10 };
    else if (hourDif < 24) return { alertText: get12HourTimeText(time24String, showMinute=false), alertColor: theme.s11 };
    else {
        const selectedDateNoTime = new Date(date.year, date.month - 1, date.day);
        const dayDif = Math.floor((selectedDateNoTime - dateToday) / (1000 * 60 * 60 * 24)) + 1;
        if (dayDif === 1) return { alertText: 'TMR', alertColor: theme.s11 };
        else if (dayDif < 7) return { alertText: daysOfWeek[selectedDateNoTime.getDay()].substring(0, 3).toUpperCase(), alertColor: theme.s4 };
    }
    return { alertText: 'FTR', alertColor: '' };
}

const randomHSL = () => {
    return (
        'hsla(' + 
        ~~(360 * Math.random()) + 
        ',70%,80%,1)'
    );
}

const MAIN_CONTAINER_LEFT_RIGHT_PADDING = 15;

const MAX_EVENT_CHARS = 80;

const bezierAnimCurve = Easing.bezier(0.5, 0.01, 0, 1);

const DraggableItem = (props) => {
    const isLast = props.index === props.dataSize - 1;

    const priorityColors = [props.theme.s13, props.theme.s9, props.theme.s1];
    let priorityColor = priorityColors[props.item.event.priority - 1];

    const endDateText = getDateText(props.item.event.endDate.day, props.item.event.endDate.month, props.item.event.endDate.year);
    const { alertText, alertColor } = getAlertInfo(props.item.event.endDate, props.item.event.endTime, props.theme);

    const UnderlayRight = ({ item, percentOpen, open, close }) => {
        return (
            <Animated.View 
                style={[
                    styles.event_right_underlay, 
                    {
                        borderBottomWidth: !isLast ? 1 : 0, 
                        borderBottomColor: props.theme.s2,
                        backgroundColor: priorityColor,
                        transform: [
                            { translateX: sub(multiply(percentOpen, 200), 200) }
                        ],
                    },
                ]}
            >
                <View style={{
                    width: 200,
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <View style={{
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 8,
                        borderLeftWidth: 1,
                        borderRightWidth: 1,
                        borderColor: props.theme.s8,
                    }}>
                        <View style={{ borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.event_underlay_text, { color: toRGBA(props.theme.s6, 0.8), marginBottom: 10, }]}>
                                {get12HourTimeText(item.event.startTime) + ' ' + getDateText(item.event.startDate.day, item.event.startDate.month, item.event.startDate.year)}
                            </Text>
                            <Text style={[styles.event_underlay_text, { color: toRGBA(props.theme.s6, 0.8) }]}>{get12HourTimeText(item.event.endTime) + ' ' + endDateText}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }

    const UnderlayLeft = ({ item, percentOpen, open, close }) => { // TODO: change to archive, have archived section
        return (
            <Animated.View 
                style={[
                    styles.event_left_underlay, 
                    {
                        borderBottomWidth: !isLast ? 1 : 0, 
                        borderBottomColor: props.theme.s2,
                        opacity: percentOpen,
                        backgroundColor: props.theme.s11
                    }
                ]}
            >
                <TouchableOpacity style={{right: 17}}>
                    <Icon
                        name='trash-2'
                        type='feather'
                        size={20}
                        color={props.theme.s1}
                        onPress={() => {close(); props.handleDelete(props.sectionData.name, item.key);}}
                    />
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <SwipeableItem
            renderUnderlayRight={({percentOpen, close}) => <UnderlayRight item={props.item} percentOpen={percentOpen} close={close} />}
            snapPointsRight={[200]}
            renderUnderlayLeft={({percentOpen, close}) => <UnderlayLeft item={props.item} percentOpen={percentOpen} close={close} />}
            snapPointsLeft={[55]}
            overSwipe={20}
        >
            <View style={{
                width: '100%',
                minHeight: 65,
                borderBottomWidth: !isLast ? 1 : 0, 
                borderBottomColor: props.theme.s2,
                backgroundColor: props.isActive ? toRGBA(props.theme.s4, 0.5) : priorityColor,
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
                        props.handleScrollEnabled(false);
                        props.drag();
                    }}
                    onPress={() => props.handleAddMenuOpen(true, {
                        key: props.item.key,
                        sectionName: props.sectionData.name,
                        priority: props.item.event.priority,
                        description: props.item.event.text,
                        startDate: {
                            day: props.item.event.startDate.day,
                            month: props.item.event.startDate.month,
                            year: props.item.event.startDate.year,
                        },
                        startTime: props.item.event.startTime,
                        endDate: {
                            day: props.item.event.endDate.day,
                            month: props.item.event.endDate.month,
                            year: props.item.event.endDate.year,
                        },
                        endTime: props.item.event.endTime,
                    })}
                >
                    <View style={{ paddingRight: alertText !== 'FTR' ? 45 : 0 }}>
                        <Text style={[styles.event_text, {color: props.theme.s6}]}>{props.item.event.text}</Text>
                    </View>
                    {alertText !== 'FTR' &&
                        <View style={{ position: 'absolute', right: 15, width: 45, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon
                                name={alertText === 'PST' ? 'check-circle' : 'alert-circle'}
                                type='feather'
                                size={20}
                                color={alertColor}
                            />
                            {alertText !== 'PST' && <Text style={{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: alertColor }}>{alertText}</Text>}
                        </View>
                    }
                </TouchableOpacity>
            </View>
        </SwipeableItem>
    );
}

const BorderedFlatList = (props) => {
    if(props.data.events.length <= 0) {
        return null;
    }

    return (
        <View style={{ width: '100%', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => props.handleOpenEditSectionMenu(props.data.name, props.data.color, props.data.index)}>
                <Text style={[ styles.event_text, { color: props.theme.s6, alignSelf: 'flex-start', fontSize: 27.5, marginBottom: 15 }] }>{props.data.name}:</Text>
            </TouchableOpacity>
            <View style={{ borderLeftWidth: 1.5, borderLeftColor: props.data.color, borderRadius: 11 }}>
                <View style={{ borderRadius: 11, overflow: 'hidden' }}>
                    <DraggableFlatList 
                        data={props.data.events}
                        renderItem={({item, index, drag, isActive}) => 
                            <DraggableItem 
                                theme={props.theme} 
                                sectionData={props.data}
                                item={item} 
                                index={index} 
                                drag={drag} 
                                isActive={isActive} 
                                dataSize={props.data.events.length} 
                                handleAddMenuOpen={props.handleAddMenuOpen}
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

const ThinDivider = ({ theme }) => {
    return (
        <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.s4, marginBottom: 5 }} />
    );
}

const EventList = (props) => {
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [editSectionMenuData, setEditSectionMenuData] = useState({
        name: '',
        color: '',
        index: -1,
    });
    
    const checkEventsEmpty = () => {
        for (let i = 0; i < props.sortedEvents.length; i++) {
            if (props.sortedEvents[i].events.length !== 0) {
                return false;
            }
        }
        return true;
    };

    if (checkEventsEmpty()) {
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
                        handleAddMenuOpen={props.handleAddMenuOpen}
                        handleOpenEditSectionMenu={(editSectionName, editSectionColor, editSectionIndex) => {
                            if (props.editMenuAnimationFinished) {
                                props.setEditMenuAnimationFinished(false);
                                setEditSectionMenuData({
                                    name: editSectionName,
                                    color: editSectionColor,
                                    index: editSectionIndex,
                                });
                                props.setEditSectionMenuOpen(true);
                            }
                        }}
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
            <ScrollableMenu
                headerText='Edit Section:'
                menuVisible={props.editSectionMenuOpen}
                bezierAnimCurve={bezierAnimCurve}
                handleCloseMenu={() => {
                    if (props.editMenuAnimationFinished) {
                        props.setEditMenuAnimationFinished(false);
                        Keyboard.dismiss();
                        props.setEditSectionMenuOpen(false);
                    }
                }}
                setMenuAnimationFinished={() => props.setEditMenuAnimationFinished(true)}
            >
                <Field
                    theme={props.theme}
                    text='Name:'
                    rightComponent={
                        <View style={{ width: '60%', height: '100%', justifyContent: 'center' }}>
                            <ThemedButton
                                text={editSectionMenuData.name}
                                sideComponent={
                                    <Icon
                                        name='type'
                                        type='feather'
                                        size={20}
                                        color={props.theme.s4}
                                    />
                                }
                                widthPct={100}
                                heightPct={75}
                                onPress={() => console.log('opening name change input')}
                            />
                        </View>
                    }
                />
                <View>
                    <Field
                        theme={props.theme}
                        text='Color:'
                    />
                    <Animated.View style={{ position: 'absolute', right: 0, width: '60%', height: 65, justifyContent: 'center' }}>
                        <Pressable
                            style={({ pressed }) => [{
                                width: '100%',
                                height: '75%',
                                borderWidth: 1.5,
                                borderRadius: 30,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: pressed ? toRGBA(props.theme.s2, 0.7) : props.theme.s1,
                                borderColor: props.theme.s2,
                            }]}
                            onPress={() => console.log('opening color picker')}
                        >
                            <Text style={{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: props.theme.s6, marginRight: 10 }}>
                                {editSectionMenuData.color}
                            </Text>
                            <MaterialDesignIcons 
                                name='palette' 
                                size={20}
                                color={props.theme.s4}
                            />
                        </Pressable>
                    </Animated.View>
                </View>
                <Field
                    theme={props.theme}
                    text='Change Section Order:'
                />
                <Text style={[styles.event_text, { color: props.theme.s6 }]}>Insert draggable flatlist here, where current section has index {editSectionMenuData.index}</Text>
                <ThinDivider theme={props.theme} />
                <View style={{ width: '100%', height: 50, alignItems: 'center', marginTop: 30 }}>
                    <ThemedButton
                        text='Delete This Section'
                        color={props.theme.s11}
                        widthPct={60}
                        heightPct={100}
                        onPress={() => console.log('Section ' + editSectionMenuData.name + ' deleted.')}
                    />
                </View>
            </ScrollableMenu>
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
 * - name = name of the dropdown
 * - selectedItem (string) = current selected item string
 * - items (list) = all items (strings)
 * - dropdownOpen (bool) = whether dropdown is open
 * - handleDropdownOpen (function) = function to open dropdown
 * - handleAddNew (function) = function for add button *(required if add button is enabled, else optional)*
 * ---
 * Optional:
 * - containerStyle = custom style of menu
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

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addName, setAddName] = useState('');

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

    const DropdownBox = ({ name, showCheck=false, customIcon }) => {
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
                <View style={{ width: '85%', height: '100%', alignSelf: 'flex-start', flexDirection: 'row', paddingRight: 10, justifyContent: 'center' }}>
                    <Text style={[{ fontFamily: 'Proxima Nova Bold', fontSize: 15, color: props.theme.s6, textAlign: 'center', textAlignVertical: 'center' }, props.textStyle]}>{name}</Text>
                </View>
                {showCheck && <View style={{ position: 'absolute', right: 5, top: 11 }}>
                    <Icon
                        name='check'
                        type='feather'
                        size={20}
                        color={props.theme.s4}
                    />
                </View>}
                {customIcon}
            </Pressable>
        );
    }

    const dropdownBoxes = props.items.map((item, index) => <DropdownBox name={item} showCheck={props.selectedItem === item} key={index} />);

    return (
        <React.Fragment>
            <Animated.View style={[defaultStyle.container, props.containerStyle, animatedDropdownStyle]}>
                <DropdownBox name={props.selectedItem} customIcon={
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
                } />
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
                            props.handleDropdownOpen(props.name, false);
                            setAddName('');
                            setAddModalVisible(true);
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
            </Animated.View>
            {props.addNewBtnEnabled &&
                <Modal
                    animationType='fade'
                    transparent={true}
                    visible={addModalVisible}
                    onRequestClose={() => setAddModalVisible(false)}
                >
                    <View style={{
                        width: '100%',
                        top: Dimensions.get('window').height / 2.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: MAIN_CONTAINER_LEFT_RIGHT_PADDING,
                        paddingRight: MAIN_CONTAINER_LEFT_RIGHT_PADDING,
                    }}>
                        <View style={[styles.dropdown_add_input_container, { backgroundColor: props.theme.s9 }]}>
                            <TextInput
                                textBreakStrategy='simple'
                                placeholder='Tap to edit'
                                placeholderTextColor={toRGBA(props.theme.s4, 0.5)}
                                value={addName}
                                onChangeText={text => {
                                    setAddName(text);
                                }}
                                style={[styles.event_text, { width: '90%', color: props.theme.s6, borderBottomWidth: 2, borderColor: props.theme.s2 }]}
                            />
                        </View>
                        <View style={[styles.modal_back_button_container, { backgroundColor: props.theme.s9 }]}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.modal_back_button,
                                    {
                                        backgroundColor: pressed ? props.theme.s13 : props.theme.s1
                                    },
                                ]}
                                onPress={() => {
                                    const trimmedAddName = addName.trim();
                                    if (trimmedAddName !== '') {
                                        props.handleAddNew(trimmedAddName);
                                        props.handlePress(trimmedAddName);
                                    }
                                    setAddModalVisible(false);
                                }}
                            >
                                <Text style={[styles.modal_back_button_text, { color: props.theme.s2 }]}>Done</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            }
        </React.Fragment>
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
                    <View style={{ width: '60%', height: '100%', justifyContent: 'center' }}>
                        <ThemedButton
                            text={getDateText(selectedDate.day, selectedDate.month, selectedDate.year)}
                            sideComponent={
                                <Icon
                                    name='calendar'
                                    type='feather'
                                    size={20}
                                    color={theme.s6}
                                />
                            }
                            widthPct={100}
                            heightPct={75}
                            onPress={() => setCalendarModalVisible(true)}
                        />
                    </View>
                }
            />
            <Modal
                animationType='fade'
                transparent={true}
                visible={calendarModalVisible}
                onRequestClose={() => setCalendarModalVisible(false)}
            >
                <View style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: MAIN_CONTAINER_LEFT_RIGHT_PADDING,
                    paddingRight: MAIN_CONTAINER_LEFT_RIGHT_PADDING,                    
                }}>
                    <View style={[styles.calendar_container, {backgroundColor: theme.s9}]}>
                        <StaticCalendar
                            dateToday={dateToday}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
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
                <View style={{ width: '50%', height: '100%', justifyContent: 'center' }}>
                    <ThemedButton
                        text={get12HourTimeText(time)}
                        sideComponent={
                            <Icon
                                name='clock'
                                type='feather'
                                size={20}
                                color={theme.s6}
                            />
                        }
                        widthPct={100}
                        heightPct={75}
                        onPress={() => {
                            setTimeModalOpen(true);
                            timeModalOpacity.value = 1;
                        }}
                    />
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
                        height: Dimensions.get('window').height / 1.8, // account for bottom nav bar and top header
                        zIndex: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                ]}>
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
                </Animated.View>
            }
        </View>
    );
}

//military 24-hour time as string
const DEFAULT_START_TIME = '0800'; //8:00 AM
const DEFAULT_END_TIME = '1200'; //12:00 PM

const AddMenu = (props) => {
    const [menuHeaderText, setMenuHeaderText] = useState('New Event:');
    const [eventToAdd, setEventToAdd] = useState({
        sectionName: props.sectionsData.sectionNames[0],
        priority: props.priorityData[0],
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
    const [charsLeft, setCharsLeft] = useState(MAX_EVENT_CHARS);
    const [openDropdownMenus, setOpenDropdownMenus] = useState({
        sectionName: false,
        priority: false,
    });
    const [otherDropdownOpening, setOtherDropdownOpening] = useState(false);
    const [startTimeModalOpen, setStartTimeModalOpen] = useState(false);
    const startTimeModalOpacity = useSharedValue(0);
    const [endTimeModalOpen, setEndTimeModalOpen] = useState(false);
    const endTimeModalOpacity = useSharedValue(0);

    const handleDropdownOpen = (key, newValue) => {
        let newOpenDropdownMenus = { ...openDropdownMenus };
        if (!newValue) {
            newOpenDropdownMenus[key] = false;
            setOpenDropdownMenus(newOpenDropdownMenus);
            setOtherDropdownOpening(false);
        } else {
            let keys = Object.keys(newOpenDropdownMenus);
            let otherOpening = false;
            for (let i = 0; i < keys.length; i ++) {
                let curKey = keys[i];
                if (curKey === key) {
                    newOpenDropdownMenus[key] = true;
                } else {
                    if (newOpenDropdownMenus[curKey]) {
                        otherOpening = true;
                        newOpenDropdownMenus[curKey] = false;
                    }
                }
            }
            setOpenDropdownMenus(newOpenDropdownMenus);
            setOtherDropdownOpening(otherOpening);
        }
    }

    const handleEditEvent = (key) => {
        return (newProperty) => {
            let newEventToAdd = { ...eventToAdd };
            newEventToAdd[key] = newProperty;
            setEventToAdd(newEventToAdd);
        };
    }

    const resetStates = () => {
        setMenuHeaderText('New Event:');
        setEventToAdd({
            sectionName: props.sectionsData.sectionNames[0],
            priority: props.priorityData[0],
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
        setCharsLeft(MAX_EVENT_CHARS);
    };
    
    useEffect(() => {
        props.setMenuAnimationFinished(false);
        setOpenDropdownMenus({ // close all dropdowns regardless of opening or closing the add menu
            sectionName: false,
            priority: false,
        });
        if(props.menuVisible) {
            if (props.editing) {
                setMenuHeaderText('Edit Event:');
                setEventToAdd({
                    sectionName: props.editData.sectionName,
                    priority: props.editData.priority,
                    description: props.editData.description,
                    startDate: {
                        day: props.editData.startDate.day,
                        month: props.editData.startDate.month,
                        year: props.editData.startDate.year,
                    },
                    startTime: props.editData.startTime,
                    endDate: {
                        day: props.editData.endDate.day,
                        month: props.editData.endDate.month,
                        year: props.editData.endDate.year,
                    },
                    endTime: props.editData.endTime,
                });
                setCharsLeft(MAX_EVENT_CHARS - props.editData.description.length);
            } else {
                resetStates(); // repeated code for safety
            }
        } else {
            setTimeout(resetStates, 500);
        }
    }, [props.menuVisible]);

    return (
        <ScrollableMenu
            headerText={menuHeaderText}
            nonScrollingComponent={
                <React.Fragment>
                    <TimeModal
                        timeModalOpen={startTimeModalOpen}
                        setTimeModalOpen={setStartTimeModalOpen}
                        timeModalOpacity={startTimeModalOpacity}
                        time={eventToAdd.startTime}
                        setTime={handleEditEvent('startTime')}
                        theme={props.theme}
                    />
                    <TimeModal
                        timeModalOpen={endTimeModalOpen}
                        setTimeModalOpen={setEndTimeModalOpen}
                        timeModalOpacity={endTimeModalOpacity}
                        time={eventToAdd.endTime}
                        setTime={handleEditEvent('endTime')}
                        theme={props.theme}
                    />
                </React.Fragment>
            }
            menuVisible={props.menuVisible}
            bezierAnimCurve={bezierAnimCurve}
            handleCloseMenu={() => {
                Keyboard.dismiss();
                props.closeMenu();
            }}
            setMenuAnimationFinished={props.setMenuAnimationFinished}
        >
            <Field
                theme={props.theme}
                text='Section Name:'
                rightComponent={
                    <DropdownMenu
                        theme={props.theme}
                        selectedItem={eventToAdd.sectionName}
                        items={props.sectionsData.sectionNames}
                        textStyle={{ left: 10 }}
                        addNewBtnEnabled={true}
                        handleAddNew={props.handleAddSection}
                        handlePress={handleEditEvent('sectionName')}
                        name='sectionName'
                        dropdownOpen={openDropdownMenus.sectionName}
                        handleDropdownOpen={handleDropdownOpen}
                        otherDropdownOpening={otherDropdownOpening}
                    />
                }
            />
            <Field
                theme={props.theme}
                text='Priority:'
                rightComponent={
                    <DropdownMenu 
                        theme={props.theme}
                        selectedItem={eventToAdd.priority}
                        items={props.priorityData}
                        containerStyle={{ width: '30%' }}
                        textStyle={{ left: 5 }}
                        addNewBtnEnabled={false}
                        handlePress={handleEditEvent('priority')}
                        name='priority'
                        dropdownOpen={openDropdownMenus.priority}
                        handleDropdownOpen={handleDropdownOpen}
                        otherDropdownOpening={otherDropdownOpening}
                    />
                }
            />
            <ThinDivider theme={props.theme} />
            <DateField
                text='Start Date:'
                selectedDate={eventToAdd.startDate}
                setSelectedDate={handleEditEvent('startDate')}
                theme={props.theme}
            />
            <TimeField
                text='Start Time:'
                time={eventToAdd.startTime}
                setTimeModalOpen={setStartTimeModalOpen}
                timeModalOpacity={startTimeModalOpacity}
                theme={props.theme}
            />
            <DateField
                text='End Date:'
                selectedDate={eventToAdd.endDate}
                setSelectedDate={handleEditEvent('endDate')}
                theme={props.theme}
            />
            <TimeField
                text='End Time:'
                time={eventToAdd.endTime}
                setTimeModalOpen={setEndTimeModalOpen}
                timeModalOpacity={endTimeModalOpacity}
                theme={props.theme}
            />
            <ThinDivider theme={props.theme} />
            <Field
                theme={props.theme}
                text='Description:'
                containerStyle={{ marginBottom: 0 }}
            />
            <View
                style={{
                    width: '100%', 
                    height: 150,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 15,
                    borderWidth: 1.5,
                    borderColor: props.theme.s2,
                    borderRadius: 30,
                    marginBottom: 40,
                    overflow: 'hidden',
                }}
            >
                <TextInput
                    scrollEnabled={false}
                    multiline={true}
                    maxLength={MAX_EVENT_CHARS}
                    textBreakStrategy='simple'
                    placeholder='Tap to edit'
                    placeholderTextColor={toRGBA(props.theme.s4, 0.5)}
                    value={eventToAdd.description}
                    onChangeText={text => {
                        if (text.slice().split('').indexOf('\n') === -1) {
                            setEventToAdd({
                                ...eventToAdd,
                                description: text,
                            });
                            setCharsLeft(MAX_EVENT_CHARS - text.length);
                        } else {
                            Keyboard.dismiss();
                        }
                    }}
                    style={[styles.event_text, { width: '95%', height: '100%', marginRight: 15, borderRadius: 15, color: props.theme.s6 }]}
                />
                <Text style={{ position: 'absolute', right: 8, top: '60%', color: props.theme.s4 }}>{charsLeft}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', height: 40, marginBottom: 50 }}>
                <ThemedButton
                    text='Done'
                    widthPct={30}
                    heightPct={100}
                    onPress={() => {
                        if(eventToAdd.description.trim() !== '') {
                            if(props.editing) {
                                props.handleChange(
                                    props.editData.sectionName,                           // editData.sectionName is the previous section of the current eventToAdd
                                    props.editData.key,                                   // key is only used for lookup and should not be changed.
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
                                props.closeMenu();
                            } else {
                                props.handleAdd(
                                    eventToAdd.sectionName,
                                    eventToAdd.priority,
                                    eventToAdd.description,
                                    eventToAdd.startDate,
                                    eventToAdd.startTime,
                                    eventToAdd.endDate,
                                    eventToAdd.endTime,
                                );
                                Keyboard.dismiss();
                                props.closeMenu();
                            }
                        } else {
                            Alert.alert('mhmahmawj you can\'t have an empty description');
                        }
                    }}
                />
            </View>
        </ScrollableMenu>
    );
}

const PlannerPage = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [isLoading, setIsLoading] = useState(true);
    const [addButtonVisible, setAddButtonVisible] = useState(true);
    const [addMenuData, setAddMenuData] = useState({ visible: false, isEditing: false, editData: {} });
    const [addMenuAnimationFinished, setAddMenuAnimationFinished] = useState(true);

    const [editSectionMenuOpen, setEditSectionMenuOpen] = useState(false);
    const [editMenuAnimationFinished, setEditMenuAnimationFinished] = useState(true);

    const [events, setEvents] = useState([]);
    const [sectionsData, setSectionsData] = useState({});
    const [priorityData, setPriorityData] = useState([1, 2, 3]); // TODO: allow user to add or change priority array

    const refreshClasses = async () => {
        try {
            // check if there is already planner data. If there is, return. otherwise create new sections and set the data
            let storedEvents = await AsyncStorage.getItem('plannerEvents');
            if (storedEvents !== null)
                return;

            let storedClasses = await AsyncStorage.getItem('classes');
            let parsed = await JSON.parse(storedClasses);
            if (Array.isArray(parsed)) {
                let eventSections;
                let sectionNames = [];
                if (events.length === 0) {
                    eventSections = [];
                    for (let i = 0; i < parsed.length; i++) {
                        const item = parsed[i];
                        const cleanTitle = item.Title.substr(0, item.Title.indexOf('(')).trim();
                        eventSections.push({
                            // TODO: get color from async storage
                            key: getRandomKey(10),
                            color: randomHSL(),
                            index: i,
                            name: cleanTitle,
                            events: [],
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
            dataArr.events.push({
                key: randomKey,
                event: {
                    text: initData.description,
                    priority: initData.priority,
                    charsLeft: MAX_EVENT_CHARS - initData.description.length,
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
            section.events.splice(section.events.findIndex(event => event.key === itemKey), 1);
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
            let newEvents = events.slice();
            let section = newEvents.find(elem => elem.name === prevSectionName);
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
                let newSection = newEvents.find(elem => elem.name === newData.sectionName).name;
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
            setEvents(newEvents);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
        } catch(err) {
            console.log(err);
        }
    }

    const handleAddSection = async (newSectionName) => {
        try {
            let newEvents = events.slice();
            const newIdx = newEvents.length;
            newEvents.push({
                key: getRandomKey(10),
                color: '',
                index: newIdx,
                name: newSectionName,
                events: [],
            });
            setEvents(newEvents);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            let newSectionNames = sectionsData.sectionNames.slice();
            newSectionNames.push(newSectionName);
            setSectionsData({
                ...sectionsData,
                sectionNames: newSectionNames,
            });
        } catch(err) {
            console.log(err);
        }
    }

    const handleAddMenuOpen = (isEditing=false, editData={}) => {
        if (addMenuAnimationFinished) {
            if (!(addButtonVisible && editSectionMenuOpen)) {
                setAddMenuData({ visible: addButtonVisible, isEditing: isEditing, editData: editData });
                setAddButtonVisible(!addButtonVisible);
            }
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

    if (isLoading) {
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
                    editSectionMenuOpen={editSectionMenuOpen}
                    setEditSectionMenuOpen={(open) => {
                        if (!(open && addMenuData.visible)) {
                            setEditSectionMenuOpen(open);
                        }
                    }}
                    editMenuAnimationFinished={editMenuAnimationFinished}
                    setEditMenuAnimationFinished={setEditMenuAnimationFinished}
                    handleAddMenuOpen={handleAddMenuOpen}
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
                    handleAddSection={handleAddSection}
                    editing={addMenuData.isEditing}
                    editData={addMenuData.editData}
                    menuVisible={addMenuData.visible}
                    setMenuAnimationFinished={setAddMenuAnimationFinished}
                    closeMenu={handleAddMenuOpen}
                />
            </View>
            <AddButton
                theme={theme} 
                buttonVisible={addButtonVisible}
                handleOpen={handleAddMenuOpen}
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
        paddingLeft: MAIN_CONTAINER_LEFT_RIGHT_PADDING,
        paddingRight: MAIN_CONTAINER_LEFT_RIGHT_PADDING,
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
    event_underlay_text: {
        fontSize: 12,
        fontFamily: 'ProximaNova-Regular',
    },
    event_text: {
        fontSize: 18,
        fontFamily: 'Proxima Nova Bold',
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
    dropdown_add_input_container: {
        width: '100%',
        height: 100,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendar_container: {
        width: '100%',
        height: '45%',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 5,
        paddingTop: 10,
        paddingBottom: 50,
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
