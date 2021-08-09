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
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, ThemeConsumer } from 'react-native-elements';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    greaterOrEq
} from 'react-native-reanimated';
import SwipeableItem from 'react-native-swipeable-item/src';
import DraggableFlatList from 'react-native-draggable-flatlist';
import TabViewComponent from 'react-native-elements/dist/tab/TabView';

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

const maxEventChars = 80;

const bezierAnimCurve = Easing.bezier(0.5, 0.01, 0, 1);

const EventModal = ({ modalVisible, setModalVisible, text, charsLeft, changeEventText, deleteEvent, theme }) => {
    return (
        <Modal
            animationType='fade'
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(false);
            }}
        >
            <View style={[styles.event_modal, {backgroundColor: theme.s13, borderColor: theme.s4}]}>
                <Pressable
                    onPress={() => setModalVisible(false)}
                    style={[{backgroundColor: theme.s6}, styles.event_modal_button]}
                >
                    <Text style={[styles.event_modal_text, {color: theme.s1}]}>Hide</Text>
                </Pressable>
                <Pressable
                    onPress={() => {deleteEvent(); setModalVisible(false);}}
                    style={[{backgroundColor: theme.s2}, styles.event_modal_button]}
                >
                    <Text style={[styles.event_modal_text, {color: theme.s1}]}>Delete</Text>
                </Pressable>
            </View>
        </Modal>
    );
}

const EventBox = ({ sectionIdx, eventIdx, data, handleDelete, handleTextChange, handleDrag, isDragging, resetAddButton, theme }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditingBox, setIsEditingBox] = useState(data.text === '' ? true : false);

    const [text, setText] = useState(data.text);
    const [charsLeft, setCharsLeft] = useState(data.charsLeft);

    const underlayLeft = useCallback(({ item, percentOpen, open, close }) => {//TODO: change to archive, have archived section
        return (<Animated.View style={[styles.event_edit_underlay, {opacity: percentOpen, backgroundColor: theme.s11}]}>
            <TouchableOpacity style={{right: 17}}>
                <Icon
                    name='trash-2'
                    type='feather'
                    size={35}
                    color={theme.s9}
                    onPress={() => {handleDelete(sectionIdx, eventIdx); close();}}
                />
            </TouchableOpacity>
        </Animated.View>);
    }, []);
    
    return (
        <View style={[styles.event_container, {borderTopWidth: 1.5, borderTopColor: theme.s2, borderBottomWidth: 1.5, borderBottomColor: theme.s2}]}>
            <SwipeableItem
                renderUnderlayLeft={underlayLeft}
                snapPointsLeft={[70]}
            >
                <Pressable
                    style={[styles.event_box, {backgroundColor: isDragging ? theme.s9 : theme.s1, borderColor: theme.s3}]}
                    onPress={() => setModalVisible(true)}
                    delayLongPress={300}
                    onLongPress={handleDrag}
                >
                    <EventModal
                        modalVisible={modalVisible}
                        setModalVisible={setModalVisible}
                        text={text}
                        charsLeft={charsLeft}
                        changeEventText={(newText, newCharsLeft) => handleTextChange(sectionIdx, eventIdx, newText, newCharsLeft)}
                        deleteEvent={() => handleDelete(sectionIdx, eventIdx)}
                        theme={theme}
                    />
                    {isEditingBox ? (
                        <View style={styles.event_text_box}>
                            <Text style={[styles.event_character_count, {color: theme.s4}]}>{ charsLeft }</Text>
                            <View style={{minWidth: '100%', marginLeft: -4, marginRight: -4}}>
                                <TextInput
                                    scrollEnabled={false}
                                    multiline={true}
                                    autoFocus={true}
                                    maxLength={maxEventChars}
                                    textBreakStrategy='simple'
                                    placeholder='Enter an event'
                                    placeholderTextColor={toRGBA(theme.s6, 0.5)}
                                    value={text}
                                    onChangeText={text => {
                                        if (text.slice(-1) !== '\n') {
                                            setText(text);
                                            setCharsLeft(maxEventChars - text.length);
                                        }
                                    }}
                                    onEndEditing={ () => {
                                        if (isEditingBox === true) {
                                            handleTextChange(sectionIdx, eventIdx, text, charsLeft);
                                            resetAddButton();
                                            setIsEditingBox(false);
                                        }
                                    }}
                                    style={[styles.event_text, {color: theme.s6}]}
                                />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.event_text_box}>
                            <Text
                                style={[styles.event_text, {color: theme.s6}]}
                                selectable={true}
                                textBreakStrategy='simple'
                            >
                                { text }
                            </Text>
                        </View>
                    )}
                </Pressable>
            </SwipeableItem>
        </View>
    );
}

