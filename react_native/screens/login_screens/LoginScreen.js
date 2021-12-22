import React, { useState, useContext, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/core';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../../components/authContext';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../../components/api';
import { ThemeContext } from '../../components/themeContext';
import LinearGradient from 'react-native-linear-gradient';
import { CheckBox } from 'react-native-elements';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { toRGBA } from '../../components/themes';
import { widthPctToDP } from '../../components/utils';

const LoginScreen = ({ navigation }) => {
    const [data, setData] = useState({
        username: '',
        password: '',
        secureEntry: true,
    });

    const textOpacity = useSharedValue(0);
    const textSize = useSharedValue(55);
    const textY = useSharedValue(75);
    const cardOpacity = useSharedValue(1);
    const cardY = useSharedValue(190);
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const textStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(textOpacity.value, {duration: 1000}),
            fontSize: withTiming(textSize.value, {duration: 850}),
        };
    });

    useFocusEffect(() => {
        textSize.value = 55;
        textOpacity.value = 1;
        textY.value = -25;
        setTimeout(() => {
        cardOpacity.value = 1;
        cardY.value = 0;
        }, 150);
    });

    const { signIn } = useContext(AuthContext);

    const handleLogin = async (saveCredentials) => {
        try {
            if(data.username.length === 0 || data.password.length === 0) {
                Alert.alert('Alert', 'Username or password cannot be empty.');
                return;
            }
            
            await Keychain.resetGenericPassword(); // secure credentials storage
            await Keychain.setGenericPassword(data.username, data.password);

            let loggedIn = await login();
            if (loggedIn.response !== 'Success') {
                Alert.alert('Alert', 'Invalid username or password. Please try again!');
                return;
            }

            AsyncStorage.setItem('saveCredentials', saveCredentials ? 'true' : 'false');

            signIn();
        } catch(err) {
            console.log(err);
        }
    }

    const updateData = (key, value) => {
        setData({ ...data, [key]: value });
    }

    useEffect(async () => {
        try {
            let saveCredentials = await AsyncStorage.getItem('saveCredentials');
            if (saveCredentials && saveCredentials === 'true') {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    setData({
                        ...data,
                        username: credentials.username,
                        password: credentials.password,
                    });
                }
            }
        } catch(err) {
            console.log(err);
        }
    }, []);

    useEffect(() => {
        navigation.setOptions({ headerStyle: { backgroundColor: theme.s1, shadowColor: 'transparent' } });
    }, [])

    return (
        <LinearGradient
            colors={[theme.s1, theme.s1, theme.s14]}
            style={{
                flex: 1,
                flexDirection: 'column',
                backgroundColor: theme.s1 //'#7FB685'
            }}
        >
            <View style={{ flex: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.Text style={[{ color: 'white', fontWeight: 'bold', fontSize: 55 }, textStyle]}>Sign in</Animated.Text>
            </View>
            <Animated.View 
                style={[
                    styles.card,
                ]}
            >
                <LoginField
                    data={data}
                    handleLogin={handleLogin}
                    updateData={updateData}
                    theme={theme}
                />
            </Animated.View>
        </LinearGradient>
    );
};

const eyeOpenImage = require('../../assets/images/Password_Eye_Open_Icon.png'); 
const eyeClosedImage = require('../../assets/images/Password_Eye_Closed_Icon.png');

const LoginField = ({ data, handleLogin, updateData, theme }) => {
    const [saveCredentials, setSaveCredentials] = useState(true);

    return (
        <View style={{ width: '100%', height: '60%', fontFamily: 'Proxima Nova Bold', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <View style={styles.field}>
                <Text style={styles.footer_text}>Username:</Text>
                {/* Icon for username */}
                <TextInput
                    autoCapitalize='none'
                    style={[{color:theme.s6, fontFamily: 'Proxima Nova Bold'}]}
                    value={data.username}
                    placeholder = 'Username'
                    placeholderTextColor={theme.s4}
                    onChangeText={text => {
                        updateData('username', text);
                    }}
                />
            </View>
            <View style={styles.field}>
                <Text style={styles.footer_text}>Password:</Text>
                <View style={{width: '100%', flexDirection: 'row'}}>
                    <TextInput
                        autoCapitalize='none'
                        style={[styles.footer_input, {color:theme.s6}]}
                        value={data.password}
                        placeholder = 'Password'
                        placeholderTextColor={theme.s4}
                        onChangeText={text => {
                            updateData('password', text);
                        }}
                        secureTextEntry = {data.secureEntry}
                    />
                    <TouchableOpacity style={styles.inputIcon} onPress={() => updateData('secureEntry', !data.secureEntry)}>
                        <Image
                            source={data.secureEntry ? eyeOpenImage : eyeClosedImage}
                            resizeMode='contain'
                            style={styles.secureEntryIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <CheckBox
                containerStyle={{ backgroundColor: 'transparent', borderColor: 'transparent', padding: 0, marginLeft: 0 }}
                title='Remember me'
                checked={saveCredentials}
                uncheckedColor={theme.s4}
                checkedColor={theme.s6}
                textStyle={{ color: saveCredentials ? theme.s6 : theme.s4, fontFamily: 'Proxima Nova Bold', top: -1.5 }}
                onPress={() => setSaveCredentials(!saveCredentials)}
            />
            <Pressable
                style={({pressed}) => [{backgroundColor: pressed ? toRGBA(theme.s6, 0.5) : 'transparent', borderColor: theme.s6}, styles.logIn_button]}
                onPressOut={() => handleLogin(saveCredentials)}
            >
                {({pressed}) => (
                    <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 16, color: pressed ? theme.s1 : theme.s6}}>Login</Text>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
        color: 'rgb(1,112,255)',
    },
    logIn_button: {
        width: 70,
        height: 40,
        marginTop: 20,
        borderWidth: 1,
        borderRadius: 10,
        alignSelf: 'flex-end',
        alignItems: 'center',
        justifyContent: 'center',
    }, 
    card: {
        flex: 8,
        borderTopLeftRadius: 10, 
        borderTopRightRadius: 10, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingLeft: 25,
        paddingRight: 25,
    },
    field: {
        alignSelf: 'stretch',
        marginBottom: 25,
        borderBottomColor: '#EAEAEA',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    footer_text: {
        color: 'white',
        marginBottom: 4,
        fontSize: 17,
        fontFamily: 'Proxima Nova Bold', 
    },
    footer_input: {
        flex: 8,
        textAlignVertical: 'center',
        fontFamily: 'Proxima Nova Bold',
    },
    inputIcon: {
        flex: 1,
    },
    secureEntryIcon: {
        flex: 1,
        alignSelf: 'center',
        width: '80%',
        height: undefined,
    },
});

export default LoginScreen;