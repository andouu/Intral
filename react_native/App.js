import 'react-native-gesture-handler';
/*import react-native-gesture-handler HAS TO BE the FIRST line */;
import React, {
    useState,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createDrawerNavigator } from '@react-navigation/drawer';
// WARNING: AsyncStorage is NOT SECURE BY ITSELF. Pair with other libraries such as react-native-keychain and etc. when storing sensitive data.
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
    Image,
    View,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import MainStackScreen from './screens/MainStackScreen';
import SettingsScreen from './screens/SettingsScreen';
import RootStackScreen from './screens/RootStackScreen';
import { AuthContext } from './components/context';

/*Since we're using bottomTabNavigator, you have to create each screen as a stackNavigator, as a child under the tab navigator*/

const Drawer = createDrawerNavigator();

const navTheme = DefaultTheme;
navTheme.colors.background = '#FFFFFF';

const App = () => {
    // const [isLoading, setIsLoading] = useState(true);
    // const [userToken, setUserToken] = useState(null);

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
        <AuthContext.Provider value = {authContext}>
            <SafeAreaProvider>
                <StatusBar
                    hidden={true}
                />
                <NavigationContainer theme = {DefaultTheme}>
                    {loginState.userToken !== null ? (
                        <Drawer.Navigator>
                            <Drawer.Screen name = 'Home' component = {MainStackScreen} />
                            <Drawer.Screen name = 'Settings' component = {SettingsScreen} />
                        </Drawer.Navigator>
                    ) : (
                        <RootStackScreen />
                    )} 
                </NavigationContainer>
            </SafeAreaProvider>
        </AuthContext.Provider>
    );
};

export default App;