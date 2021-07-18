import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getStudentInfo } from '../components/api.js';

import {
    StyleSheet,
    Switch,
    Dimensions,
    View,
    Text,
    Image,
    ActivityIndicator,
} from 'react-native';

const credentials = require('../credentials.json') // WARNING: temporary solution

const username = credentials.username // temporary for testing, authentication isn't up yet
const password = credentials.password

const SettingsScreen = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    
    return(
        <View style = {{flex:1, flexDirection: 'row', justifyContent: 'center', padding: 10}}>
            <View style = {styles.setting_box}>
                <Text style = {{flex: 2, marginLeft: 20, fontSize: 20, fontFamily: 'Raleway-Medium', color: '#373737', height: 32}}>Darkmode:</Text>
                    <Switch 
                        trackColor = {{false: '#373737', true: '#53C446'}}
                        thumbColor = {'#f4f3f4'}
                        onValueChange = {toggleSwitch}
                        value = {isEnabled}
                        style = {{
                            marginRight: 10,
                        }}
                    />
            </View>
        </View>
    );
}

const ProfileScreen = () => {
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

    return (
        <View style = {styles.container}>
            {
                isLoading ?  
                    <ActivityIndicator size = 'large' color = 'black' />
                : (
                    <View style = {[styles.container, {flexDirection: 'column'}]}>
                        <View>
                            <Image source={{uri: `data:image/png;base64, ${studentInfo.StudentInfo.Photo}`}} style={styles.profilePic} />
                        </View>
                        <Text>This is your profile page</Text>
                    </View>
                )  
            }
        </View>
    )
}

const Drawer = createDrawerNavigator();

function PersonalScreen() {
    return (
        <Drawer.Navigator initialRouteName = 'Home'>
            <Drawer.Screen name = 'Home' component = {ProfileScreen} />
            <Drawer.Screen name = 'Settings' component = {SettingsScreen} />
        </Drawer.Navigator>
    );
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
        flex: 1,
    },
    profilePic: {
        width: 150,
        height: 150,
        borderRadius: 90,
        overflow: 'hidden',
    },
});

export default PersonalScreen;