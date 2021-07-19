import React from 'react';
import {
    Image,
} from 'react-native'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GradebookScreen from './GradebookScreen';
import PlannerScreen from './PlannerScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

const MainStackScreen = () => {
    return (
        <Tab.Navigator initialRouteName>
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

export default MainStackScreen;
