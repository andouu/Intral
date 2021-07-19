import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { getStudentInfo } from '../components/api.js';
import { AuthContext } from '../components/context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    StyleSheet,
    Switch,
    Dimensions,
    View,
    Text,
    Image,
    ActivityIndicator,
    Button,
} from 'react-native';
import { Alert } from 'react-native';

const credentials = require('../credentials.json') // WARNING: temporary solution

const username = credentials.username // temporary for testing, authentication isn't up yet
const password = credentials.password

const HomePage = () => {
    const [studentInfo, setStudentInfo] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshInfo = async() => {
        try {
            let info = await getStudentInfo(username, password);
            setStudentInfo(info);
            setIsLoading(false);
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        refreshInfo();
    }, [])

    if(isLoading) {
        return (
            <View style = {styles.container}>
                <ActivityIndicator size = 'large' color = 'black' />
            </View> 
        );
    }

    return (
        <View style = {styles.container}>
            <View style = {[styles.container, {flexDirection: 'column'}]}>
                <View>
                    <Image source={{uri: `data:image/png;base64, ${studentInfo.StudentInfo.Photo}`}} style={styles.profilePic} />
                </View>
                <Text>This is your profile page</Text>
            </View>
        </View>
    )
}

const ProfileStack = createStackNavigator();

const ProfileScreen = ({ navigation }) => {
    return (
        <ProfileStack.Navigator>
            <ProfileStack.Screen
                name = 'Home'  
                component = { HomePage }
                options = {{
                    title: 'Profile',
                    headerLeft: () => (
                        <Icon.Button name = 'ios-menu' size = {25} backgroundColor = 'white' color = 'black' onPress = {() => navigation.openDrawer()} />
                    )
                }}
            />
        </ProfileStack.Navigator>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    setting_box: {
        width: Dimensions.get('window').width - 40,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        margin: 15,
        borderRadius: 5,
        backgroundColor: '#EAEAEA',
    },
    profilePic: {
        width: 150,
        height: 150,
        borderRadius: 90,
        overflow: 'hidden',
    },
    logout_button: {
        minHeight: 75,
        padding: 10,
        marginBottom: 15,
        width: "100%",
        flexDirection: "column",
        justifyContent: "center",
        borderRadius: 5,
        backgroundColor: "#EAEAEA",
    },
});

export default ProfileScreen;