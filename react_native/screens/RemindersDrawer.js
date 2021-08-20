import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet,
    View
} from 'react-native';
import { ThemeContext } from '../components/themeContext';
import Animated, {Easing} from 'react-native-reanimated';
import { Icon } from 'react-native-elements';
import PlannerScreen from './PlannerScreen';
import CalendarScreen from './CalendarScreen';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const DrawerScreens = ({ navigation, route, style }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const switchScreenConfig = {
        animation: 'timing',
        config: {
            duration: 200,
            easing: Easing.in(Easing.poly(2)),
        },
    };

    const routeName = getFocusedRouteNameFromRoute(route);
    useEffect(() => {
        if(routeName === 'Calendar')    // https://stackoverflow.com/questions/51352081/react-navigation-how-to-hide-tabbar-from-inside-stack-navigation
            navigation.dangerouslyGetParent().setOptions({ tabBarVisible: false });
        else
            navigation.dangerouslyGetParent().setOptions({ tabBarVisible: true });
    }, [routeName])
    return (
        <Animated.View style={[styles.stack, style, {borderColor: theme.s3}]}>
            <Stack.Navigator
                initialRouteName='Planner'
                screenOptions={{
                    headerTransparent: true,
                    headerTitle: null,
                    headerLeft: null
                }}
            >
                <Stack.Screen
                    name='Planner'
                    options={{
                        transitionSpec: {
                            open: switchScreenConfig,
                            close: switchScreenConfig,
                        },
                    }}
                >
                    {props => <PlannerScreen {...props} />}
                </Stack.Screen>
                <Stack.Screen
                    name='Calendar'
                    options={{
                        transitionSpec: {
                            open: switchScreenConfig,
                            close: switchScreenConfig,
                        },
                    }}
                >
                    {props => <CalendarScreen {...props} />}
                </Stack.Screen>
            </Stack.Navigator>
        </Animated.View>
    );
}

const DrawerContent = ({ setProgress, ...props }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [focused, setFocused] = useState('Planner');

    useEffect(() => {
        setProgress(props.progress);
    }, [props.progress]);

    return (
        <DrawerContentScrollView {...props} style={{padding: 0}}>
            <DrawerItem
                label='Planner'
                style={styles.button}
                labelStyle={styles.button_text}
                icon={({ focused, color, size }) =>
                    <Icon
                        color={color}
                        size={size}
                        name={focused ? 'book-open' : 'book'}
                        type='feather'
                    />
                }
                inactiveTintColor={theme.s4}
                activeBackgroundColor={theme.s2}
                activeTintColor={theme.s3}
                focused={focused === 'Planner'}
                onPress={() => {setFocused('Planner'); props.navigation.navigate('Planner');}}
            />
            <DrawerItem
                label='Calendar'
                style={styles.button}
                labelStyle={styles.button_text}
                icon={({ focused, color, size }) =>
                    <Icon
                        color={color}
                        size={size}
                        name='calendar'
                        type='feather'
                    />
                }
                inactiveTintColor={theme.s4}
                activeBackgroundColor={theme.s2}
                activeTintColor={theme.s3}
                focused={focused === 'Calendar'}
                onPress={() => {setFocused('Calendar'); props.navigation.navigate('Calendar');}}
            />
            <View style={[styles.back_button_separator, {borderColor: theme.s13}]} />
            <DrawerItem
                label='Back'
                onPress={props.navigation.closeDrawer}
                inactiveTintColor={theme.s8}
                inactiveBackgroundColor={theme.s9}
                style={[styles.back_button, {borderColor: theme.s3}]}
                labelStyle={[styles.button_text, {left: '50%'}]}
            />
        </DrawerContentScrollView>
    );
}

const RemindersDrawer = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const [progress, setProgress] = useState(new Animated.Value(0));
    const scale = Animated.interpolateNode(progress, {
        inputRange: [0, 1],
        outputRange: [1, 0.85]
    });
    const borderRadius = Animated.interpolateNode(progress, {
        inputRange: [0, 1],
        outputRange: [0, 20]
    });
    const borderWidth = Animated.interpolateNode(progress, {
        inputRange: [0, 1],
        outputRange: [0, 3]
    });

    const screensAnimatedStyle = { borderRadius, borderWidth, transform: [{ scale }] };

    return (
        <Drawer.Navigator 
            initialRouteName='Planner'
            drawerType='slide'
            overlayColor='transparent'
            drawerStyle={styles.drawer_container}
            drawerContent={props => <DrawerContent {...props} setProgress={setProgress} />}
        >
            <Drawer.Screen name='DrawerScreens'>
                {props => <DrawerScreens {...props} style={screensAnimatedStyle} />}
            </Drawer.Screen>
            {/* <Drawer.Screen name='Planner' component={PlannerScreen} />
            <Drawer.Screen name='Calendar' component={CalendarScreen} /> */}
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    drawer_container: {
        width: '50%',
        backgroundColor: 'transparent'
    },
    stack: {
        flex: 1,
        overflow: 'hidden'
    },
    button: {
        borderRadius: 15,
        marginBottom: 5
    },
    button_text: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 14
    },
    back_button_separator: {
        borderBottomWidth: 1,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
        marginTop: 30
    },
    back_button: {
        borderRadius: 25,
        borderWidth: 1
    }
});


export default RemindersDrawer;