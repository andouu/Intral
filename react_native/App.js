import 'react-native-gesture-handler';
/*import react-native-gesture-handler HAS TO BE the FIRST line */;
import React, {
    useState,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
    Image,
    View,
    ActivityIndicator,
} from 'react-native';

import GradebookScreen from './screens/GradebookScreen';
import PlannerScreen from './screens/PlannerScreen';
import PersonalScreen from './screens/PersonalScreen';
import RootStackScreen from './screens/RootStackScreen';
import { AuthContext } from './components/context';
import { login } from './components/api';
import { DrawerContentScrollView } from '@react-navigation/drawer';

/*Since we're using bottomTabNavigator, you have to create each screen as a stackNavigator, as a child under the tab navigator*/

const Tab = createBottomTabNavigator();

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
            try {
                userToken = await AsyncStorage.getItem('userToken');
            } catch(err) {
                console.log(err);
            }
            dispatch({ type: 'REGISTER', token: userToken });
        }, 1000)
    }, []);

    if(loginState.isLoading) {
        return (
            <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <ActivityIndicator size = 'large' color = 'black' />
            </View>
        );
    }
    
    return (
        <AuthContext.Provider value = {authContext}>
            <SafeAreaProvider>
                <NavigationContainer theme = {DefaultTheme}>
                    {loginState.userToken !== null ? (
                        <Tab.Navigator>
                            <Tab.Screen 
                                name = "Planner" 
                                component = { PlannerScreen } 
                                options = {{
                                    tabBarIcon: ({}) => (
                                        <Image style = {{height: 30, width: 30 }}  
                                            source = { require('./assets/images/CAS_planner_icon.png') }
                                        />
                                    ),
                                    tabBarLabel: 'Planner'
                                }}
                            />
                            <Tab.Screen 
                                name = "Grades" 
                                component = { GradebookScreen } 
                                options = {{
                                    tabBarIcon: ({}) => (
                                        <Image style = {{height: 30, width: 30}}  
                                            source = { require('./assets/images/CAS_grade_book_icon.png') }
                                        />
                                    ),
                                    tabBarLabel: 'Grades'
                                }}
                            />
                            <Tab.Screen 
                                name = "Personal" 
                                component = { PersonalScreen } 
                                options = {{
                                    tabBarIcon: ({}) => (
                                        <Image style = {{height: 30, width: 30}}  
                                            source = { require('./assets/images/CAS_settings_icon.png') }
                                        />
                                    ),
                                    tabBarLabel: 'You'
                                }}
                            /> 
                        </Tab.Navigator> 
                    ) : (
                        <RootStackScreen />
                    )}
                    
                    
                </NavigationContainer>
            </SafeAreaProvider>
        </AuthContext.Provider>
    );
};

export default App;