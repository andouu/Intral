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
} from 'react-native';

const PlannerBox = () => { 
    const [value, onChangeText] = React.useState('');
    return(
        <View>
            <TouchableOpacity style = {styles.planner_event_box}>
                <View style = {styles.planner_text_box}>
                    <TextInput
                        placeholder = {'Enter Event (e.g. Study APUSH for 20 min Today)'}
                        textBreakStrategy = {'highQuality'}
                        numberOfLines = {2}
                        maxLength = {40}
                        multiline = {true} 
                        textAlignVertical = {'center'}
                        scrollEnabled = {true}
                        ontextChange = {text => onChangeText({text})}
                        textInput = {value}
                        style = {styles.planner_event_text}
                        textAlign = {'center'}
                        color = {'#2D2D2D'}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
}

class PlannerPage extends React.Component{
    constructor(props) {
        super(props);

        this.handleAdd = this.handleAdd.bind(this);

        this.state = {
            data: []
        }
    }

    handleAdd() {
        let newData = {content: 'secs'};

        this.setState({
            data: [...this.state.data, newData]
        });
    }

    render() {
        let added_boxes = this.state.data.map((data, index) => {
            return (
                <PlannerBox key = {index} passed_data = {data} />
            );
        });

        return (
            <View style = {styles.container}>
                <ScrollView contentContainerStyle = {{paddingBottom: 50, marginTop: 20}}>
                    <View style = {{flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                        {added_boxes} 
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
        height: "100%",
        flex: 1,
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
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAEAEA',
        fontFamily: 'Raleway-SemiBold',
        margin: 8,
        borderRadius: 10,
    },
    planner_add_text: {
        fontSize: 15,
        fontFamily: 'Raleway-Medium',
        color: '#2D2D2D'
    },
    planner_text_box: {
        backgroundColor: 'rgba(255,255,255,0)',
        minHeight: 30,
        marginLeft: 15,
        marginRight: 15,
    },  
    planner_event_text: {
        fontSize: 15,
        fontFamily: 'Raleway-Medium',
    },
});

export default PlannerStack;
