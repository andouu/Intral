import React, { useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeContext } from '../components/themeContext';
import { AuthContext } from '../components/authContext';
import { toRGBA } from '../components/utils';
import { colorways } from '../components/themes';
import { Card, PressableCard, DropdownSelectionCard } from '../components/card';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import {
    StyleSheet,
    View,
    Text,
    Switch,
    Vibration,
    Platform,
} from 'react-native';

const Header = ({ navigation, theme, type }) => {
    return (
        <View style={styles.optionsBar}>
            <View style={[styles.menu_button, {borderColor: toRGBA(theme.s4, 0.5)}]}>
                <MaterialDesignIcon.Button 
                    underlayColor={toRGBA(theme.s4, 0.5)}
                    activeOpacity={0.5}
                    right={type === 'menu' ? 2 : 4}
                    bottom={4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius = {80}
                    name={type === 'menu' ? 'menu' : 'arrow-left'}
                    color={toRGBA(theme.s4, 1)} 
                    size={35}
                    backgroundColor='transparent'
                    onPress={() => type === 'menu' ? navigation.openDrawer() : navigation.goBack()} 
                    style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                />
            </View>
        </View>
    );
}

const settingCardHeight = 50;

const DOT = 50;
const DASH = 150;
const DOT_SPACE = 50; //space between parts of the same letter
const DASH_SPACE = 150; //space between letters
let vibrationPattern; //[0, 300, 100, 50, 50, 50, 50, 50, 50, 150, 50, 400]; //trumpet sound?
if (Platform.OS === 'android') vibrationPattern = [0, 
    DASH, DOT_SPACE, DOT, DOT_SPACE, DOT, DOT_SPACE, DOT, DASH_SPACE, //B
    DASH, DOT_SPACE, DASH, DOT_SPACE, DASH, DASH_SPACE,               //O
    DASH, DOT_SPACE, DOT, DOT_SPACE, DOT, DOT_SPACE, DOT, DASH_SPACE, //B
    DOT, DOT_SPACE, DASH, DASH_SPACE,                                 //A
    DOT, DOT_SPACE, DASH, DOT_SPACE, DOT, DOT_SPACE, DOT, DASH_SPACE, //L
    DOT, DOT_SPACE, DASH, DOT_SPACE, DOT, DOT_SPACE, DOT, DASH_SPACE, //L
    DOT, DOT_SPACE, DOT, DOT_SPACE, DOT                               //S
] //morse code for BOBALLS
else if (Platform.OS === 'ios') vibrationPattern = [50, 50, 50];

const HomeScreen = ({ navigation }) => {
    const { signOut } = useContext(AuthContext); // TODO: move signout button to drawer
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    
    const [boballs, setBoballs] = useState(1); /* !@#$% <<easter egg>> ^&*() */

    return (
        <View style = {styles.container}>
            <Header theme={theme} navigation={navigation} type='menu' />
            <View style={styles.main_container}>
                <Text
                    style={[styles.header_text, {color: theme.s6}]}
                    onPress={() => { /* !@#$% <<easter egg>> ^&*() */
                        if (boballs + 1 > 10) {
                            setBoballs(1);
                            Vibration.vibrate(vibrationPattern);
                        } else {
                            setBoballs(boballs + 1);
                            Vibration.cancel();
                        }
                    }}
                >
                    Settings:
                </Text>
                <PressableCard 
                    theme={theme} 
                    containerStyle={{
                        height: settingCardHeight
                    }}
                    pressableStyle={{
                        paddingLeft: 15,
                        paddingRight: 15
                    }}
                    onPress={() => navigation.navigate('Functions')}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Functions Settings</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='radar' size={30} color={theme.s8} />
                    </View>
                </PressableCard>
                <PressableCard 
                    theme={theme} 
                    containerStyle={{
                        height: settingCardHeight
                    }}
                    pressableStyle={{
                        paddingLeft: 15
                    }}
                    onPress={() => navigation.navigate('Cosmetics')}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Cosmetic Settings</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='palette' size={30} color={theme.s11} />
                    </View>
                </PressableCard>
                <DividerHeader text='Sign Out' theme={theme} />
                <PressableCard
                    theme={theme} 
                    containerStyle={{
                        height: settingCardHeight,
                    }}
                    pressableStyle={{
                        paddingLeft: 15
                    }}
                    onPress={signOut}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[ styles.settings_main_text, { color: theme.s11 } ]}>Sign Out</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='logout' size={30} color={theme.s11} />
                    </View>
                </PressableCard>
            </View>
        </View>
    )
}

const DividerHeader = ({ text, theme }) => {
    return (
        <View style={styles.divider_header_container}>
            <View style={styles.divider_header_subcontainer}>
                <Text style={[styles.divider_header_text, {color: theme.s4}]}>{text}</Text>
                <View style={styles.divider_header_line_container}>
                    <View style={[styles.divider_header_line, {borderColor: theme.s13}]} />
                </View>
            </View>
        </View>
    );
}

const FunctionsScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;

    const gradeNotifRateOptionsShortened = ['Max', 'Daily', 'Weekly'];
    const gradeNotifRateOptions = ['Max (every grade refresh)', 'Daily (5pm)', 'Weekly (Saturday 5pm)'];
    const gradeNotifRateDropdownHeight = gradeNotifRateOptions.length * settingCardHeight + settingCardHeight;


    /* FINISH UNFINISHED SETTINGS */


    return (
        <View style={styles.container}>
            <Header theme={theme} navigation={navigation} type='back' />
            <View style={styles.main_container}>
            <DividerHeader text='Notifications' theme={theme} />
                <Card theme={theme} customStyle={styles.settings_card_switch} outlined={themeData.cardOutlined}>
                    <Text style={[styles.settings_main_text, { color: theme.s4 }]}>Allow notifications:</Text>
                    <View style={[styles.settings_icon, { width: 50, top: themeData.cardOutlined ? 10 : 11.5, right: 12 }]}>
                        <Switch 
                            trackColor={{ false: theme.s11, true: theme.s10 }}
                            thumbColor={theme.s6}
                            onValueChange={() => console.log('switched')}
                            value={true} 
                        />
                    </View>
                </Card>
                <DropdownSelectionCard
                    theme={theme}
                    name='Grade Notif Rate:'
                    outlined={themeData.cardOutlined}
                    containerStyle={{ marginBottom: 10 }}
                    heightCollapsed={settingCardHeight}
                    heightExpanded={gradeNotifRateDropdownHeight}
                    shortenedOptionsList={gradeNotifRateOptionsShortened}
                    optionsList={gradeNotifRateOptions}
                    selectOptionHeight={settingCardHeight}
                    initialSelectIndex={0}
                    onChange={(index) => {
                        
                    }}
                />
                
                <DividerHeader text='Gradebook' theme={theme} />
                <Card theme={theme} customStyle={styles.settings_card_switch} outlined={themeData.cardOutlined}>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Grade refresh rate:</Text>
                </Card>
            </View>
        </View>
    );
}

const CosmeticsScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    const setTheme = themeContext.setTheme;

    let themeNames = Object.keys(colorways);
    let colorwaysDropdownHeight = themeNames.length * settingCardHeight + settingCardHeight;

    return (
        <View style={styles.container}>
            <Header theme={theme} navigation={navigation} type='back' />
            <View style={styles.main_container}>
                <DividerHeader text='General' theme={theme} />
                <DropdownSelectionCard
                    theme={theme}
                    name='Theme:'
                    outlined={themeData.cardOutlined}
                    containerStyle={{ marginBottom: 10 }}
                    heightCollapsed={settingCardHeight}
                    heightExpanded={colorwaysDropdownHeight}
                    shortenedOptionsList={themeNames}
                    optionsList={themeNames}
                    selectOptionHeight={settingCardHeight}
                    initialSelectIndex={themeNames.indexOf(themeData.theme)}
                    onChange={(index) => {
                        let newThemeName = themeNames[index];
                        if (newThemeName !== themeData.theme) {
                            setTheme({...themeData, theme: newThemeName, swatch: colorways[newThemeName]});
                        }
                    }}
                />
                {/* <Card theme={theme} customStyle={styles.settings_card_switch} outlined={themeData.cardOutlined}>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Outlined cards: </Text>
                    <View style={[styles.settings_icon, {width: 50, top: themeData.cardOutlined ? 10 : 11.5, right: 12}]}>
                        <Switch 
                            trackColor={{false: theme.s11, true: theme.s10}}
                            thumbColor={theme.s6}
                            onValueChange={() => setTheme({...themeData, cardOutlined: !themeData.cardOutlined})}
                            value={themeData.cardOutlined}
                        />
                    </View>
                </Card> */}
                <Card theme={theme} customStyle={styles.settings_card_switch} outlined={themeData.cardOutlined}>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Transparent NavBar: </Text>
                    <View style={[styles.settings_icon, {width: 50, top: themeData.cardOutlined ? 10 : 11.5, right: 12}]}>
                        <Switch 
                            trackColor={{false: theme.s11, true: theme.s10}}
                            thumbColor={theme.s6}
                            onValueChange={() => setTheme({...themeData, navBarTransparent: !themeData.navBarTransparent})}
                            value={!themeData.navBarTransparent}
                        />
                    </View>
                </Card>

                {/* TODO: planner settings | section colors, event priority colors, use relative dates, show absolute dates */}
            </View>
        </View>
    );
}

const SettingsStack = createStackNavigator();

const SettingsScreen = ({ navigation }) => {
    return(
        <SettingsStack.Navigator> 
            <SettingsStack.Screen 
                name = 'Home' 
                component = { HomeScreen } 
                options = {{
                    title: 'Settings',
                    headerShown: false,
                }}
            />
            <SettingsStack.Screen 
                name = 'Functions' 
                component = { FunctionsScreen } 
                options = {{
                    title: 'Functions Settings',
                    headerShown: false,
                }}
            />
            <SettingsStack.Screen 
                name = 'Cosmetics' 
                component = { CosmeticsScreen } 
                options = {{
                    title: 'Cosmetic Settings',
                    headerShown: false,
                }}
            />
        </SettingsStack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
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
        marginTop: -15,
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
    },
    divider_header_container: {
        width: '100%',
        minHeight: 30,
        marginTop: 15,
        marginBottom: 10,
    },
    divider_header_subcontainer: {
        flex: 1,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    divider_header_text: {
        fontSize: 25,
        fontFamily: 'Proxima Nova Bold',
        marginRight: 10,
    },
    divider_header_line_container: {
        width: '100%',
        justifyContent: 'center',
    },
    divider_header_line: {
        borderBottomWidth: 1,
    },
    settings_main_text: {
        fontSize: 20,
        fontFamily: 'Proxima Nova Bold',
    },
    settings_icon: {
        position: 'absolute',
        right: 15,
    },
    header_text: {
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
        left: 2,
        marginBottom: 20,
    },
    cardHeader_text: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 20,
        marginBottom: 15,
        left: 2,
    },
    settings_card_switch: {
        height: settingCardHeight, 
        alignItems: 'flex-start',
        paddingLeft: 15,
        marginBottom: 10,
    },
});

export default SettingsScreen;