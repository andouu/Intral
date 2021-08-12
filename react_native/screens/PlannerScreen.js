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
import { Icon } from 'react-native-elements';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing
} from 'react-native-reanimated';
import SwipeableItem from 'react-native-swipeable-item/src';
import DraggableFlatList from 'react-native-draggable-flatlist';

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
            snapPointsRight={[50, 100, 150]}
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
                    onPress={() => handleMenuOpen(true, {key: item.key, category: sectionData.name, priority: item.data.priority, description: item.data.text})}
                >
                    <Text style={[styles.event_text, {color: theme.s6}]}>{item.data.text}</Text> 
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
        <View style={{width: '100%', marginBottom: 20}}>
            <Text style={[styles.event_text, {color: props.theme.s6, alignSelf: 'flex-start', fontSize: 27.5, marginBottom: 15}]}>{props.data.name}:</Text>
            <View style={{borderLeftWidth: 1.5, borderLeftColor: props.data.color, borderRadius: 11, overflow: 'hidden'}}>
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
                                    category: props.data.name, 
                                    priority: newPriority,
                                    description: item.data.text,
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
                <Text style={[styles.helper_text, {color: props.theme.s6, bottom: 75}]}>No events right now... click the add button to create one!</Text>
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
 * - addNewBtnEnabled = whether to have an add new button
 */
