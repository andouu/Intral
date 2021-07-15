import React, { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getGrades } from './api.js';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const username = 'your username'
const password = 'your password'
let quarter = 4;

const GradeBoxes = (props) => { 
    const[grades, setGrades] = useState([]);

    const isFocused = useIsFocused(); // Will be used to determine if the user is focused on the screen (aka if the user is looking at the gradepage) 
    useEffect(() => {                 // NOTE: Should probably have student reload manually (if there are no changes), reloading on each focus seems wasteful and inefficient
        if(isFocused) {
            (async() => {                                                               // async function to provide scope for await keyword
                let tmpGrades = await getGrades(username, password, quarter, 'grades'); // pulls data from api asyncronously from api.js
                let classObjs = tmpGrades.map((period, i) => {
                    let classInfo = { // creates object to be used in the array of school classes (state)
                        gradeLtr: period.Marks.Mark.CalculatedScoreString, 
                        gradePct: period.Marks.Mark.CalculatedScoreRaw, 
                        period: period.Period, 
                        teacher: period.Staff
                    }; 
                    return classInfo;
                })
                setGrades(classObjs)
            })();         
        }
    }, [isFocused])
    
    let gradeObjects = grades.map((data, i) => {
        return(
            <TouchableOpacity style = {gradeStyles.grade_display} key = {i}>
                <View>
                    <Text style = {gradeStyles.grade_letter}>{data.gradeLtr}</Text> 
                </View>
                <View style = {gradeStyles.vertical_line}></View>
                <Text style = {gradeStyles.grade_info}>{`Period ${data.period}: ${data.teacher}`}</Text>
            </TouchableOpacity> 
        );
    });

    return(          
        gradeObjects.map(obj => {
            return(obj);
        })
    );
}

class GradebookPage extends React.Component{
    constructor(props) {
        super(props);

    }

    render() {     
        return(
            <View style = {gradeStyles.container}>
                <ScrollView style = {gradeStyles.grade_container} contentContainerStyle = {{paddingBottom: 10, marginTop: -20}}>
                    {/*<Text style = {{fontSize: 35, fontFamily: "Raleway-Bold", height: 70}}>Grades:</Text>  <-- Optional since Stack.Screen will 
                    create name for the page automatically (name is required, not optional)*/}  
                    <View style = {{flexDirection: "column", justifyContent: "space-around", flex: 1}}>
                        <GradeBoxes />     
                    </View>
                </ScrollView>
            </View>
        );
    } 
}

const StackNav = createStackNavigator();

function GradebookStack(){
    return (
        <StackNav.Navigator>
            <StackNav.Screen name = 'Grades' component = {GradebookPage} />
        </StackNav.Navigator>
    );
}

const gradeStyles = StyleSheet.create({
    container: {
        height: "100%",
        flex: 1,
    },
    grade_container: {
        height: "100%",
        padding: 28,
        flex: 9,
    },
    grade_display: {
        margin: "5%",
        backgroundColor: "rgba(255,255,255,0)",
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    grade_letter: {
        marginRight: "15%",
        fontSize: 50,
        fontFamily: "Raleway-SemiBold",
    },
    vertical_line: {
        height: "100%",
        width: 1.5,
        backgroundColor: "rgba(0,0,0,1)",
        marginLeft: 80,
        position: "absolute"
    },
    grade_info: {
        marginLeft: "15%",
        fontFamily: 'Raleway-MediumItalic',
        fontSize: 15,
        flexWrap: "wrap",
        flexShrink: 1,
        alignItems: "flex-start",
        position: "absolute",
        marginLeft: 120
    },
});

export default GradebookStack;