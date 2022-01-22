import 'react-native-gesture-handler';
/*import react-native-gesture-handler HAS TO BE the FIRST line */;
import React, {
    useEffect,
    useMemo,
    useState,
    useReducer,
} from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import notifee, { AndroidGroupAlertBehavior } from '@notifee/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackgroundTimer from 'react-native-background-timer';
import {
    View,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import { colorways } from './components/themes';
import MainStackScreen from './screens/MainStackScreen';
import SettingsScreen from './screens/SettingsScreen';
import RootStackScreen from './screens/RootStackScreen';
import { AuthContext } from './components/authContext';
import { ThemeContext } from './components/themeContext';
import { getGrades, findDifference, logDiff, noDiff } from './components/api';
import { capitalizeWord } from './components/utils';

/*Since we're using bottomTabNavigator, you have to create each screen as a stackNavigator, as a child under the tab navigator*/

const Drawer = createDrawerNavigator();

let quarter = 1; // TODO ******************

BackgroundTimer.runBackgroundTimer(async () => {
    try {
        console.log('checking for gradebook changes...');
        const credentials = await Keychain.getGenericPassword();
        if (!credentials) return;
        let pull = await getGrades(credentials.username, credentials.password, quarter);  // pulls data from api asyncronously from api.js
        // console.log(pull);
        let difference = [];
        let storedClasses = await AsyncStorage.getItem('classes');
        let prev = JSON.parse(storedClasses); // parse storage pull
        if (Array.isArray(prev)) {
            difference = findDifference(prev, pull);  // compare to simulated data for added, removed, and modified (ie. pts. changed) assignments

            if (Object.keys(difference).length !== 0 && difference.constructor === Object) {  // check if there are any differences
                await AsyncStorage.setItem('gradebookChanges', JSON.stringify(difference));  // save the difference to storage
                await AsyncStorage.setItem('notifsSeen', JSON.stringify({ seen: false }));   // set the notifs warning to show in profile page everytime there are new changes
            } else {
                console.log('no changes');
                return;
            }
        }
        if (!noDiff(difference)) {
            await AsyncStorage.setItem('classes', JSON.stringify(pull)); // temporary
            handleDisplayNotif(difference);
        }
    } catch(err) {
        console.error(err);
    }
}, 300000); // 300000ms = 5 min

const handleDisplayNotif = async (diff) => {
    if (noDiff(diff)) return;
    await notifee.cancelDisplayedNotifications();
    const channelId = await notifee.createChannel({
        id: 'Updates',
        name: 'Updates',
    });        
    await notifee.displayNotification({
        title: 'Updates',
        subtitle: 'Updates',
        android: {
            channelId,
            groupSummary: true,
            groupId: 'Updates',
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
            color: '#0170ff',
            smallIcon: 'ic_stat_name',
        }
    });

    for(let key in diff) {
        let action = diff[key];
        action.forEach(item => {
            item.assignments.forEach(assignment => {
                if (key !== 'changed') {
                    notifee.displayNotification({
                        title: assignment.Measure,
                        body: 'Tap to see assignment details',
                        subtitle: `Period ${item.period + 1} ${capitalizeWord(key)}`,
                        android: {
                            channelId,
                            groupId: 'Updates',
                            groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
                            pressAction: {
                                id: 'pep',
                                launchActivity: 'default',
                            },
                            smallIcon: 'ic_stat_name',
                        }
                    });
                } else {
                    notifee.displayNotification({
                        title: assignment.Measure,
                        body: `${assignment.changes.join(', ')} changed for ${assignment.Measure}`,
                        subtitle: `Period ${item.period + 1} Changed`,
                        android: {
                            channelId,
                            groupId: 'Updates',
                            groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
                            pressAction: {
                                id: 'pep',
                                launchActivity: 'default',
                            },
                            smallIcon: 'ic_stat_name',
                        }
                    });
                }
            })
        })
    }

    logDiff(diff);
}

const App = () => {
    // const [isLoading, setIsLoading] = useState(true);
    // const [userToken, setUserToken] = useState(null);
    const [themeData, setThemeData] = useState({
        theme: 'Dark',
        cardOutlined: true,
        navBarTransparent: false,
        swatch: colorways.Dark, // TODO: add more themes
    });

    const themeValue = {
        themeData,
        setTheme: (newTheme) => { setThemeData(newTheme); }
    }

    const initialLoginState = {
        isLoading: true,
        username: null,
        userToken: null, // since the api doesn't really use a token, we can set it to anything
    };

    const loginReducer = (prevState, action) => {
        switch(action.type) {
            case 'RETRIEVE_TOKEN':
                return {
                    ...prevState,
                    userToken: action.token,
                    isLoading: false,
                };
            case 'LOGIN':
                return {
                    ...prevState,
                    username: action.id,
                    userToken: action.token,
                    isLoading: false,
                };
            case 'LOGOUT':
                return {
                    ...prevState,
                    username: null,
                    userToken: null,
                    isLoading: false,
                };
            case 'REGISTER':
                return {
                    ...prevState,
                    username: action.id,
                    userToken: action.token,
                    isLoading: false,
                };
        }
    };

    const [loginState, dispatch] = useReducer(loginReducer, initialLoginState);

    const authContext = useMemo(() => ({
        signIn: async() => {
            // user token
            let userToken;
            userToken = '69';
            try {
                await AsyncStorage.setItem('userToken', userToken);
            } catch(err) {
                console.log(err);
            }
            
            // username
            let username;
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    username = credentials.username;
                }
            } catch (err) {
                console.log("Keychain could not be accessed. " + err);
            }

            dispatch({ type: 'LOGIN', id: username, token: userToken });
        },
        signOut: async() => {
            try {
                userToken = await AsyncStorage.removeItem('userToken');
            } catch(err) {
                console.log(err);
            }
            dispatch({ type: 'LOGOUT' });
        },
        signUp: () => {
        },
    }), []);

    useEffect(async () => {
        let userToken;
        userToken = null;
        try {                                                     // TODO: Securely store userData in AsyncStorage with react-native-keychain, etc.
            userToken = await AsyncStorage.getItem('userToken');
        } catch(err) {
            console.log(err);
        }
        dispatch({ type: 'REGISTER', token: userToken });
        const hasBatteryOptimization = await notifee.isBatteryOptimizationEnabled();
        // console.log(hasBatteryOptimization);
        // if (hasBatteryOptimization) {
        //     Alert.alert('Error', 'To make sure that you get notifications when grades are updated, please disable battery optimizations for Intral.', 
        //     [
        //         {
        //             text: 'Open settings',
        //             onPress: async () => await notifee.openBatteryOptimizationSettings(),
        //         },
        //     ],
        //     { cancelable: false }
        //     );
        // }
    }, []);

    if(loginState.isLoading) {
        return (
            <View style = {{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size = 'large' color = 'black' />
            </View>
        );
    }
    
    return ( // TODO: Android immersive mode
        <AuthContext.Provider value={authContext}>
        <ThemeContext.Provider value={themeValue}>
            <SafeAreaProvider>
                <StatusBar
                    hidden={true}
                />
                <NavigationContainer 
                    theme = {{
                        colors: {
                            primary: themeData.swatch.s3,
                            text: themeData.swatch.s6,
                            card: themeData.swatch.s1,
                            background: themeData.swatch.s1,
                        }
                    }}
                >
                    {loginState.userToken !== null ? (
                        <Drawer.Navigator 
                            initialRouteName='Home'
                            drawerContentOptions={{
                                style: {backgroundColor: themeData.swatch.s1},
                            }}
                        >
                            <Drawer.Screen 
                                name = 'Home' 
                                component = {MainStackScreen} 
                                options={({route}) => {
                                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'Personal' // https://stackoverflow.com/questions/55171880/how-to-disable-drawer-navigation-swipe-for-one-of-navigator-screen-only
                                    if(routeName !== 'Personal')
                                        return ({swipeEnabled: false})
                                }}
                            />
                            <Drawer.Screen name = 'Settings' component = {SettingsScreen} />
                        </Drawer.Navigator>
                    ) : (
                        <RootStackScreen />
                    )} 
                </NavigationContainer>
            </SafeAreaProvider>
        </ThemeContext.Provider>
        </AuthContext.Provider>
    );
};

export default App;