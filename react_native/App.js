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
    TouchableHighlight
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
            <View style = {{flexDirection: "column", alignItems: "center", paddingTop: 15}}>
                <View style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>A</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>Your class info, percentage, blah blah</Text>
                </View>
                <View style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>A</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>Your class info, percentage, blah blah</Text>
                </View>
                <View style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>A</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>Your class info, percentage, blah blah</Text>
                </View>
                <View style = {styles.grade_display}>
                    <Text style = {styles.grade_letter}>A</Text>
                    <View style = {styles.vertical_line}></View>
                    <Text style = {styles.grade_info}>Your class info, percentage, blah blah</Text>
                </View>
            </View>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 35,
        flex: 1,
    },
    grade_display: {
        backgroundColor: "#DDDDDD",
        height: "16%",
        width: "100%",
        flexDirection: "row",
        marginTop: "5%",
        marginBottom: "5%",
        justifyContent: "center",
        padding: "5%",
    },
    grade_letter: {
        marginRight: "5%",
        fontSize: 40,
        fontWeight: "bold"
    },
    vertical_line:{
        height: "100%",
        width: 2,
        backgroundColor: "#909090",
    },
    grade_info: {
        marginLeft: "5%"
    }
});

export default App;