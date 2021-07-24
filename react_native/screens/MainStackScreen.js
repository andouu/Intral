import React from 'react';
import {
    Image,
    View,
    Pressable,
    StyleSheet,
} from 'react-native'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GradebookScreen from './GradebookScreen';
import ProfileScreen from './ProfileScreen';
import RemindersDrawer from './RemindersDrawer';
import { swatch, swatchRGB } from '../components/theme';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'

const tabIconSize = 35;

const Tab = createBottomTabNavigator();

const MainStackScreen = () => {
    return (
        <Tab.Navigator 
            initialRouteName='Personal' 
            tabBar={props => <TabBar {...props} />}
            tabBarOptions={{
                activeTintColor: swatch['s8'],
                showIcon: true,
            }}
        >
            <Tab.Screen 
                name = "Personal" 
                component = { ProfileScreen } 
                options = {{
                    tabBarIcon: (tintColor) => {
                        return(
                            // <Image style = {{height: tabIconSize-7, width: tabIconSize-7, tintColor: tintColor}} // -6 size because David's icons are bigger than Adi's (temporary)
                            //     source = { require('../assets/images/profile.png') }
                            // />
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
                            // <Image style = {{height: tabIconSize, width: tabIconSize, tintColor: tintColor}}  
                            //     source = { require('../assets/images/CAS_grade_book_icon.png') }
                            // />
                            <MaterialDesignIcons name='school' color={tintColor} size={tabIconSize} />
                        );
                    },
                    tabBarLabel: 'Grades'
                }}
            />
            <Tab.Screen 
                name = "Reminders" 
                component = { RemindersDrawer } 
                options = {{
                    tabBarIcon: (tintColor) => {
                        return(
                            // <Image style = {{height: tabIconSize, width: tabIconSize, tintColor: tintColor}}  
                            //     source = { require('../assets/images/CAS_planner_icon.png') }
                            // />
                            <MaterialDesignIcons name='book' color={tintColor} size={tabIconSize - 5} /> // -5 because original size was too big
                        );
                    },
                    tabBarLabel: 'Reminders'
                }}
            /> 
        </Tab.Navigator> 
    )
}

const TabBar = ({ state, descriptors, navigation }) => { // custom tab navigation bar
    const focusedOptions = descriptors[state.routes[state.index].key].options;
    
    if(focusedOptions.tabBarVisible === false) {
        return null;
    }

    return (
        <View style={styles.tabContainer}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const iconColor = isFocused ? swatch['s3'] : swatch['s4'];
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
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        width: '100%', 
        height: 80,
        flexDirection: 'row',
        backgroundColor: swatch['s1'],
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }, 
});

export default MainStackScreen;
