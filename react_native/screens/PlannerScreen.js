import React, { useState, useEffect } from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {
    FlatList,
    ScrollView,
    SectionList,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    Modal,
    Pressable,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-elements';
import { swatch, swatchRGB, toRGBA } from '../components/theme'
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useIsFocused, ThemeProvider } from '@react-navigation/native';
import Accordion from 'react-native-collapsible/Accordion'
import DropDownPicker from 'react-native-dropdown-picker'

const maxChars = 40;

const PlannerBox = ({ sectionIdx, eventIdx, data, handleDelete, handleTextChange }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(data.text === '' ? true : false);

    const [text, setText] = useState(data.text);
    const [charsLeft, setCharsLeft] = useState(data.charsLeft);

    return(
        <View style = {styles.planner_event_container}>
            <Pressable
                style={({pressed}) => [
                    {
                        opacity: pressed || modalVisible
                            ? 0.8
                            : 1
                    },
                    styles.planner_event_box
                ]}
            >
                <Modal
                    animationType='fade'
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(false);
                    }}
                >
                    <View style={styles.planner_event_container}>
                        <View style={styles.planner_event_modal}>
                            <Pressable
                                onPress={() => setModalVisible(false)}
                                style={[
                                    {
                                        backgroundColor: swatch.s6,
                                    },
                                    styles.planner_event_modal_button
                                ]}
                            >
                                <Text style={styles.planner_event_modal_text}>Hide</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setIsEditing(true);
                                    setModalVisible(false);
                                }}
                                style={[
                                    {
                                        backgroundColor: swatch.s4
                                    },
                                    styles.planner_event_modal_button
                                ]}
                            >
                                <Text style={styles.planner_event_modal_text}>Edit</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => handleDelete(sectionIdx, eventIdx)}
                                style={[
                                    {
                                        backgroundColor: swatch.s2
                                    },
                                    styles.planner_event_modal_button
                                ]}
                            >
                                <Text style={styles.planner_event_modal_text}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
                {!modalVisible && !isEditing && <TouchableOpacity style={styles.planner_event_edit_button}>
                    <Icon
                        name='edit'
                        type='feather'
                        size={20}
                        color={swatch.s2}
                        onPress={() => setModalVisible(true)}
                    />
                </TouchableOpacity>}
                {isEditing && <Text style= {styles.planner_event_charCount}>{ charsLeft }</Text>}
                <View style = {styles.planner_text_box}>
                    <TextInput
                        placeholder='Enter Event (e.g. Study for 20 min Today)'
                        placeholderTextColor={toRGBA(swatchDark.s6, 0.5)}
                        textBreakStrategy='highQuality'
                        numberOfLines={2}
                        maxLength={maxChars}
                        multiline={true} 
                        textAlignVertical='center'
                        scrollEnabled={true}
                        value={text}
                        editable={isEditing}
                        onChangeText={text => {
                            if (text.slice(-1) === '\n') {
                                handleTextChange(sectionIdx, eventIdx, text, charsLeft);
                                setIsEditing(false);
                            } else {
                                setText(text);
                                setCharsLeft(maxChars - text.length);
                            }
                        }}
                        onEndEditing={ () => {
                            if (text !== "") {
                                handleTextChange(sectionIdx, eventIdx, text, charsLeft);
                                setIsEditing(false);
                            }
                        }}
                        style={styles.planner_event_text}
                        textAlign='center'
                    />
                </View>
            </Pressable>
        </View>
    )
}

