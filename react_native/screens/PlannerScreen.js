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
                        color = '#2D2D2D'
                    />
                    <TouchableOpacity style={styles.planner_delete_button}>
                        <Icon
                            name='x'
                            type='feather'
                            color='#616161'
                            size={15}
                            onPress={() => handleDelete(index)}
                        />
                    </TouchableOpacity>
                    <Text style= {styles.planner_charCt}>{ charsLeft }</Text>
                </View>
            </TouchableOpacity>
        </View>
    )
}

const PlannerPage = (props) => {
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

    let helperText; 
    if (events.length === 0) {
        helperText = (
            <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 140, height: "100%"}}>
                <Text style = {styles.helper_text}>
                    There are no events in your planner right now...{'\n'}
                    Click the button in the bottom right to add one!
                </Text>
            </View>
        );
    }
    return ( 
        <View style = {styles.container}>
            {helperText}
            <ScrollView style = {{paddingTop: 5}}>
                <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center'}}>
                    {event_boxes}
                </View>
            </ScrollView>
            <View style={styles.planner_add_button}>
                <Icon
                    name='plus'
                    type='feather'
                    size={35}
                    color='black'
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
            <StackNav.Screen name = 'Planner' component = {PlannerPage} />
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
    },
    planner_event_box: {
        minHeight: 80,
        backgroundColor: '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        marginBottom: 15,
    },
    planner_add_button: {
        width: 60,
        height: 60,
        borderRadius: 50,
        justifyContent: 'center',
        backgroundColor: '#EAEAEA',
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    planner_add_text: {
        marginTop: 0,
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        color: '#2D2D2D',
        flexWrap: 'wrap'
    },
    planner_text_box: {
        backgroundColor: 'rgba(255,255,255,0)',
        minHeight: 30,
        marginLeft: 15,
        marginRight: 15,
        flexDirection: 'row',
    },  
    planner_event_text: {
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'normal',
        padding: 6,
        marginLeft: 10,
    },
    planner_delete_button: {
        width: 18, 
        height: 18, 
        borderRadius: 9,
        justifyContent: 'center',
        backgroundColor: '#c9c9c9',
        bottom: 5,
        right: -1,
    },
    planner_charCt: {
        position: 'absolute',
        color: '#2e2e2e',
        bottom: -5, 
        right: 0,
    },
    helper_text: {
        fontFamily: 'ProximaNova-Regular',
        textAlign: 'center',
        color: 'black',
        opacity: 0.5,
    },  
});

export default PlannerScreen;
