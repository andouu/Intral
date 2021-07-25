import React, { useState, useEffect } from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {
    ScrollView,
    FlatList,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    Button,
    Alert,
    Modal,
    Pressable,
    Touchable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-elements';
import { swatch, swatchRGB, toRGBA } from '../components/theme'
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeProvider } from '@react-navigation/native';
import CollapsibleList from 'react-native-collapsible-list';

const maxChars = 40;

const PlannerBox = ({ index, data, handleDelete, handleTextChange }) => {
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
                    animationType='slide'
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
                                        backgroundColor: swatch['s6'],
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
                                        backgroundColor: swatch['s4']
                                    },
                                    styles.planner_event_modal_button
                                ]}
                            >
                                <Text style={styles.planner_event_modal_text}>Edit</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => handleDelete(index)}
                                style={[
                                    {
                                        backgroundColor: swatch['s2']
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
                        onPress={() => setModalVisible(true)}
                    />
                </TouchableOpacity>}
                {isEditing && <Text style= {styles.planner_event_charCount}>{ charsLeft }</Text>}
                <View style = {styles.planner_text_box}>
                    <TextInput
                        placeholder='Enter Event (e.g. Study for 20 min Today)'
                        placeholderTextColor={toRGBA(swatchRGB.s6, 0.5)}
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
                            handleTextChange(index, text, charsLeft);
                            setIsEditing(false);
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
    const [events, setEvents] = useState([]);

    const handleAdd = async() => {
        try {
            let newList = events.slice();
            let randomKey = getRandomKey(10);
            newList.push({ key: randomKey, data: { text: '', charsLeft: maxChars } });
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newList));
            setEvents(newList);
        } catch(err) {
            console.log(err);
        }
    }

    const handleDelete = async(index) => {
        try {
            let newEvents = events.slice();
            newEvents.splice(index, 1);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newEvents));
            setEvents(newEvents);
        } catch(err) {
            console.log(err);
        }
    }

    const handleTextChange = async(index, newText, newCharsLeft) => {
        try {
            let currEvents = events.slice();
            let edits = currEvents[index];
            edits.data.text = newText;
            edits.data.charsLeft = newCharsLeft;
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(currEvents));
            setEvents(currEvents);
        } catch(err) {
            console.log(err);
        }
    }

    useEffect(async() => {
        try {
            let storedEvents = await AsyncStorage.getItem('plannerEvents');
            let parsed = await JSON.parse(storedEvents);
            if(Array.isArray(parsed)) {
                setEvents(parsed);
            } else {
                await AsyncStorage.setItem('plannerEvents', JSON.stringify([]));
                setEvents([]);
            }
        } catch(err) {
            console.log(err);
        }
    }, []);

    const getRandomKey = (length) => { // only pseudorandom, do not use for any sensitive data
        let result = ''
        let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charlen = characters.length;
        for(let i=0; i<length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charlen));
        }
        return result;
    }
    
    return ( 
        <View style = {styles.container}>
            <View style={styles.optionsBar}>
                <View style={styles.menu_button}>
                    <MaterialDesignIcons.Button 
                        underlayColor={toRGBA(swatchRGB.s4, 0.5)}
                        activeOpacity={0.5}
                        right={2}
                        bottom={4}
                        hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                        borderRadius = {80}
                        name='menu' 
                        color={swatch['s4']} 
                        size={35}
                        backgroundColor='transparent'
                        onPress={() => navigation.openDrawer()} 
                        style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                    />
                </View>
            </View>
            {events.length === 0 &&
                <View style = {{alignItems: 'center', justifyContent: 'center', width: '100%', height: '90%', paddingBottom: 75}}>
                    <Text style = {styles.helper_text}>
                        There are no events in your planner right now...{'\n'}
                        Click the button on the bottom right to add one!
                    </Text>
                </View>}
            {/*
            <ScrollView>
                <CollapsibleList
                    numberOfVisibleItems={0}
                    wrapperStyle={{overflow: 'scroll', borderRadius: 15}}
                    buttonContent={
                        <View>
                            <Text>Class X</Text>
                        </View>
                    }
                >
                    {event_boxes}
                </CollapsibleList>
            </ScrollView>
            */}
            <FlatList
                data={events}
                renderItem={({item, index}) => 
                    <PlannerBox 
                        key={item.key}
                        index={index}
                        data={item.data}
                        handleDelete={handleDelete}
                        handleTextChange={handleTextChange}
                    />}
                keyExtractor={(item) => item.key}
            />
            <View style={styles.planner_add_button}>
                <Icon
                    name='plus'
                    type='feather'
                    size={35}
                    color={swatch['s7']}
                    onPress={handleAdd}
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
        padding: 15 ,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: swatch['s1'],
    },
    planner_event_container: {
        flex: 1,
        minHeight: 80,
        marginBottom: 15
    },
    planner_event_box: {
        width: '100%',
        borderRadius: 15,
        backgroundColor: swatch['s2'],
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
        backgroundColor: toRGBA(swatchRGB.s3, 0.8),
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
        color: swatch['s1'],
    },
    planner_event_charCount: {
        color: swatch['s4'],
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
        color: swatch['s6'],
    },
    planner_add_button: {
        width: 60,
        height: 60,
        borderRadius: 50,
        justifyContent: 'center',
        backgroundColor: swatch['s5'],
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    helper_text: {
        fontFamily: 'ProximaNova-Regular',
        textAlign: 'center',
        color: swatch['s6'],
        opacity: 0.5,
    },  
    optionsBar: {
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
        borderColor: toRGBA(swatchRGB.s4, 0.5),
    },
});

export default PlannerScreen;
