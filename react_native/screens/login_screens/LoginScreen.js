import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../../components/context';
import { login } from '../../components/api';
import { useFocusEffect } from '@react-navigation/core';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const bgColor = 'rgba(25, 25, 24, 1)' //'#7FB685';

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

    const footerStyle = useAnimatedStyle(() => {
        return {
        backgroundColor: withTiming(`rgba(99, 99, 99, ${cardOpacity.value})`, {duration: 400}),
        transform: [{translateY: withTiming(cardY.value, {duration: 600, easing: Easing.bezier(0.5, 0.01, 0, 1)})}],
        };
    });

    const textStyle = useAnimatedStyle(() => {
        return {
        opacity: withTiming(textOpacity.value, {duration: 1000, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        fontSize: withTiming(textSize.value, {duration: 850, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        transform: [{translateY: withTiming(textY.value, {duration: 800, easing: Easing.bezier(0.5, 0.01, 0, 1)})}],
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

    const verify = async(username, password) => {
        let response = await login(username, password);

        if(response.response === 'Success') {
            return true;
        } else {
            return false;
        }
    }

    const handleLogin = async() => {
        try {
            if(data.username.length === 0 || data.password.length === 0) {
                Alert.alert('naughty naughty', 'Username or password cannot be empty.', [
                    { text: 'Ok' }
                ]);
                return;
            }

            // let loggedIn = await verify(data.username, data.password);
            // if(!loggedIn) {
            //     Alert.alert('oh you naughty boy', 'Invalid username or password. Please try again!', [
            //         { text: 'Ok' }
            //     ]);
            //     return;
            // }
            signIn(data.username);
        } catch(err) {
            console.log(err);
        }
    }

    const updateData = (key, value) => {
        setData({ ...data, [key]: value });
    }
    useEffect(() => {
        navigation.setOptions({ headerStyle: { backgroundColor: bgColor, shadowColor: 'transparent' } });
    }, [])

    return (
        <View
            style={{
            flex: 1,
            flexDirection: 'column',
            backgroundColor: bgColor //'#7FB685'
        }}>
            <View style={{flex: 2, alignItems: 'center', justifyContent: 'center'}}>
            <Animated.Text style={[{color: 'white', fontWeight: 'bold', fontSize: 55}, textStyle]}>Sign in</Animated.Text>
            </View>
            <Animated.View 
                style={[
                    styles.card,
                    footerStyle,
                ]}
            >
                <LoginField handleLogin={handleLogin} secureEntry={data.secureEntry} updateData={updateData} />
            </Animated.View>
        </View>
    );
};

const LoginField = ({ handleLogin, secureEntry, updateData }) => {
    return (
        <View style={{width: '100%', height: '100%', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
            <View style={styles.field}>
                <Text style={styles.footer_text}>Username:</Text>
                {/* Icon for username */}
                <TextInput    
                    autoCapitalize='none'            
                    placeholder = 'Username'
                    onChangeText={text => {
                        updateData('username', text);
                    }}
                />
            </View>
            <View style={styles.field}>
                <Text style={styles.footer_text}>Password:</Text>
                <View style={{width: '100%', height: 35, flexDirection: 'row'}}>
                    <View style={[styles.inputIcon, {backgroundColor: 'green'}]}>
                        {/* Replace with icon for password */}
                    </View>
                    <TextInput
                        autoCapitalize='none'
                        style={styles.footer_input}
                        placeholder = 'Password'
                        onChangeText={text => {
                            updateData('password', text);
                        }}
                        secureTextEntry = {secureEntry}
                    /> 
                    <TouchableOpacity style={styles.inputIcon} onPress={() => updateData('secureEntry', !secureEntry)}>
                        {/* Replace the view below with the show password/unshow password icon */}
                        <View style={{flex: 1, backgroundColor: 'gray'}} />
                    </TouchableOpacity>
                </View>
            </View>
            <Pressable
                style={({pressed}) => [{backgroundColor: pressed ? bgColor : 'white'}, styles.logIn_button]}
                onPressOut={() => handleLogin()}
            >
                {({pressed}) => (
                    <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 16, color: pressed ? 'white' : bgColor}}>Login</Text>
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
    },
    logIn_button: {
        width: 70,
        height: 40,
        marginTop: 20,
        borderColor: bgColor,
        borderWidth: 1.5,
        borderRadius: 10,
        alignSelf: 'flex-end',
        alignItems: 'center',
        justifyContent: 'center',
    }, 
    card: {
        flex: 5, 
        backgroundColor: 'rgba(99, 99, 99, 0)', 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingLeft: 25,
        paddingRight: 25,
        paddingTop: 30,
    },
    field: {
        alignSelf: 'stretch',
        marginBottom: 15,
        borderBottomColor: '#EAEAEA',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    footer_text: {
        color: 'white',
        marginBottom: 2,
        fontFamily: 'ProximaNova-Regular',
        fontSize: 17,
    },
    footer_input: {
        flex: 8,
        top: 1.5,
        marginLeft: 5,
        textAlignVertical: 'center',
    },
    inputIcon: {
        flex: 1,
        backgroundColor: 'red'
    },
});

export default LoginScreen;