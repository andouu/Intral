import 'react-native-gesture-handler';
{/*import react-native-gesture-handler HAS TO BE the FIRST line */};
import React, {
    useState
} from 'react';
import {NavigationContainer, DefaultTheme} from "@react-navigation/native";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {createStackNavigator} from '@react-navigation/stack';
import {Alert, component} from 'react-native';

import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TouchableHighlight,
    TouchableOpacity,
    Image,
    Dimensions,
    Button,
    TextInput,
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

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

class GradeBookPage extends React.Component{
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <View style = {styles.container}>
                <ScrollView style = {styles.grade_container} contentContainerStyle = {{paddingBottom: 10, marginTop: -20}}>
                    {/*<Text style = {{fontSize: 35, fontFamily: "Raleway-Bold", height: 70}}>Grades:</Text>  <-- Optional since Stack.Screen will 
                    create name for the page automatically (name is required, not optional)*/}  
                    <View style = {{flexDirection: "column", justifyContent: "space-around", flex: 1}}>
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>A</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>Period 1: Boness</Text>
                        </TouchableOpacity>                   
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>B</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>Period 2: Kim</Text>
                        </TouchableOpacity>                   
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>C</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>eeeeee eeeeeee e e eeeeeee e eeeee eeeeeeee</Text>
                        </TouchableOpacity>                   
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>D</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>Period 4: Mr. Benneteeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeet</Text>
                        </TouchableOpacity>    
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>F</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>Period 5: AP US History</Text>
                        </TouchableOpacity>   
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>F</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>Period 6: Gopal</Text>
                        </TouchableOpacity>   
                        <TouchableOpacity style = {styles.grade_display}>
                            <Text style = {styles.grade_letter}>F</Text>
                            <View style = {styles.vertical_line}></View>
                            <Text style = {styles.grade_info}>Period 7: Also Gopal</Text>
                        </TouchableOpacity>                  
                    </View>
                </ScrollView>
            </View>
        );
    } 
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

class SettingsPage extends React.Component {
    render() {
        return(
            <View style = {{flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <Text>Settings!</Text>
            </View>
        );
    }
}

const StackNav = createStackNavigator();

function GradeBookStack(){
    return (
        <StackNav.Navigator>
            <StackNav.Screen name = 'Grades' component = {GradeBookPage} />
        </StackNav.Navigator>
    );
}

function PlannerStack(){
    return(
        <StackNav.Navigator>
            <StackNav.Screen name = 'Planner' component = {PlannerPage} />
        </StackNav.Navigator> 
    );
}

function SettingsStack() {
    return (
        <StackNav.Navigator>
            <StackNav.Screen name = 'Settings' component = {SettingsPage} />
        </StackNav.Navigator>
    );
}

{/*Since we're using bottomTabNavigator, you have to create each screen as a stackNavigator, as a child under the tab navigator*/}

const Tab = createBottomTabNavigator();

const navTheme = DefaultTheme;
navTheme.colors.background = '#FFFFFF';

const App = () => {
    return (
        <NavigationContainer theme = {navTheme}>
            <Tab.Navigator>
                <Tab.Screen 
                    name = "Planner" 
                    component = {PlannerStack} 
                    options = {{
                        tabBarIcon: ({}) => (
                            <Image style = {styles.bottomTabIcon, {height: 30, width: 30}}  
                            source = {require('./assets/images/CAS_planner_icon.png')
                            }/>
                        ),
                        tabBarLabel: 'Planner'
                    }}
                />
                <Tab.Screen 
                    name = "Grades" 
                    component = {GradeBookStack} 
                    options = {{
                        tabBarIcon: ({}) => (
                            <Image style = {styles.bottomTabIcon, {height: 30, width: 30}}  
                            source = {require('./assets/images/CAS_grade_book_icon.png')
                            }/>
                        ),
                        tabBarLabel: 'Grades'
                    }}
                />
                <Tab.Screen 
                    name = "Settings" 
                    component = {SettingsStack} 
                    options = {{
                        tabBarIcon: ({}) => (
                            <Image style = {styles.bottomTabIcon, {height: 30, width: 30}}  
                            source = {require('./assets/images/CAS_settings_icon.png')
                            }/>
                        ),
                        tabBarLabel: 'Settings'
                    }}
                /> 
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        height: "100%",
        flex: 1,
    },
    grade_container: {
        height: "100%",
        padding: 28,
        flex: 9,
    },
    grade_display: {
        margin: "5%",
        backgroundColor: "rgba(255,255,255,0)",
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    grade_letter: {
        marginRight: "15%",
        fontSize: 50,
        fontFamily: "Raleway-SemiBold",
    },
    vertical_line: {
        height: "100%",
        width: 1.5,
        backgroundColor: "rgba(0,0,0,1)",
        marginLeft: 80,
        position: "absolute"
    },
    grade_info: {
        marginLeft: "15%",
        fontFamily: 'Raleway-MediumItalic',
        fontSize: 15,
        flexWrap: "wrap",
        flexShrink: 1,
        alignItems: "flex-start",
        position: "absolute",
        marginLeft: 120
    },
    nav_bar: {
        flexDirection: "column",
        alignItems: "center",
        flex: 0.12,
    },
    horizontal_line: {
        height: 1.5,
        width: "90%",
        backgroundColor: "rgba(0,0,0,1)",
        marginLeft: 80,
        position: "absolute"
    },
    nav_bar_button_space: {
        flexDirection: "row"
    },
    nav_bar_buttons: {
        marginTop: 8,
        marginLeft: 30,
        marginRight: 30,
        width: 55,
        height: 55,
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

export default App;