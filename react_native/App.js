import 'react-native-gesture-handler';
/*import react-native-gesture-handler HAS TO BE the FIRST line */;
import React, {
    useState
} from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Alert, component } from 'react-native';
import GradebookScreen from './screens/GradebookScreen';
import PlannerScreen from './screens/PlannerScreen';
import PersonalScreen from './screens/PersonalScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
    Image,
} from 'react-native';

/*Since we're using bottomTabNavigator, you have to create each screen as a stackNavigator, as a child under the tab navigator*/

const Tab = createBottomTabNavigator();

const navTheme = DefaultTheme;
navTheme.colors.background = '#FFFFFF';

const App = () => {
    return (
        <SafeAreaProvider>
            <NavigationContainer theme = {DefaultTheme}>
                {/* theme = {DarkTheme} */} 
                <Tab.Navigator>
                    <Tab.Screen 
                        name = "Planner" 
                        component = {PlannerScreen} 
                        options = {{
                            tabBarIcon: ({}) => (
                                <Image style = {{height: 30, width: 30 }}  
                                    source = {require('./assets/images/CAS_planner_icon.png')}
                                />
                            ),
                            tabBarLabel: 'Planner'
                        }}
                    />
                    <Tab.Screen 
                        name = "Grades" 
                        component = {GradebookScreen} 
                        options = {{
                            tabBarIcon: ({}) => (
                                <Image style = {{height: 30, width: 30}}  
                                    source = {require('./assets/images/CAS_grade_book_icon.png')}
                                />
                            ),
                            tabBarLabel: 'Grades'
                        }}
                    />
                    <Tab.Screen 
                        name = "Personal" 
                        component = {PersonalScreen} 
                        options = {{
                            tabBarIcon: ({}) => (
                                <Image style = {{height: 30, width: 30}}  
                                    source = {require('./assets/images/CAS_settings_icon.png')}
                                />
                            ),
                            tabBarLabel: 'You'
                        }}
                    /> 
                </Tab.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;