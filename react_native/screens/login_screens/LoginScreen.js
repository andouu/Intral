import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { AuthContext } from '../../components/context';
import { login } from '../../components/api';
import { set } from 'react-native-reanimated';

const LoginScreen = ({ navigation }) => {
    const [data, setData] = useState({
        username: '',
        password: '',
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

    const handleLogin = async(username, password) => {
        try {
            if(username.length === 0 || password.length === 0) {
                Alert.alert('naughty naughty', 'Username or password cannot be empty.', [
                    { text: 'Ok' }
                ]);
                return;
            }

            let loggedIn = await verify(username, password);
            
            if(!loggedIn) {
                Alert.alert('oh you naughty boy', 'Invalid username or password. Please try again!', [
                    { text: 'Ok' }
                ]);
                return;
            }
            signIn(username);
        } catch(err) {
            console.log(err);
        }
    }

    return (
        <View style = {styles.container}>
            <Text>Login NOW {'\n'}</Text>
            <TextInput                
                placeholder = 'Username'
                onChangeText={text => {
                    setData({...data, username: text});
                }}
            />
            <TextInput
                placeholder = 'Password'
                onChangeText={text => {
                    setData({...data, password: text});
                }}
                secureTextEntry = {true}
            />
            <View style = {{width: 220}}>
                <TouchableOpacity style = {styles.logIn_button} onPress = {() => handleLogin(data.username, data.password)}>
                    <Text style = {{textAlign: 'center'}}>This is the login button that you have to press yes it is</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

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
        height: 60,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: "100%",
        backgroundColor: "#EAEAEA",
        borderRadius: 5,
    }
});

export default LoginScreen;