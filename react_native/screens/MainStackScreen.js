import React from 'react';
import {
    Image,
    View,
} from 'react-native'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GradebookScreen from './GradebookScreen';
import PlannerScreen from './PlannerScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

const MainStackScreen = () => {
    return (
        <Tab.Navigator initialRouteName='Personal' tabBar={props => <TabBar {...props} />}>
            <Tab.Screen 
                name = "Personal" 
                component = { ProfileScreen } 
                options = {{
                    tabBarIcon: ({}) => (
                        <Image style = {{height: 30, width: 30}}  
                            source = { require('../assets/images/CAS_settings_icon.png') }
                        />
                    ),
                    tabBarLabel: 'You'
                }}
            />
            <Tab.Screen 
                name = "Grades" 
                component = { GradebookScreen } 
                options = {{
                    tabBarIcon: ({}) => (
                        <Image style = {{height: 30, width: 30}}  
                            source = { require('../assets/images/CAS_grade_book_icon.png') }
                        />
                    ),
                    tabBarLabel: 'Grades'
                }}
            />
            <Tab.Screen 
                name = "Planner" 
                component = { PlannerScreen } 
                options = {{
                    tabBarIcon: ({}) => (
                        <Image style = {{height: 30, width: 30 }}  
                            source = { require('../assets/images/CAS_planner_icon.png') }
                        />
                    ),
                    tabBarLabel: 'Planner'
                }}
            /> 
        </Tab.Navigator> 
    )
}

const TabBar = () => {

    return (
        <View style={{width: '100%', height: 70, backgroundColor: 'blue'}}></View>
    );
}

export default MainStackScreen;