const DropdownMenu = (props) => {                                                           
    const [dropdownZIndex, setDropdownZIndex] = useState(1);

    const defaultStyle = StyleSheet.create({
        container: {
            width: '60%',
            height: '80%', 
            position: 'absolute',
            top: 7, 
            zIndex: dropdownZIndex,
            borderWidth: 1.5,
            borderColor: props.theme.s2,
            borderRadius: 15,
            overflow: 'hidden',
            backgroundColor: props.theme.s1
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
            setTimeout(() => {
                setDropdownZIndex(2);
            }, 200);
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

const AddMenu = ({ categoryData, priorityData, handleAdd, handleChange, menuVisible, closeMenu, theme, editing, editData }) => {
    const [eventToAdd, setEventToAdd] = useState({});
    const [charsLeft, setCharsLeft] = useState(maxEventChars);
    const [openMenus, setOpenMenus] = useState({
        category: false,
        priority: false,
    });
    const menuHeight = useSharedValue(100);
    const animatedMenuStyle = useAnimatedStyle(() => {
        return {
            top: withTiming(menuHeight.value + '%', {duration: 500, easing: Easing.in(bezierAnimCurve)}),
        }
    });

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

    const expandedHeight = 100;
    
    useEffect(() => {
        menuHeight.value = menuVisible ? 0 : expandedHeight;
        if(!menuVisible) {
            setTimeout(() => {
                setEventToAdd({
                    category: categoryData.labels[0],
                    priority: priorityData[0],
                    description: '',
                });
                setCharsLeft(maxEventChars);
            }, 500);
        } else {
            setEventToAdd({
                category: editing ? editData.category : categoryData.labels[0],
                priority: editing ? editData.priority : priorityData[0],
                description: editing ? editData.description : '',
            });  
            setCharsLeft(maxEventChars - eventToAdd.description.length);
        }
    }, [menuVisible]);

    useEffect(() => {
        setEventToAdd({ // only loads after re-render?
            category: editing ? editData.category : categoryData.labels[0],
            priority: editing ? editData.priority : priorityData[0],
            description: editing ? editData.description : '',
        });
    }, []);

    return (
        <Animated.View style={[{width: '100%', height: '100%', position: 'absolute', backgroundColor: theme.s1}, animatedMenuStyle]}>
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
                    Keyboard.dismiss();
                    closeMenu();
                }}
            >
                <MaterialDesignIcons name='close' size={30} color={theme.s4} style={{bottom: 0, right: 0}}/>
            </Pressable>
            <Field 
                theme={theme} 
                containerStyle={{height: '10%'}}
                text='Category:' 
                rightComponent={
                    <DropdownMenu 
                        theme={theme}
                        selectedItem={eventToAdd.category}
                        items={categoryData.labels}
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
                containerStyle={{height: '10%'}}
                text='Priority:'
                // possible change: use text input instead of dropdown menu for priorities
                rightComponent={
                    <DropdownMenu 
                        theme={theme} 
                        selectedItem={eventToAdd.priority}
                        items={priorityData} 
                        style={{width: '30%'}} 
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
                containerStyle={{height: '10%', marginBottom: 0}}
            />
            <View
                style={{
                    width: '100%', 
                    height: '17.5%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 15,
                    borderWidth: 1.5,
                    borderColor: theme.s2,
                    borderRadius: 30,
                    marginBottom: 60,
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
                    style={[styles.event_text, {width: '95%', height: '100%', marginRight: 15,borderRadius: 15, color: theme.s6}]}
                />
                <Text style={{position: 'absolute', right: 8, top: '60%', color: theme.s4}}>{charsLeft}</Text>
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
                        if(editing) {
                            handleChange(
                                editData.category, 
                                editData.key,                                   // key is only used for lookup and should not be changed.
                                {
                                    category: eventToAdd.category, 
                                    priority: eventToAdd.priority,
                                    description: eventToAdd.description,
                                }
                            );
                            Keyboard.dismiss();
                            closeMenu();
                        } else {
                            handleAdd(eventToAdd.category, eventToAdd.priority, eventToAdd.description);
                            Keyboard.dismiss();
                            closeMenu();
                        }
                    } else {
                        Alert.alert('mhmahmawj you can\'t have an empty description');
                    }
                }}
            >
                <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 18, color: theme.s6}}>{editing ? 'Finish' : 'Add'}</Text>
            </Pressable>
        </Animated.View>
    );
}

const PlannerPage = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [isLoading, setIsLoading] = useState(true);
    const [buttonVisible, setButtonVisible] = useState(true);
    const [menuData, setMenuData] = useState({visible: false, isEditing: false, editData: {}});

    const [events, setEvents] = useState([]);
    const [categoryData, setCategoryData] = useState({});
    const [priorityData, setPriorityData] = useState([1, 2, 3]); // TODO: allow user to add or change priority array
    
    const refreshClasses = async () => {
        try {
            let storedClasses = await AsyncStorage.getItem('classes');
            let parsed = await JSON.parse(storedClasses);
            if (Array.isArray(parsed)) {
                let eventSections, categoryTitles = [];
                if (events.length === 0) {
                    eventSections = [];
                    parsed.map((item, index) => { // TODO: refactor to use for loop, no reason to map and create another array
                        let cleanTitle = item.Title.substr(0, item.Title.indexOf('(')).trim();
                        eventSections.push({
                            // TODO: get color from async storage
                            key: getRandomKey(10),
                            color: '',
                            index: index,
                            name: cleanTitle,
                            data: []
                        });
                        categoryTitles.push(cleanTitle);
                    });          
                    categoryTitles.push('Other');      
                } else {
                    eventSections = events.slice();
                    parsed.map((item, index) => {
                        let cleanTitle = item.Title.substr(0, item.Title.indexOf('(')).trim();
                        eventSections[index].name = cleanTitle;
                        categoryTitles.push(cleanTitle);
                    });
                }
                categoryTitles.push('Other');
                await AsyncStorage.setItem('plannerEvents', JSON.stringify(eventSections));
                setCategoryData({
                    ...categoryData,
                    labels: categoryTitles,
                });
                setEvents(eventSections);
                setIsLoading(false);
            }
        } catch(err) {
            console.log(err)
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
            let tmpCategoryLabels = [];
            for(let i = 0; i < parsed.length; i++) {
                tmpCategoryLabels.push(parsed[i].name);
            }
            if(tmpCategoryLabels.find(e => e === 'Other') === -1)
                tmpCategoryLabels.push('Other');  
            setCategoryData({
                ...categoryData, 
                labels: tmpCategoryLabels,
            });
            setIsLoading(false);
        } catch(err) {
            console.log(err);
        }
    }, []);

    const handleAdd = async (category, initData) => {
        function randomHSL() {
            return "hsla(" + ~~(360 * Math.random()) + "," +
                "70%,"+
                "80%,1)"
        }
        try {
            let newEvents = events.slice();
            let randomKey = getRandomKey(10);
            let randomColor = randomHSL();
            let dataArr = newEvents.find(elem => elem.name === category);
            if(dataArr.color === '') {
                dataArr.color = randomColor;
            }
            dataArr.data.push({
                key: randomKey,
                data: {
                    text: initData.description,
                    priority: initData.priority,
                    charsLeft: maxEventChars - initData.description.length,
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
            setEvents(newEvents);                                                       // call setEvents before setting asyncstorage!! await will make the draggable flatlist laggy
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
        } catch(err) {
            console.log(err);
        }
    };

    const handleEventEdit = async (sectionName, key, newData) => {
        try {
            let eventCopy = events.slice();
            let section = eventCopy.find(elem => elem.name === sectionName);
            eventObjIdx = section.data.findIndex(elem => elem.key === key);
            eventObj = section.data[eventObjIdx];
            eventObj.data = {
                ...eventObj.data,
                priority: newData.priority,
                text: newData.description,
            }
            if(newData.category !== sectionName) {
                let newSection = eventCopy.find(elem => elem.name === newData.category).name;
                handleAdd(newSection, {priority: eventObj.data.priority, description: eventObj.data.text});
                section.data.splice(eventObjIdx, 1);
            }
            setEvents(eventCopy);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(events));
        } catch(err) {
            console.log(err);
        }
    }

    const handleMenuOpen = (isEditing=false, editData={}) => {
        setMenuData({visible: buttonVisible, isEditing: isEditing, editData: editData});
        setButtonVisible(!buttonVisible);
    }

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
                    categoryData={categoryData}
                    priorityData={priorityData}
                    handleAdd={(ctgy, prty, desc) => { // category, priority, description
                        handleAdd(ctgy, initData={description: desc, priority: prty});
                    }}
                    handleChange={handleEventEdit}
                    editing={menuData.isEditing}
                    editData={menuData.editData}
                    menuVisible={menuData.visible}
                    closeMenu={handleMenuOpen}
                />
            </View>
            <AddButton 
                theme={theme} 
                buttonVisible={buttonVisible} 
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
        fontFamily: 'Proxima Nova Bold',
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
        right: 15,
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
