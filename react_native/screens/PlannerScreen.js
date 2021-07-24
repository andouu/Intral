import React, { useState, useEffect } from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    Button,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-elements';
import { swatch, swatchRGB } from '../components/theme'
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'

const maxChars = 40;

const PlannerBox = ({ index, data, handleDelete, handleTextChange }) => {
    const [text, setText] = useState(data.text);
    const [charsLeft, setCharsLeft] = useState(data.charsLeft);

    return(
        <View style = {{flex: 1, alignItems: 'center'}}>
            <TouchableOpacity style = {styles.planner_event_box}>
                <View style = {styles.planner_text_box}>
                    <TextInput
                        placeholder = 'Enter Event (e.g. Study for 20 min Today)'
                        placeholderTextColor={`rgba(${swatchRGB.s6.r}, ${swatchRGB.s6.g}, ${swatchRGB.s6.b}, 0.5)`}
                        textBreakStrategy = 'highQuality'
                        numberOfLines = {2}
                        maxLength = {maxChars}
                        multiline = {true} 
                        textAlignVertical = 'center'
                        scrollEnabled = {true}
                        value = {text}
                        onChangeText = { text => {
                                setText(text);
                                setCharsLeft(maxChars - text.length);
                            } 
                        }
                        onEndEditing = { () => handleTextChange(index, text, charsLeft) }
                        style = {styles.planner_event_text}
                        textAlign = 'center'
                    />
                    <TouchableOpacity style={styles.planner_delete_button}>
                        <Icon
                            name='x'
                            type='feather'
                            color='red'
                            size={20}
                            onPress={() => handleDelete(index)}
                        />
                    </TouchableOpacity>
                    <Text style= {styles.planner_charCt}>{ charsLeft }</Text>
                </View>
            </TouchableOpacity>
        </View>
    )
}

const PlannerPage = ({ navigation }) => {
    const [events, setEvents] = useState([]);

    const handleAdd = async() => {
        try {
            let newList = events.slice();
            let randomKey = getRandom(10);
            newList.push({ key: randomKey, data: { text: '', charsLeft: maxChars } });
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(newList));
            setEvents(newList);
        } catch(err) {
            console.log(err);
        }
    }

    const handleDelete = async(key) => {
        try {
            let prevEvents = events.slice();
            prevEvents.splice(key, 1);
            await AsyncStorage.setItem('plannerEvents', JSON.stringify(prevEvents));
            setEvents(prevEvents);
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

    const getRandom = (length) => { // only pseudorandom, do not use for any sensitive data
        let result = ''
        let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let charlen = characters.length;
        for(let i=0; i<length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charlen));
        }
        return result;
    }

    let event_boxes = events.map((event, index) => { //TODO: re-write this to use flatlist as flatlist offers better performance when loading many items (suitable for planner)
        return (
            <PlannerBox key = {event.key} index = {index} data = {event.data} handleDelete = {handleDelete} handleTextChange = {handleTextChange} />       
        );
    });

    let helperText = null; 
    if (events.length === 0) {
        helperText = (
            <View style = {{alignItems: 'center', justifyContent: 'center', width: '100%', height: '90%', paddingBottom: 75}}>
                <Text style = {styles.helper_text}>
                    There are no events in your planner right now...{'\n'}
                    Click the button in the bottom right to add one!
                </Text>
            </View>
        );
    }
    return ( 
        <View style = {styles.container}>
            <View style={styles.optionsBar}>
                <View style={styles.menu_button}>
                    <MaterialDesignIcons.Button 
                        underlayColor={`rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`}
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
            {helperText}
            <ScrollView style={{flex: 1}} contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}}>
                <View style = {{flex: 1, flexDirection: 'column', alignSelf: 'stretch', justifyContent: 'center'}}>
                    {event_boxes}
                </View>        
            </ScrollView>
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
        flex: 1,
        height: '100%',
        width: "100%",
        padding: 15,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: swatch['s1'],
    },
    planner_event_box: {
        minHeight: 80,
        width: '100%',
        backgroundColor: swatch['s2'],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        marginBottom: 15,
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
    planner_add_text: {
        marginTop: 0,
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        color: swatch['s6'],
        flexWrap: 'wrap'
    },
    planner_text_box: {
        backgroundColor: 'transparent',
        minHeight: 30,
        marginLeft: 15,
        marginRight: 15,
        flexDirection: 'row',
    },  
    planner_event_text: {
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'normal',
        color: swatch['s6'],
        padding: 6,
        marginLeft: 10,
    },
    planner_delete_button: {
        width: 18, 
        height: 18, 
        borderRadius: 9,
        justifyContent: 'center',
        backgroundColor: 'transparent',
        bottom: 5,
        right: -17,
    },
    planner_charCt: {
        position: 'absolute',
        color: swatch['s4'],
        bottom: -5, 
        right: -15,
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
        borderColor: `rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`,
    },
});

export default PlannerScreen;