const EventList = ({ isLoading, sortedEvents, handleDelete, handleTextChange, handleUpdateSection, resetAddButton, theme }) => {
    const [scrollEnabled, setScrollEnabled] = useState(true);

    const checkEventsEmpty = () => {
        for (let i = 0; i < sortedEvents.length; i ++) {
            if (sortedEvents[i].data.length !== 0) {
                return false;
            }
        }
        return true;
    };

    const renderSectionHeader = useCallback((section) => {
        return (<View style={[styles.section_button, {backgroundColor: theme.s3}, section.data.length > 0 && {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
        }]}>
            <Text style={[styles.section_button_text, {color: theme.s6}]}>{section.name}</Text>
        </View>);
    }, []);

    return (
        isLoading ? (
            <View style = {[styles.loading_container, {backgroundColor: theme.s1}]}>
                <ActivityIndicator size = 'large' color = {theme.s4} />
            </View>
        ) : ( checkEventsEmpty() ? (  
            <View style={styles.helper_container}>
                <Text style={[styles.helper_text, {color: theme.s6}]}>
                    There are no events in your planner right now...{'\n'}
                    Click the button on the bottom right to add one!
                </Text>
            </View>
        ) : (
            <View style={styles.event_list_container}>
                <FlatList
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={scrollEnabled}
                    data={sortedEvents}
                    renderItem={({ item, index }) => {
                        let sectionIdx = index;
                        let sectionLength = item.data.length;
                        return (<React.Fragment>
                            {renderSectionHeader(item)}
                            <DraggableFlatList
                                scrollEnabled={false}
                                containerStyle={[sectionLength > 0 && styles.section_container, {borderColor: theme.s3}]}
                                data={item.data}
                                renderItem={({ item, index, drag, isActive }) => {
                                    return (<EventBox
                                        key={item.key}
                                        sectionIdx={sectionIdx}
                                        eventIdx={index}
                                        data={item.data}
                                        handleDelete={handleDelete}
                                        handleTextChange={handleTextChange}
                                        handleDrag={drag}
                                        isDragging={isActive}
                                        resetAddButton={resetAddButton}
                                        theme={theme}
                                    />);
                                }}
                                keyExtractor={item => item.key}
                                onDragBegin={() => setScrollEnabled(false)}
                                onDragEnd={({ data }) => {handleUpdateSection(index, data); setScrollEnabled(true);}}
                                activationDistance={20}
                            />
                        </React.Fragment>);
                    }}
                    ItemSeparatorComponent={() => <View style={{marginBottom: 15}} />}
                    ListFooterComponent={() => <View style={{marginBottom: 90}} />}
                    keyExtractor={item => item.key}
                    removeClippedSubviews={false}
                />
            </View>
        ))
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
        <View style={{position: 'absolute', bottom: 100, right: 0, width: '100%', height: '100%'}}>
            <Animated.View style={[styles.add_button, {backgroundColor: theme.s5}, addButtonAnimatedStyle]}>
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
        </View>
    );
}

