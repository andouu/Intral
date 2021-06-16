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

const maxChars = 40;

class PlannerBox extends React.Component { 
    constructor(props) {
        super(props);

        this.charsLeft = this.charsLeft.bind(this);

        this.state = {
            text: "", 
            charsLeft: maxChars
        };
    }
    
    charsLeft() {
        
    }

    render(){
        return(
            <View>
                <TouchableOpacity style = {styles.planner_event_box}>
                    <View style = {styles.planner_text_box}>
                        <TextInput
                            placeholder = {'Enter Event (e.g. Study APUSH for 20 min Today)'}
                            textBreakStrategy = {'highQuality'}
                            numberOfLines = {2}
                            maxLength = {maxChars}
                            multiline = {true} 
                            textAlignVertical = {'center'}
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
                            textAlign = {'center'}
                            color = {'#2D2D2D'}
                        />
                        <TouchableOpacity style={styles.delete_event_button} onPress={() => this.props.handleDelete(this.props.index)}>
                            {/*replace with image later*/}
                            <View style={styles.circle}>
                                <Text style={{textAlign: 'center', color: '#616161', bottom: 2, right: 0.1}}>x</Text>
                            </View>
                            <Text style= {styles.planner_charCt}>{this.state.charsLeft}</Text>
                        </TouchableOpacity>
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

    render() {
        let event_boxes = this.state.events.map((data, index) => {
            //console.log(this.state.data[index].content + " " + index)
            return (
                <PlannerBox index={index} text={index.toString()} handleDelete={this.handleDelete}/>       
            );
        });

        return (
            <View style = {styles.container}>
                <ScrollView>
                    <View style = {{flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                        {event_boxes}
                        <TouchableOpacity style = {styles.planner_add_button} onPress = {this.handleAdd}>
                        {/*Buttons can't be stylized (not very much at least), so use TouchableOpacities or similar */}
                            <Text style = {styles.planner_add_text}>Add Planner Event</Text>  
                        </TouchableOpacity>                  
                    </View>
                </ScrollView>
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
        height: '100%',
        flex: 1,
    },
    circle: {
        backgroundColor: '#c9c9c9',
        width: 18, 
        height: 18, 
        borderRadius: 18/2,
        marginRight: 10,
    },
    planner_event_box: {
        minHeight: 80,
        width: Dimensions.get('window').width - 80,
        backgroundColor: '#EAEAEA',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 8,
        borderRadius: 10,
    },
    planner_add_button: {
        flex:1,
        height: 50,
        width: Dimensions.get('window').width - 80,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAEAEA',
        fontFamily: 'Raleway-SemiBold',
        margin: 8,
        borderRadius: 10,
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
    delete_event_button: {
        justifyContent: 'center',
        color: '#2D2D2D',
    },
    planner_charCt: {
        position: 'absolute',
        bottom: -5, 
        color: '#2e2e2e',
        left: 1,
    },
    
});

export default PlannerStack;
