import 'react-native-gesture-handler';
/*import react-native-gesture-handler HAS TO BE the FIRST line */;
import React, {
    useEffect,
    useMemo,
    useState,
    useReducer,
} from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createDrawerNavigator } from '@react-navigation/drawer';
// WARNING: AsyncStorage is NOT SECURE BY ITSELF. Pair with other libraries such as react-native-keychain and etc. when storing sensitive data.
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
    View,
    ActivityIndicator,
    StatusBar,
    StyleSheet,
} from 'react-native';
import { colorways } from './components/themes';
import MainStackScreen from './screens/MainStackScreen';
import SettingsScreen from './screens/SettingsScreen';
import RootStackScreen from './screens/RootStackScreen';
import { AuthContext } from './components/authContext';
import { ThemeContext } from './components/themeContext';

/*Since we're using bottomTabNavigator, you have to create each screen as a stackNavigator, as a child under the tab navigator*/

const Drawer = createDrawerNavigator();

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
        setTheme: (newData) => { setThemeData(newData) }
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
        signIn: async(username) => {
            let userToken;
            userToken = '69';
            try {
                await AsyncStorage.setItem('userToken', userToken);
            } catch(err) {
                console.log(err);
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

    useEffect(() => {
        setTimeout(async() => {
            let userToken;
            userToken = null;
            try {                                                     // TODO: Securely store userData in AsyncStorage with react-native-keychain, etc.
                userToken = await AsyncStorage.getItem('userToken');
            } catch(err) {
                console.log(err);
            }
            dispatch({ type: 'REGISTER', token: userToken });
        }, 0)
    }, []);

    if(loginState.isLoading) {
        return (
            <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
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
                            <Drawer.Screen name = 'Home' component = {MainStackScreen} />
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