const Field = (props) => {                           // props: containerStyle = custom style of field (opt), textStyle = custom style of text (opt), theme = theme object (required)
    const defaultStyle = StyleSheet.create({         // text = left text, rightComponent = component to render on right side of the field
        container: {
            width: '100%',
            height: '8%',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            marginBottom: 5,
        },
        main_text: {
            width: '100%',
            height: '100%',
            alignSelf: 'flex-start',
            justifyContent: 'center',
            fontFamily: 'Proxima Nova Bold',
            fontSize: 20,
            textAlignVertical: 'center',
            color: props.theme.s4,
        }
    });
    return (
        <View style={[defaultStyle.container, props.containerStyle]}>
            <Text style={[defaultStyle.main_text, props.textStyle]}>{props.text}</Text>
            {props.rightComponent}
        </View>
    );
}

const DropdownMenu = (props) => {                               // props: containerStyle = custom style of menu (opt), theme = theme object (required),                                                             
    const [dropdownZIndex, setDropdownZIndex] = useState(1);    // decorator (obj) = left decorator for each box (opt), textStyle = custom style of text (opt)
                                                                // handlePress (function) = function to call for each button when it's pressed (opt),
    const defaultStyle = StyleSheet.create({                    // addNewBtnEnabled = whether to have an add new button (opt), name = name of the dropdown (required),
        container: {                                            // handleAddNew (function) = function for add button (required if add button is enabled, else optional)
            width: '55%',                                       // dropdownOpen (bool) = whether dropdown is open (required), handleDropdownOpen (function) = function to open dropdown (required),
            height: '80%', 
            position: 'absolute',
            top: 7, 
            zIndex: dropdownZIndex,
            borderWidth: 1.5,
            borderColor: props.theme.s2,
            borderRadius: 15,
            overflow: 'hidden',
            backgroundColor: props.theme.s1
        },
        main_text: {
            width: '100%',
            height: '100%',
            alignSelf: 'flex-start',
            justifyContent: 'center',
            fontFamily: 'Proxima Nova Bold',
            fontSize: 20,
            textAlignVertical: 'center',
            color: props.theme.s4,
        }
    });

    const collapsedHeight = heightPctToDP(6, 15); // same height as one box
    const expandedHeight = collapsedHeight * (props.items.length + props.addNewBtnEnabled);

    const animatedDropdownStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(props.dropdownOpen ? expandedHeight : collapsedHeight, {duration: 200, easing: Easing.in(bezierAnimCurve)}),
        }
    });

    useEffect(() => {
        if(props.dropdownOpen) {
            setDropdownZIndex(4);
        } else {
            setTimeout(() => {
                setDropdownZIndex(2);
            }, 200);
        }
    }, [props.dropdownOpen]);

    let dropdownBoxes = props.items.map((item, index) => {
        return (
            <Pressable 
                key={index}
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
                    props.handlePress(item);
                    props.categoryData
                }}
            >
                <View style={{width: '85%', height: '100%', alignSelf: 'flex-start', flexDirection: 'row',}}>
                    {props.decorator ? 
                        <View style={{flex: 1}}>
                            {props.decorator}
                        </View>
                        : null
                    }
                    <View style={{flex: 4, alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={[{fontFamily: 'Proxima Nova Bold', fontSize: 15, color: props.theme.s6}, props.textStyle]}>{item}</Text>
                    </View>
                </View>
            </Pressable>
        );
    });

    return (
        <Animated.View style={[defaultStyle.container, props.style, animatedDropdownStyle]}>
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
                {props.items.length > 1 
                    ? (<MaterialDesignIcons 
                        name={props.dropdownOpen ? 'chevron-up' : 'chevron-down'} 
                        size={22} 
                        color={props.theme.s4} 
                        style={{
                            position: 'absolute',
                            top: 9,
                            right: 7,
                            zIndex: 2,
                        }}
                    />) : null
                }
                {dropdownBoxes}
                {props.addNewBtnEnabled 
                    ? (
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
                                // TODO: add handleAddNew function
                            }}
                        >
                            <View style={{width: '85%', height: '100%', alignSelf: 'flex-start', flexDirection: 'row',}}>
                                <MaterialDesignIcons name='plus' size={17} color={props.theme.s4} style={{position: 'absolute', top: 11, left: 47.5}} />
                                <View style={{flex: 4, alignItems: 'center', justifyContent: 'center'}}>
                                    <Text style={[{fontFamily: 'Proxima Nova Bold', fontSize: 15, color: props.theme.s6, left: 15}]}>Add New</Text>
                                </View>
                            </View>
                        </Pressable>
                    ) : null
                }
            </Pressable>
        </Animated.View>
    );
}

