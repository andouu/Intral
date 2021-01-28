import React, {
    useState
} from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TouchableHighlight,
    TouchableOpacity
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

const App = () => {
    return (
        <>
        <View style = {styles.container}>
            <Text style = {{fontSize: 30, fontWeight: "bold"}}>Grades</Text>
            <View style = {{flexDirection: "column", justifyContent: "space-between"}}>
                <TouchableOpacity style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>F</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>APUSH</Text>
                </TouchableOpacity>                   
                <TouchableOpacity style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>F</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>APUSH</Text>
                </TouchableOpacity>                   
                <TouchableOpacity style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>F</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>APUSH</Text>
                </TouchableOpacity>                   
                <TouchableOpacity style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>F</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>APUSH</Text>
                </TouchableOpacity>                   
            </View>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        height: "100%",
        padding: 35,
        flex: 1,
    },
    grade_display: {
        backgroundColor: "rgba(255,255,255,0.4)",
        flex: 1,
        flexDirection: "row",
        marginTop: "5%",
        marginBottom: "5%",
        alignItems: "center",
        justifyContent: "space-between",
    },
    grade_letter: {
        marginRight: "5%",
        fontSize: 40,
        fontWeight: "bold"
    },
    vertical_line:{
        height: "100%",
        width: 2,
        backgroundColor: "rgba(0,0,0,1)",
    },
    grade_info: {
        marginLeft: "5%"
    }
});

export default App;