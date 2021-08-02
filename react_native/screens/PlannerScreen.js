import React, { useState, useEffect, useContext } from 'react';
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
    Modal,
    Pressable,
    ActivityIndicator,
    LogBox
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-elements';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused, ThemeProvider } from '@react-navigation/native';
import Accordion from 'react-native-collapsible/Accordion';
import Animated from 'react-native-reanimated';
import SwipeableItem from 'react-native-swipeable-item/src';

const maxChars = 40;

const PlannerBox = ({ sectionIdx, eventIdx, data, handleDelete, handleTextChange, theme }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(data.text === '' ? true : false);

    const [text, setText] = useState(data.text);
    const [charsLeft, setCharsLeft] = useState(data.charsLeft);

    const renderUnderlayLeft = ({item, percentOpen, open, close}) => (
        <Animated.View style={[styles.event_edit_underlay, {opacity: percentOpen, backgroundColor: theme.s5}]}>
            <TouchableOpacity style={{right: 16}}>
                <Icon
                    name='edit'
                    type='feather'
                    size={35}
                    color={theme.s2}
                    onPress={() => setModalVisible(true)}
                    onPressOut={close}
                />
            </TouchableOpacity>
        </Animated.View>
    );

    return(
        <SwipeableItem
            renderUnderlayLeft={renderUnderlayLeft}
            snapPointsLeft={[70]}
        >
            <View style = {styles.event_container}>
                <View style={[styles.event_box, {backgroundColor: theme.s1, borderColor: theme.s2}]}>
                    <Modal
                        animationType='fade'
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => {
                            setModalVisible(false);
                        }}
                    >
                        <View style={styles.event_container}>
                            <View style={[styles.event_modal, {backgroundColor: theme.s2}]}>
                                <Pressable
                                    onPress={() => setModalVisible(false)}
                                    style={[{backgroundColor: theme.s6}, styles.event_modal_button]}
                                >
                                    <Text style={[styles.event_modal_text, {color: theme.s1}]}>Hide</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setIsEditing(true);
                                        setModalVisible(false);
                                    }}
                                    style={[{backgroundColor: theme.s4}, styles.event_modal_button]}
                                >
                                    <Text style={[styles.event_modal_text, {color: theme.s1}]}>Edit</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleDelete(sectionIdx, eventIdx)}
                                    style={[{backgroundColor: theme.s2}, styles.event_modal_button]}
                                >
                                    <Text style={[styles.event_modal_text, {color: theme.s1}]}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>
                    {isEditing && <Text style={[styles.event_charCount, {color: theme.s4,}]}>{ charsLeft }</Text>}
                    <View style = {styles.text_box}>
                        <TextInput
                            placeholder='Enter Event (e.g. Study for 20 min Today)'
                            placeholderTextColor={toRGBA(theme.s6, 0.5)}
                            textBreakStrategy='highQuality'
                            numberOfLines={2}
                            maxLength={maxChars}
                            multiline={true} 
                            textAlignVertical='center'
                            scrollEnabled={true}
                            value={text}
                            editable={isEditing}
                            onChangeText={text => {
                                setText(text);
                                setCharsLeft(maxChars - text.length);
                            }}
                            onEndEditing={ () => {
                                if (text !== "") {
                                    handleTextChange(sectionIdx, eventIdx, text, charsLeft);
                                    setIsEditing(false);
                                }
                            }}
                            style={[styles.event_text, {color: theme.s6}]}
                            textAlign='center'
                        />
                    </View>
                </View>
            </View>
        </SwipeableItem>
    )
}

