import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { getStudentInfo } from '../components/api.js';
import { AuthContext } from '../components/context';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {
    StyleSheet,
    Switch,
    Dimensions,
    View,
    Text,
    Image,
    ActivityIndicator,
    Button,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { Alert } from 'react-native';

import { swatch, swatchRGB } from '../components/theme'; 

const profPicSize = 50;

const credentials = require('../credentials.json') // WARNING: temporary solution

const username = credentials.username // temporary for testing, authentication isn't up yet
const password = credentials.password

const HomePage = ({ navigation }) => {
    const [studentInfo, setStudentInfo] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshInfo = async() => {
        try {
            setIsRefreshing(true);
            let info = await getStudentInfo(username, password);
            if(!info.text) {
                setStudentInfo(info);
                setIsLoading(false);
                setIsRefreshing(false);
            }
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        refreshInfo();
    }, [])

    if(isLoading) {
        return (
            <View style = {[styles.container, {alignItems: 'center', justifyContent: 'center'}]}>
                <ActivityIndicator size = 'large' color={swatch['s4']} />
            </View> 
        );
    }

    return (
        <ScrollView 
            style = {styles.container}
            refreshControl={
                <RefreshControl 
                    refreshing={isRefreshing}
                    onRefresh={refreshInfo}
                />
            }
        >
            <View style={styles.optionsBar}>
                <View style={styles.menu_button}>
                    <MaterialDesignIcons.Button 
                        underlayColor={`rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`}
                        activeOpacity={0.5}
                        right={2}
                        bottom={4}
                        hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                        borderRadius = {80}
                        name='menu' 
                        color={swatch['s4']} 
                        size={35}
                        backgroundColor='transparent'
                        onPress={() => navigation.openDrawer()} 
                        style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                    />
                </View>
                <View style={styles.profilePic_container}>
                    <Image source={{uri: `data:image/png;base64, ${studentInfo.StudentInfo.Photo}`}} style={styles.profilePic} />
                </View>
            </View>
            <View style = {styles.main_container}>
                <Text style={styles.header_text}>Hi {studentInfo.StudentInfo.FormattedName.split(' ')[0]}!</Text>
            </View>
        </ScrollView>
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
                    headerShown: false,
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
        backgroundColor: swatch.s1,
    },
    profilePic_container: {
        right: 0,
    }, 
    profilePic: {
        width: profPicSize,
        height: profPicSize,
        borderRadius: 90 ,
    },
    optionsBar: {
        height: 100,
        top: 0,
        paddingLeft: 15,
        paddingRight: 15,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },  
    menu_button: {
        alignSelf: 'center',
        padding: 0,
        marginRight: 'auto',
        width: 45,
        maxHeight: 45,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: `rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`,
    },
    header_text: {
        color: swatch['s6'],
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
    },
    main_container: {
        flex: 1, 
        width: '100%', 
        height: '100%', 
        alignItems: 'flex-start', 
        justifyContent: 'flex-start', 
        flexDirection: 'column',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 0,
    },
});

export default ProfileScreen;