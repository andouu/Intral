import React from 'react';
import {
    StyleSheet,
} from 'react-native';
import PlannerScreen from './PlannerScreen';
import CalendarScreen from './CalendarScreen';
import { swatchDark } from '../components/themes';
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

const RemindersDrawer = ({ navigation }) => {

    return (
        <Drawer.Navigator 
            initialRouteName='Planner'
            drawerContentOptions={{
                style: styles.drawerMain,
            }}
        >
            <Drawer.Screen name='Planner' component={PlannerScreen} />
            <Drawer.Screen name='Calendar' component={CalendarScreen} options={{}} />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    drawerMain: {
        backgroundColor: swatchDark.s1,
    }
});


export default RemindersDrawer