const PlannerPage = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    useEffect(() => {
        LogBox.ignoreLogs(['VirtualizedLists should never be nested'])
    }, []);

    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();

    const [events, setEvents] = useState([]);
    const [activeSections, setActiveSections] = useState([]);

    const [addModalVisible, setAddModalVisible] = useState(false);
    
    const refreshClasses = async() => {
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

    useEffect(async() => {
        if (isFocused) {
            await refreshClasses();
        }
    }, [isFocused]);


    useEffect(async() => {
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
            newEvents[sectionIdx].data.push({ key: randomKey, data: { text: '', charsLeft: maxChars } });
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            setEvents(newEvents);

            let newKey = newEvents[sectionIdx].key;
            let newKeyIsUnique = true;
            for (let i = 0; i < activeSections.length; i ++) {
                if (activeSections[i] === newKey) {
                    newKeyIsUnique = false;
                }
            }
            if (newKeyIsUnique) {
                setActiveSections([...activeSections, newKey]);
            }
        } catch(err) {
            console.log(err);
        }
    };

    const handleDelete = async(sectionIdx, eventIdx) => {
        try {
            let newEvents = events.slice();
            newEvents[sectionIdx].data.splice(eventIdx, 1);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            setEvents(newEvents);

            if (newEvents[sectionIdx].data.length === 0)
            {
                let newActiveSections = activeSections.slice();
                newActiveSections.splice(newActiveSections.indexOf(newEvents[sectionIdx].key), 1);
                setActiveSections(newActiveSections);
            }
        } catch(err) {
            console.log(err);
        }
    };

    const handleTextChange = async(sectionIdx, eventIdx, newText, newCharsLeft) => {
        try {
            let currEvents = events.slice();
            let edits = currEvents[sectionIdx].data[eventIdx];
            edits.data.text = newText;
            edits.data.charsLeft = newCharsLeft;
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(currEvents));
            setEvents(currEvents);
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

    const checkEventsEmpty = () => {
        for (let i = 0; i < events.length; i ++) {
            if (events[i].data.length !== 0) {
                return false;
            }
        }
        return true;
    };

    const accordionSection = (section) =>
        <FlatList
            scrollEnabled={false}
            data={section.data}
            renderItem={({item, index}) =>
                <PlannerBox
                    key={item.key}
                    sectionIdx={section.index}
                    eventIdx={index}
                    data={item.data}
                    handleDelete={handleDelete}
                    handleTextChange={handleTextChange}
                    theme={theme}
                />
            }
            keyExtractor={item => item.key}
        />;

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
            {isLoading ? (
                <View style = {[styles.loading_container, {backgroundColor: theme.s1}]}>
                    <ActivityIndicator size = 'large' color = {theme.s4} />
                </View>
            ) : (
                checkEventsEmpty() ? (  
                    <View style={styles.helper_container}>
                        <Text style={[styles.helper_text, {color: theme.s6}]}>
                            There are no events in your planner right now...{'\n'}
                            Click the button on the bottom right to add one!
                        </Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Accordion
                            sections={events}
                            activeSections={activeSections}
                            expandFromBottom={false}
                            expandMultiple={true}
                            containerStyle={styles.accordion_container}
                            //NOTE: THE BEST WAY is: renderAsFlatList={true} and no ScrollView, but it did not render my planner boxes correctly. TODO: fix this and implement renderAsFlatlist={true}
                            renderSectionTitle={(section) =>
                                <View></View> //must have to avoid errors
                            }
                            renderHeader={(section) =>
                                <View style={[styles.section_button, {backgroundColor: theme.s3}]}>
                                    <Text style={[styles.section_button_text, {color: theme.s6}]}>{section.name}</Text>
                                </View>
                            }
                            renderContent={accordionSection}
                            onChange={(activeSections) => {
                                //only activates sections that have events stored inside to avoid bugs
                                setActiveSections(activeSections.filter(section => events.find(event => event.key === section).data.length !== 0));
                            }}
                            keyExtractor={item => item.key}
                        />
                    </ScrollView>
                )
            )}
            <Modal
                animationType='fade'
                transparent={true}
                visible={addModalVisible}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={[styles.add_modal, {borderColor: theme.s4, backgroundColor: theme.s13}]}>
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => 
                            <Pressable
                                style={[styles.add_modal_back_button, {backgroundColor: theme.s9}]}
                                onPress={() => setAddModalVisible(false)}
                            >
                                <Text style={[styles.add_modal_button_text, {color: theme.s3}]}>Back</Text>
                            </Pressable>
                        }
                        ListHeaderComponentStyle={{alignItems: 'center'}}
                        ItemSeparatorComponent={() => 
                            <View style={{borderBottomWidth: 3, borderColor: theme.s2}}></View>
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
            {!isLoading && <View style={styles.add_menu}>
                <View style={[styles.add_button, {backgroundColor: theme.s5}]}>
                    <Icon
                        name='plus'
                        type='feather'
                        size={35}
                        color={theme.s7}
                        onPress={() => setAddModalVisible(true)}
                        disabled={isLoading}
                    />
                </View>
            </View>}
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
    accordion_container: {
        marginTop: -15,
        marginBottom: 90,
        flex: 1,
        width: '100%',
        height: '100%'
    },
    section_button: {
        marginTop: 15,
        minHeight: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    section_button_text: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15
    },
    event_edit_underlay: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    event_container: {
        flex: 1
    },
    event_box: {
        width: '100%',
        borderBottomWidth: 3,
        justifyContent: 'center',
        padding: 25
    },
    event_modal: {
        marginTop: Dimensions.get('window').height / 3 - 10,
        marginLeft: 15,
        marginRight: 15,
        height: '30%',
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
    event_charCount: {
        position: 'absolute',
        right: 13
    },
    text_box: {
        backgroundColor: 'transparent',
        minHeight: 30,
        flexDirection: 'column',
        marginLeft: 20,
        marginRight: 20
    },  
    event_text: {
        fontSize: 15,   
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'normal',
    },
    add_menu: {
        width: '100%',
        height: 60,
        position: 'absolute',
        bottom: 20,
        justifyContent: 'center'
    },
    add_button: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        position: 'absolute',
        right: -5,
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
