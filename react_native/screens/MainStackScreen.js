import React, { useContext } from 'react';
import {
    Image,
    View,
    Pressable,
    StyleSheet,
} from 'react-native'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import GradebookScreen from './GradebookScreen';
import ProfileScreen from './ProfileScreen';
import RemindersDrawer from './RemindersDrawer';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ThemeContext } from '../components/themeContext';

const tabIconSize = 35;

const Tab = createBottomTabNavigator();

const MainStackScreen = () => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <Tab.Navigator 
            initialRouteName='Personal' 
            tabBar={props => <TabBar {...props} theme={theme} />}
            tabBarOptions={{
                activeTintColor: theme.s8,
                showIcon: true,
            }}
        >
            <Tab.Screen 
                name = "Personal" 
                component = { ProfileScreen } 
                options = {{
                    tabBarIcon: (tintColor) => {
                        return(
                            <MaterialDesignIcons name='account' color={tintColor} size={tabIconSize + 3} /> // +3 because original icon was too small
                        );
                    },
                }}
            />
            <Tab.Screen 
                name = "Grades" 
                component = { GradebookScreen } 
                options = {{
                    tabBarIcon: (tintColor) => {
                        return(
                            <MaterialDesignIcons name='school' color={tintColor} size={tabIconSize} />
                        );
                    },
                    tabBarLabel: 'Grades'
                }}
            />
            <Tab.Screen 
                name = "Reminders" 
                component = { RemindersDrawer } 
                options = {({route}) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'Personal' // https://stackoverflow.com/questions/55171880/how-to-disable-drawer-navigation-swipe-for-one-of-navigator-screen-only
                    return {
                        tabBarIcon: (tintColor) => {
                            return(
                                <MaterialDesignIcons name='book' color={tintColor} size={tabIconSize - 5} /> // -5 because original size was too big
                            );
                        },
                        tabBarLabel: 'Reminders',
                        tabBarVisible: routeName === 'Calendar' ? false : true,
                    }
                }}
            /> 
        </Tab.Navigator> 
    )
}

const TabBar = ({ state, descriptors, navigation, theme }) => { // custom tab navigation bar
    const focusedOptions = descriptors[state.routes[state.index].key].options;

    if(focusedOptions.tabBarVisible === false) {
        return null;
    }

    return (
        <View style={{backgroundColor: theme.s1}}>
        <View style={[styles.tabContainer, {backgroundColor: theme.s9}]}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const iconColor = isFocused ? theme.s3 : theme.s4;
                const icon = options.tabBarIcon(iconColor);

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if(!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <Pressable
                        key={index}
                        accessibilityRole='button'
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabButton}
                    >
                        {icon}
                    </Pressable>
                );
            })}
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        width: '100%', 
        height: 70,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        flexDirection: 'row',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }, 
});

export default MainStackScreen;
