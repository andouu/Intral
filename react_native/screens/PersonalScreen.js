import React, {useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {
    StyleSheet,
    Switch,
    Dimensions,
    View,
    Text,
} from 'react-native';

const SettingsPage = () => {
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

const StackNav = createStackNavigator();

function PersonalScreen() {
    return (
        <StackNav.Navigator>
            <StackNav.Screen name = 'Settings' component = {SettingsPage} />
        </StackNav.Navigator>
    );
}
const styles = StyleSheet.create({
    container: {
        height: "100%",
        flex: 1,
    },
    setting_box: {
        width: Dimensions.get('window').width - 40,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        margin: 15,
        borderRadius: 15,
        backgroundColor: '#EAEAEA',
        flex: 1,
    }
});

export default PersonalScreen;