const AddMenu = ({ categoryData, priorityData, handleAdd, theme }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [eventToAdd, setEventToAdd] = useState({});
    const [charsLeft, setCharsLeft] = useState(maxEventChars);
    const [openMenus, setOpenMenus] = useState({
        category: false,
        priority: false,
    });

    const menuHeight = useSharedValue(0);
    const animatedMenuStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(menuHeight.value, {duration: 700, easing: Easing.in(bezierAnimCurve)}),
        }
    });

    const handleMenuOpen = () => {
        setMenuVisible(true);  
    }

    const handleDropdownOpen = (key, newValue) => {
        let newOpenMenus = {
            category: false,
            priority: false,
        }
        newOpenMenus[key] = newValue;
        setOpenMenus(newOpenMenus);
    }

    const handleEditEvent = (type) => {
        let changeFunction;
        switch(type) {
            case 'category':
                changeFunction = (newCategory) => {
                    setEventToAdd({
                        ...eventToAdd,
                        category: newCategory,
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
            case 'description':
                changeFunction = (newDescription) => {
                    setEventToAdd({
                        ...eventToAdd,
                        description: newDescription,
                    });
                }
                break;        
        }
        return changeFunction;
    }

    const expandedHeight = heightPctToDP(90, 0);
    
    const isFocused = useIsFocused();
    useEffect(() => {
        if(!menuVisible) {
            setEventToAdd({
                category: categoryData[0],
                priority: priorityData[0],
                description: '',
            });
        }
    }, [menuVisible]);

    useEffect(() => {
        menuHeight.value = menuVisible ? expandedHeight : 0;
    }, [menuVisible]);

    return (
        <View style={styles.container}>
            <Animated.View style={[{width: '100%', position: 'absolute', bottom: 0, backgroundColor: theme.s1}, animatedMenuStyle]}>
                <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 45, width: '75%', color: theme.s6, marginBottom: 10}}>New Event:</Text>
                <View style={{borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.s4, marginBottom: 5}} />
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
                        setMenuVisible(false);
                    }}
                >
                    <MaterialDesignIcons name='close' size={30} color={theme.s4} style={{bottom: 0, right: 0}}/>
                </Pressable>
                <Field 
                    theme={theme} 
                    text='Category:' 
                    rightComponent={
                        <DropdownMenu 
                            theme={theme} 
                            items={[eventToAdd.category, ...categoryData.slice().filter(c => c !== eventToAdd.category)]} 
                            textStyle={{left: 10}} 
                            addNewBtnEnabled={true}
                            handlePress={handleEditEvent('category')}
                            name='category'
                            dropdownOpen={openMenus.category}
                            handleDropdownOpen={handleDropdownOpen}
                        />
                    }
                />
                <Field
                    theme={theme}
                    text='Priority:'
                    // possible change: use text input instead of dropdown menu for priorities
                    rightComponent={
                        <DropdownMenu 
                            theme={theme} 
                            items={[eventToAdd.priority, ...priorityData.filter(p => p !== eventToAdd.priority)]} 
                            style={{width: '25%'}} 
                            textStyle={{left: 5}} 
                            addNewBtnEnabled={false}
                            handlePress={handleEditEvent('priority')}
                            name='priority'
                            dropdownOpen={openMenus.priority}
                            handleDropdownOpen={handleDropdownOpen}
                        />
                    }
                />
                <Field
                    theme={theme}
                    text='Description:'
                    containerStyle={{marginBottom: 0}}
                />
                <View
                    style={{
                        width: '100%', 
                        height: 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: theme.s2,
                        borderRadius: 30,
                        marginBottom: 60,
                    }}
                >
                    <TextInput
                        scrollEnabled={false}
                        multiline={true}
                        autoFocus={false}
                        maxLength={maxEventChars}
                        textBreakStrategy='simple'
                        placeholder='Tap to Edit'
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
                        style={[styles.event_text, {color: theme.s6}]}
                    />
                </View>
                <Pressable
                    style={({pressed}) => [
                        {
                            width: 100,
                            height: 40,
                            alignSelf: 'flex-end',
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
                            handleAdd(eventToAdd.category, eventToAdd.priority, eventToAdd.description);
                            setMenuVisible(false);
                        } else {
                            Alert.alert('mhmahmawj you can\'t have an empty description');
                        }
                    }}
                >
                    <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 18, color: theme.s6}}>Add</Text>
                </Pressable>
            </Animated.View>
            <AddButton 
                theme={theme} 
                buttonVisible={!menuVisible /* we don't want the button to be visible when the menu is */} 
                handleOpen={handleMenuOpen}
            />
        </View>
    );
}