const PlannerPage = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();

    const [events, setEvents] = useState([]);

    const [activeSections, setActiveSections] = useState([]);

    const [dropdownItems, setDropdownItems] = useState([]);
    const [dropdownValue, setDropdownValue] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const refreshClasses = async() => {
        try {
            let storedClasses = await AsyncStorage.getItem('classes');
            let parsed = await JSON.parse(storedClasses);
            if (Array.isArray(parsed)) {
                let eventSections;
                let dropdownData = [];
                if (events.length === 0) {
                    eventSections = [];
                    parsed.map((item, index) => {
                        eventSections.push({
                            name: item.Title,
                            index: index,
                            key: getRandomKey(10),
                            data: []
                        });
                        dropdownData.push({label: item.Title, value: index});
                    });
                } else {
                    eventSections = events.slice();
                    parsed.map((item, index) => {
                        eventSections[index].name = item.Title;
                        dropdownData.push({label: item.Title, value: index})
                    });
                }
                await AsyncStorage.setItem('plannerEvents', JSON.stringify(eventSections));
                setEvents(eventSections);
                setDropdownItems(dropdownData);
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
                let dropdownData = [];
                parsed.map((item, index) => {
                    dropdownData.push({label: item.name, value: index})
                });
                setEvents(parsed);
                setDropdownItems(dropdownData);
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

    return ( 
        <View style = {styles.container}>
            <View style={styles.options_bar}>
                <View style={styles.menu_button}>
                    <MaterialDesignIcons.Button 
                        underlayColor={toRGBA(swatchDark.s4, 0.5)}
                        activeOpacity={0.5}
                        right={2}
                        bottom={4}
                        hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                        borderRadius = {80}
                        name='menu' 
                        color={swatch.s4} 
                        size={35}
                        backgroundColor='transparent'
                        onPress={() => navigation.openDrawer()} 
                        style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                    />
                </View>
            </View>
            {isLoading ? (
                <View style = {styles.planner_loading_container}>
                    <ActivityIndicator size = 'large' color = {swatch.s4} />
                </View>
            ) : (
                checkEventsEmpty() ? (  
                    <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', height: '90%', paddingBottom: 75}}>
                        <Text style={styles.planner_helper_text}>
                            There are no events in your planner right now...{'\n'}
                            Click the button on the bottom right to add one!
                        </Text>
                    </View>
                ) : (
                    <Accordion
                        sections={events}
                        activeSections={activeSections}
                        expandFromBottom={false}
                        containerStyle={styles.planner_accordion_container}
                        renderSectionTitle={(section) =>
                            <View></View> //must have to avoid errors
                        }
                        renderHeader={(section) =>
                            <View style={styles.planner_section_button}>
                                <Text style={styles.planner_section_button_text}>{section.name}</Text>
                            </View>
                        }
                        renderContent={(section) =>
                            <FlatList
                                data={section.data}
                                renderItem={({item, index}) =>
                                    <PlannerBox
                                        key={item.key}
                                        sectionIdx={section.index}
                                        eventIdx={index}
                                        data={item.data}
                                        handleDelete={handleDelete}
                                        handleTextChange={handleTextChange}
                                    />
                                }
                                keyExtractor={item => item.key}
                            />
                        }
                        onChange={setActiveSections}
                        keyExtractor={item => item.key}
                    />
                )
            )}
            {/*<SectionList
                sections={events}
                renderItem={({item, index, section}) =>
                    <PlannerBox 
                        key={item.key}
                        sectionIdx={section.index}
                        eventIdx={index}
                        data={item.data}
                        handleDelete={handleDelete}
                        handleTextChange={handleTextChange}
                    />
                }
                renderSectionHeader={({ section: {name} }) => (
                    <View style={styles.planner_section_button}>
                        <Text style={styles.planner_section_button_text}>{name}</Text>
                    </View>
                )}
            />*/}
            {!isLoading && <View style={styles.planner_add_menu}>
                <View style={styles.planner_add_button}>
                    <Icon
                        name='plus'
                        type='feather'
                        size={35}
                        color={swatch.s7}
                        onPress={() => {
                            handleAdd(dropdownValue);
                            setDropdownValue(null);
                            setDropdownOpen(false);
                        }}
                        disabled={isLoading}
                    />
                </View>
                <DropDownPicker
                    items={dropdownItems}
                    value={dropdownValue}
                    open={dropdownOpen}
                    setItems={setDropdownItems}
                    setValue={setDropdownValue}
                    setOpen={setDropdownOpen}
                    containerStyle={styles.planner_dropdown_picker}
                    textStyle={styles.planner_dropdown_text}
                    placeholder='Select a section'
                    theme='DARK'
                    dropDownDirection='TOP'
                />
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
        backgroundColor: swatch.s1,
    },
    planner_loading_container: {
        flex: 1,
        marginBottom: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: swatch.s1
    },
    planner_accordion_container: {
        marginTop: -15,
        flex: 1,
        width: '100%',
        height: '100%'
    },
    planner_section_button: {
        marginTop: 15,
        backgroundColor: swatch.s3,
        minHeight: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    planner_section_button_text: {
        color: swatch.s6,
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15
    },
    planner_event_container: {
        flex: 1,
        marginBottom: 15
    },
    planner_event_box: {
        width: '100%',
        backgroundColor: swatch.s1,
        borderColor: swatch.s2,
        borderBottomWidth: 3,
        justifyContent: 'center',
        padding: 15
    },
    planner_event_edit_button: {
        width: 25,
        height: 25,
        justifyContent: 'center',
        backgroundColor: 'transparent',
        position: 'absolute',
        right: 8,
    },
    planner_event_modal: {
        marginTop: Dimensions.get('window').height / 3 - 10,
        marginLeft: 15,
        marginRight: 15,
        height: '30%',
        borderRadius: 15,
        backgroundColor: toRGBA(swatchDark.s3, 0.8),
        flexDirection: 'row',
        padding: 5,
    },
    planner_event_modal_button: {
        flex: 1,
        borderRadius: 10,
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    planner_event_modal_text: {
        fontSize: 25,
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'bold',
        color: swatch.s1,
    },
    planner_event_charCount: {
        color: swatch.s4,
        position: 'absolute',
        right: 13
    },
    planner_text_box: {
        backgroundColor: 'transparent',
        minHeight: 30,
        flexDirection: 'column',
        marginLeft: 20,
        marginRight: 20
    },  
    planner_event_text: {
        fontSize: 15,   
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'normal',
        color: swatch.s6,
    },
    planner_add_menu: {
        width: '100%',
        height: 60,
        position: 'absolute',
        bottom: 20,
        justifyContent: 'center'
    },
    planner_add_button: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        backgroundColor: swatch.s5,
        position: 'absolute',
        right: -5,
    },
    planner_dropdown_picker: {
        width: '70%',
        height: 50,
        position: 'absolute',
        left: 20
    },
    planner_dropdown_text: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
        color: swatch.s4,
        textAlign: 'left'
    },
    planner_helper_text: {
        fontFamily: 'ProximaNova-Regular',
        textAlign: 'center',
        color: swatch.s6,
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
        borderColor: toRGBA(swatchDark.s4, 0.5),
    },
});

export default PlannerScreen;
