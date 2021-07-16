import React from 'react';
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

import { Icon } from 'react-native-elements'

const maxChars = 40;

class PlannerBox extends React.Component { 
    constructor(props) {
        super(props);

        this.state = {
            text: "", 
            charsLeft: maxChars
        };
    }

    render(){
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
                            onChangeText = {
                                text => {
                                    this.setState({
                                        text: text,
                                        charsLeft: maxChars - text.length
                                    })
                                }
                            }
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
                                onPress={() => this.props.handleDelete(this.props.index)}
                            />
                        </TouchableOpacity>
                        <Text style= {styles.planner_charCt}>{this.state.charsLeft}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }
}

class PlannerPage extends React.Component{
    constructor(props) {
        super(props);

        this.handleAdd = this.handleAdd.bind(this);
        this.handleDelete = this.handleDelete.bind(this);

        this.state = {
            events: []
        }
    }

    handleAdd() {
        this.setState((prevState) => {
            let { events } = prevState;
            return {
                events: events.concat({ key: events.length })
            };
        })
    }

    handleDelete(key) {
        this.setState((prevState) => {
            let events = prevState.events.slice();
            events.splice(key, 1);
            return { events: events };
        })
    }

    render() { //TODO: re-write this to use flatlist as flatlist offers better performance when loading many items (suitable for planner)
        let event_boxes = this.state.events.map((data, index) => {
            return (
                <PlannerBox key={index} index={index} text={index.toString()} handleDelete={this.handleDelete}/>       
            );
        });
        let helperText; 
        if (this.state.events.length === 0) {
            helperText = (
                <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 140, height: "100%"}}>
                    <Text style = {{textAlign: 'center', color: 'black', opacity: 0.3}}>
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
                        onPress={this.handleAdd}
                    />
                </View>
            </View>
        );
    }
}

const StackNav = createStackNavigator();

const PlannerStack = () => {
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
        fontFamily: 'Raleway-Medium',
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
        fontFamily: 'Raleway-Medium',
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
});

export default PlannerStack;