const PlannerPage = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();

    const [events, setEvents] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [priorityData, setPriorityData] = useState([1, 2, 3]);
    
    const refreshClasses = async () => {
        try {
            let storedClasses = await AsyncStorage.getItem('classes');
            let parsed = await JSON.parse(storedClasses);
            if (Array.isArray(parsed)) {
                let eventSections;
                if (events.length === 0) {
                    eventSections = [];
                    categoryTitles = [];
                    parsed.map((item, index) => { // TODO: refactor to use for loop, no reason to map and create another array
                        let cleanTitle = item.Title.substr(0, item.Title.indexOf('(')).trim() // clean title meaning without the class id (CHH701.0.OL, etc.)
                        eventSections.push({
                            key: getRandomKey(10),
                            index: index,
                            name: item.Title,
                            data: []
                        });
                        categoryTitles.push(cleanTitle);
                    });
                    categoryTitles.push('Other');
                } else {
                    eventSections = events.slice();
                    parsed.map((item, index) => {
                        eventSections[index].name = item.Title;
                    });
                }
                await AsyncStorage.setItem('plannerEvents', JSON.stringify(eventSections));
                setCategoryData(categoryTitles);
                setEvents(eventSections);
                setIsLoading(false);
            }
        } catch(err) {
            console.log(err)
        }
    };

    useEffect(async () => {
        if (isFocused) {
            await refreshClasses();
        }
    }, [isFocused]);


    useEffect(async () => {
        try {
            let storedEvents = await AsyncStorage.getItem('plannerEvents');
            let parsed = await JSON.parse(storedEvents);
            if(Array.isArray(parsed)) {
                setEvents(parsed);
            }
            let tmpCategoryLabels = [];
            parsed.forEach(section => {
                tmpCategoryLabels.push(section.name.substr(0, section.name.indexOf('(')).trim());
            }); 
            setCategoryData(tmpCategoryLabels);
            setIsLoading(false);
        } catch(err) {
            console.log(err);
        }
    }, []);

    // const handleAdd = async(sectionIdx) => {
    //     try {
    //         let newEvents = events.slice();
    //         let randomKey = getRandomKey(10);
    //         newEvents[sectionIdx].data.push({
    //             key: randomKey,
    //             data: {
    //                 text: '',
    //                 charsLeft: maxEventChars
    //             }
    //         });
    //         await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
    //         LayoutAnimation.configureNext(LayoutAnimation.create(300, 'easeInEaseOut', 'scaleY'));
    //         setEvents(newEvents);
    //     } catch(err) {
    //         console.log(err);
    //     }
    // };

    const handleDelete = async(sectionIdx, eventIdx) => {
        try {
            let newEvents = events.slice();
            newEvents[sectionIdx].data.splice(eventIdx, 1);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    };

    const handleTextChange = async(sectionIdx, eventIdx, newText, newCharsLeft) => {
        try {
            let newEvents = events.slice();
            let edits = newEvents[sectionIdx].data[eventIdx];
            edits.data.text = newText;
            edits.data.charsLeft = newCharsLeft;
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    };

    const handleUpdateSection = async(sectionIdx, newSectionData) => {
        try {
            let newEvents = events.slice();
            newEvents[sectionIdx].data = newSectionData;
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    };

    const getRandomKey = (length) => { // only pseudorandom, do not use for any sensitive data
        let result = ''
        let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charlen = characters.length;
        for(let i=0; i<length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charlen));
        }
        return result;
    };

    if(isLoading) {
        return (
            <View style = {[styles.container, {alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}]}>
                <ActivityIndicator size = 'large' color={theme.s4} />
            </View> 
        );
    }

    return ( 
        <View style = {[styles.container, {backgroundColor: theme.s1}]}>
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
            {/* <EventList
                isLoading={isLoading}
                sortedEvents={events}
                handleDelete={handleDelete}
                handleTextChange={handleTextChange}
                handleUpdateSection={handleUpdateSection}
                resetAddButton={() => { addButtonXOffset.value = 0; }}
                theme={theme}
            /> */}
            <View style={styles.main_container}>
                <AddMenu
                    events={events}
                    isLoading={isLoading}
                    theme={theme}
                    categoryData={categoryData}
                    priorityData={priorityData}
                    handleAdd={(c, p, d) => {console.log('New Event! Category: ' + c + ', Priority: ' + p + ', Description: ' + d)}}
                />
            </View>
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
        width: '100%',
        height: '100%',
        padding: 15,
    },
    loading_container: {
        flex: 1,
        marginBottom: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    event_list_container: {
        marginTop: -15,
        flex: 1,
        width: '100%',
        height: '100%'
    },
    section_container: {
        borderWidth: 3,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        overflow: 'hidden'
    },
    section_button: {
        minHeight: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    section_button_text: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15
    },
    event_container: {
        overflow: 'hidden'
    },
    event_edit_underlay: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    event_box: {
        width: '100%',
        justifyContent: 'center',
        padding: 25
    },
    event_modal: {
        marginTop: Dimensions.get('window').height / 3 - 10,
        marginLeft: 15,
        marginRight: 15,
        height: '30%',
        borderWidth: 3,
        borderRadius: 15,
        flexDirection: 'row',
        padding: 5,
    },
    event_modal_button: {
        flex: 1,
        borderRadius: 10,
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    event_modal_text: {
        fontSize: 25,
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'bold',
    },
    event_text_box: {
        minHeight: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    event_character_count: {
        position: 'absolute',
        top: -10
    },
    event_text: {
        fontSize: 18,
        fontFamily: 'ProximaNova-Regular',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    add_button: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        position: 'absolute',
        bottom: 20,
        right: 0,
    },
    add_modal: {
        marginTop: '60%',
        marginLeft: 15,
        marginRight: 15,
        height: '40%',
        borderRadius: 15,
        borderWidth: 2
    },
    add_modal_back_button: {
        marginTop: 10,
        marginBottom: 5,
        width: '50%',
        minHeight: 45,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    add_modal_button: {
        minHeight: 45,
        alignItems: 'center',
        justifyContent: 'center'
    },
    add_modal_button_text: {
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular'
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
        height: 100,
        top: 0,
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
        left: 15,
        maxHeight: 45,
        borderRadius: 40,
        borderWidth: 1,
    },
});

export default PlannerScreen;
