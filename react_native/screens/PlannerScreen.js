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
    Modal,
    Pressable,
    ActivityIndicator,
    UIManager,
    LayoutAnimation,
    LogBox
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-elements';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
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

const maxEventChars = 80;

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

const AddMenu = ({ addButtonXOffset, events, handleAdd, isLoading, theme }) => {
    const addButtonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateX: withTiming(addButtonXOffset.value, {
                duration: 300,
                easing: Easing.in(Easing.exp)
            })}]
        };
    });

    const [addModalVisible, setAddModalVisible] = useState(false);

    const closeModal = () => {
        setAddModalVisible(false);
        addButtonXOffset.value = 0;
    };

    return (
        <View style={{position: 'absolute', bottom: 0, right: 0, width: '100%', height: '100%'}}>
            <Modal
                animationType='fade'
                transparent={true}
                visible={addModalVisible}
                onRequestClose={closeModal}
            >
                <View style={[styles.add_modal, {borderColor: theme.s4, backgroundColor: theme.s13}]}>
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => 
                            <Pressable
                                style={[styles.add_modal_back_button, {backgroundColor: theme.s9}]}
                                onPress={closeModal}
                            >
                                <Text style={[styles.add_modal_button_text, {color: theme.s3}]}>Back</Text>
                            </Pressable>
                        }
                        ListHeaderComponentStyle={{alignItems: 'center'}}
                        ItemSeparatorComponent={() => 
                            <View style={{marginLeft: 15, marginRight: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.s2}} />
                        }
                        data={events}
                        renderItem={({item, index}) =>
                            <Pressable
                                style={({pressed}) => [styles.add_modal_button, {opacity: pressed ? 0.6 : 1}]}
                                onPress={() => {
                                    setAddModalVisible(false);
                                    handleAdd(index);
                                }}
                            >
                                <Text style={[styles.add_modal_button_text, {color: theme.s4}]}>{item.name}</Text>
                            </Pressable>
                        }
                        keyExtractor={item => item.key}
                    />
                </View>
            </Modal>
            {!isLoading && <Animated.View style={[styles.add_button, addButtonAnimatedStyle, {backgroundColor: theme.s5}]}>
                <Icon
                    name='plus'
                    type='feather'
                    size={35}
                    color={theme.s7}
                    onPress={() => {
                        addButtonXOffset.value = 100;
                        setAddModalVisible(true);
                    }}
                    disabled={isLoading}
                />
            </Animated.View>}
        </View>
    );
}

const PlannerPage = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();

    const addButtonXOffset = useSharedValue(0);

    const [events, setEvents] = useState([]);
    
    const refreshClasses = async () => {
        try {
            let storedClasses = await AsyncStorage.getItem('classes');
            let parsed = await JSON.parse(storedClasses);
            if (Array.isArray(parsed)) {
                let eventSections;
                if (events.length === 0) {
                    eventSections = [];
                    parsed.map((item, index) => {
                        eventSections.push({
                            key: getRandomKey(10),
                            index: index,
                            name: item.Title,
                            data: []
                        });
                    });
                } else {
                    eventSections = events.slice();
                    parsed.map((item, index) => {
                        eventSections[index].name = item.Title;
                    });
                }
                await AsyncStorage.setItem('plannerEvents', JSON.stringify(eventSections));
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
        } catch(err) {
            console.log(err);
        }
    }, []);

    const handleAdd = async(sectionIdx) => {
        try {
            let newEvents = events.slice();
            let randomKey = getRandomKey(10);
            newEvents[sectionIdx].data.push({
                key: randomKey,
                data: {
                    text: '',
                    charsLeft: maxEventChars
                }
            });
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            LayoutAnimation.configureNext(LayoutAnimation.create(300, 'easeInEaseOut', 'scaleY'));
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    };

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
            <EventList
                isLoading={isLoading}
                sortedEvents={events}
                handleDelete={handleDelete}
                handleTextChange={handleTextChange}
                handleUpdateSection={handleUpdateSection}
                resetAddButton={() => { addButtonXOffset.value = 0; }}
                theme={theme}
            />
            <AddMenu
                addButtonXOffset={addButtonXOffset}
                events={events}
                handleAdd={handleAdd}
                isLoading={isLoading}
                theme={theme}
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
        padding: 15 ,
        paddingTop: 0,
        paddingBottom: 0,
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
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'normal',
        textAlign: 'center'
    },
    add_button: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        position: 'absolute',
        bottom: 20,
        right: 20,
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
        maxHeight: 45,
        borderRadius: 40,
        borderWidth: 1,
    },
});

export default PlannerScreen;
