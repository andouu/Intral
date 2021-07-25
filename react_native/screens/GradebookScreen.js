import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused, useNavigation, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { getGrades } from '../components/api.js';
import dropDownImg from '../assets/images/icons8-expand-arrow.gif';
import { swatch, swatchRGB } from '../components/theme.js';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    SafeAreaView,
    FlatList,
    Image,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import {
    BarChart,
    LineChart,
} from 'react-native-chart-kit';

const dummyAdd = require('../dummy data/add');
const dummyRemove = require('../dummy data/remove');
const dummyAddRemove = require('../dummy data/addRemove');

const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.75,
    useShadowColorFromDataset: false // optional
};

const credentials = require('../credentials.json'); // WARNING: temporary solution
const username = credentials.username // should import username and password from a central location after authentication
const password = credentials.password
const screenWidth = Dimensions.get('window').width;
let quarter = 1;

const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

const validChanges = {        // to check for valid changes; we don't really care about gradebookID changes (if it even changes)
    Type: 'Assignment Type',
    DueDate: 'Due Date',
    Points: 'Points',         // points over score because idk
    Notes: 'Teacher Notes',
}

const GradebookPage = () => {
    const [isLoading, setIsLoading] = useState(true);  
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState([]);
    const isFocused = useIsFocused();               // Will be used to determine if the user is focused on the screen (aka if the user is looking at the gradepage) 
                                                    // NOTE: Should probably have student reload manually (if there are no changes), reloading on each focus seems wasteful and inefficient

    const findDifference = (original, newData) => {
        let added = [];
        let removed = [];
        let changed = [];
        for(let i=0; i<original.length; i++) { // loop through all the classes
            let currAssignments = original[i].Marks.Mark.Assignments.Assignment.slice();     // make a copy of the current assignments
            let compareAssignments = newData[i].Marks.Mark.Assignments.Assignment.slice();   // make a copy of the incoming assignments (to compare against)
            let tmpAdded = []; // temporary array to hold the new assignments
            let tmpChanged = []; // temporary array to hold the changed assignments
            const len = compareAssignments.length;
            for(let j=0; j<len; j++) {
                let index = currAssignments.findIndex(item => item.Measure === compareAssignments[j].Measure); // check if the assignment in the compare array exists in the current assignments
                if(index === -1) { // if it doesn't exist
                    tmpAdded.push(compareAssignments[j]); // add it to the new assignments array
                } else {
                    let tmp = [];
                    for(var key in compareAssignments[j]) {
                        if(validChanges[key]) // check if the key is a change we're looking for
                        {
                            if(compareAssignments[j][key] !== currAssignments[index][key]) {
                                tmp.push(validChanges[key]);
                            }
                        }
                    }
                    if(tmp.length > 0) { // check if there are any changes
                        tmpChanged.push({ Measure: compareAssignments[j].Measure, changes: tmp });
                    }
                    currAssignments.splice(index, 1); // remove it from the current assignments copy. At the end of the loop, the removed assignments will be anything not removed from the copy.
                }
            }

            if(tmpAdded.length > 0) { // if there are any added, removed, or changed assignments, add them to the return object, otherwise don't add anything.
                added.push({ period: i, assignments: tmpAdded });
            }
            if(currAssignments.length > 0) {
                removed.push({ period: i, assignments: currAssignments });
            }
            if(tmpChanged.length > 0) {
                changed.push({ period: i, assignments: tmpChanged });
            }
        }

        let result = {}; // the return object

        if(added.length > 0) {               // if there are any added assignments or removed assignments, return them.
            result.added = added;
        }
        if(removed.length > 0) {
            result.removed = removed;
        }
        if(changed.length > 0) {
            result.changed = changed;
        }
        
        return result;
    }
    
    const logDiff = (diff) => {
        for(let key in diff){
            let arr = diff[key];
            arr.forEach(item => {
                console.log('Period ' + (item.period + 1) + ' ' + key.toString() + ' ' + item.assignments.length + ' assignments: ');
                item.assignments.forEach(assignment => {
                    if(key !== 'changed') {
                        console.log(assignment.Measure);
                    } else {
                        let changeArray = assignment.changes;
                        let fullMessage = '';
                        fullMessage +=  assignment.Measure + ': ';
                        for(let i=0; i<changeArray.length-1; i++) {
                            fullMessage += changeArray[i] + ', ';
                        }
                        fullMessage += changeArray[changeArray.length-1];
                        console.log(fullMessage)
                    }
                });
            });
        }
    }

    const refreshClasses = async() => {  // async function to provide scope for await keyword
        try {
            let pull = await getGrades(username, password, quarter);  // pulls data from api asyncronously from api.js
            if(classes !== []) {
                let storedClasses = await AsyncStorage.getItem('classes');
                let prev = JSON.parse(storedClasses); // local async storage pull
                if (Array.isArray(prev)) {
                    let difference = findDifference(prev, dummyAddRemove);  // compare to simulated data for added, removed, and modified (ie. pts. changed) assignments
                    //TODO replace above with let difference = findDifference(prev, pull); later

                    if(Object.keys(difference).length !== 0 && difference.constructor === Object) {  // check if there are any differences
                        logDiff(difference);
                        // send new push notifications here based on the differences
                    } else {
                        console.log('no changes');
                    }
                }
            }
            await AsyncStorage.setItem('classes', JSON.stringify(pull));
            setClasses(pull);
            setIsLoading(false);
        } catch(err) {
            console.error(err);
        }
    }

    useEffect(async () => {                 
        if(isFocused) {
            await refreshClasses();
        }
    }, []); // runs once (and saves to local async storage), user can manually refresh

    const onRefresh = useCallback(async() => { // refreshes class data when the user refreshes the screen
        setRefreshing(true);
        await refreshClasses();                // wait for the data to load before setting the refreshing state to false
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView style = {gradeStyles.container}>
            {isLoading ? (
                <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: swatch['s1']}}>
                    <ActivityIndicator size = 'large' color = {swatch['s4']} />
                </View>
            ) : (
                <ScrollView 
                    style={gradeStyles.grade_container} 
                    contentContainerStyle = {{paddingBottom: 10, marginTop: 5}}
                    refreshControl = {
                        <RefreshControl
                            refreshing = {refreshing}
                            onRefresh = {onRefresh}
                        />
                    }
                >
                    <View style = {{flexDirection: 'column', justifyContent: 'center', flex: 1}}>
                        <GradeBoxes classes = {classes} />     
                    </View>
                </ScrollView>
            )}   
        </SafeAreaView>
    );
}

const GradeBoxes = ({ classes }) => { 
    const navigation = useNavigation();
    
    let gradeObjects = classes.map((period, i) => {
        let classSummary = {                                     // creates object to be used in the array of school classes (state)
            gradeLtr: period.Marks.Mark.CalculatedScoreString, 
            gradePct: period.Marks.Mark.CalculatedScoreRaw, 
            period: period.Period, 
            teacher: period.Staff
        };
        return(
            <TouchableOpacity 
                style = {gradeStyles.grade_display}
                activeOpacity = {0.5} 
                key = {i} 
                onPress={
                    () => { 
                        navigation.navigate('Class Details', {
                            periodNumber: i,
                            classInfo: classes[i],
                    });
                }
            }>
                <View style = {{flex: 1, flexDirection: 'row', justifyContent: 'center', paddingLeft: 15, paddingRight: 15}}>
                    <Text style = {gradeStyles.grade_letter}>{classSummary.gradeLtr}</Text> 
                    <View style = {gradeStyles.vertical_line}></View>
                    <Text style = {gradeStyles.grade_info}>{`Period ${classSummary.period}: ${classSummary.teacher}`}</Text>
                </View>
            </TouchableOpacity> 
        );
    });

    return (          
        gradeObjects.map(obj => {
            return (obj);
        })
    );
}

const Assignment = ({ index, name, data, navigation }) => (
    <Pressable
            data = {data}
            onPress={() => {
                navigation.navigate('Assignment Details', {
                    index: index,
                    details: data,
                    name: name
                })
            }}
            style={({ pressed }) => [
                {
                    opacity: pressed ? 0.5 : 1,
                },
                gradeStyles.button_wrapper
            ]
        }>
        <View style = {gradeStyles.assignmentDescriptionWrapper}>
            <Text style = {{fontFamily: 'Proxima Nova Bold', fontSize: 15}}>{name}</Text>
            <Text style = {{fontFamily: 'ProximaNova-Regular', fontSize: 10, alignSelf: 'flex-end', position: 'absolute', right: 0}}>{data.Points}</Text>
        </View>
    </Pressable>   
);

const ClassDetailsScreen = ({ route, navigation }) => {
    const { periodNumber, classInfo } = route.params;
    const [isDropped, setIsDropped] = useState(false);

    let gradeSummary = classInfo.Marks.Mark.GradeCalculationSummary.AssignmentGradeCalc;
    let isOneWeight = !Array.isArray(gradeSummary);                                      // if there is only one weight, then the array is undefined, so we need to check for that
    let tmpTotalPct = parseFloat(classInfo.Marks.Mark.CalculatedScoreRaw).toFixed(2);    // rounds total percent to 2 decimal places

    const [categoryData, setCategoryData] = useState(isOneWeight ? tmpTotalPct : gradeSummary);
    const [totalPct, setPct] = useState(tmpTotalPct);
    
    let labels, classValues; // for the bar chart
    if(!isOneWeight) {
        labels = categoryData.map(data => {
            let words = data.Type.split(' ');
            let capitalized = '';
            if(words.length > 1) {
                for(let i=0; i<words.length-1; i++) {
                    capitalized += words[i][0].toUpperCase() + words[i].substring(1).toLowerCase() + ' '; 
                }
            }
            let lastWord = words[words.length - 1];
            capitalized += lastWord[0].toUpperCase() + lastWord.substring(1).toLowerCase();
            return capitalized;
        });

        
        classValues = categoryData.map(data => {
            return parseFloat(data.WeightedPct.substring(0, data.WeightedPct.length - 1));
        });
    } else {
        labels = ['Total'];
        classValues = [totalPct];
    } 

    const [graphData, setGraphData] = useState({ labels: labels, datasets: [{ data: classValues }, { data: [40, 40, 20, 100]}] });
    
    const assignments = classInfo.Marks.Mark.Assignments.Assignment;

    const renderItem = ({ item, index }) => {
        let name = item.Measure;
        return (
            <Assignment 
                index = {index}
                name = {name}
                data = {item}
                navigation = {navigation}
            />
        );
    }

    return (
        <SafeAreaView style={gradeStyles.container}>
            <View style={{flex: 1, flexDirection: "column", alignItems: "flex-start", marginTop: 0, padding: 15,}}>
                <Text style={[{marginBottom: 10}, gradeStyles.info_header]}>
                    Period {parseInt(periodNumber)+1}: {classInfo.Title}
                </Text>
                <Text style={[gradeStyles.info_subheader, {marginBottom: 5}]}>
                    {totalPct}% {isDropped ? '\n' : null}
                </Text>
                <View style = {{width: '100%', height: isDropped ? 220 : 20}}>
                    <View style = {{flex: isDropped ? 1 : 0}}>
                        {/*bar graphs for weights in here*/}
                        {isDropped  
                            ? (
                                <BarChart
                                    data={graphData}
                                    width = {screenWidth - 30}
                                    height = {200}
                                    yAxisLabel = '%'
                                    chartConfig = {chartConfig}
                                />
                            ) 
                            : null
                        }
                    </View>
                    <Pressable 
                        style = {({pressed}) => [{opacity: pressed ? 0.5 : 1}, gradeStyles.dropdown_button]}
                        onPress = {() => {
                            setIsDropped(!isDropped); 
                        }}
                    >
                        <Image style = {[gradeStyles.image, {transform: [{rotate: isDropped ? '180deg' : '0deg'}]}]} source = {dropDownImg} />
                    </Pressable>
                </View>
                <View style={gradeStyles.horizontalDivider} />
                <View style = {{flex: 1, justifyContent: "center", width: "100%"}}>
                    <FlatList
                        data = {assignments}
                        renderItem = {(item, index) => renderItem(item, index)}
                        keyExtractor = {(item) => item.GradebookID}
                        style = {{ flex: 1, width: "100%" }}
                        extraData = {assignments}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const AssignmentDetailsScreen = ({ route, navigation }) => {
    const { details, name } = route.params;
    return (
        <View style={{ flex: 1, alignItems: "flex-start", justifyContent: "flex-start", marginLeft: 15, marginRight: 15, marginTop: 5 }}>
            <Text style = {[{marginBottom: 0}, gradeStyles.info_header]}>{name}:</Text>
            <Text style = {[gradeStyles.info_subheader, {fontSize: 15, marginTop: -2, marginBottom: 10, color: 'rgba(0, 0, 0, 0.75)'}]}>{details.Type}</Text>
            <Text style = {gradeStyles.info_subheader}>Score: {details.Points}</Text>
            <View style = {gradeStyles.horizontalDivider} />
            <AssignmentDetail detail = 'Description' data = {details.MeasureDescription === '' ? 'N/A' : details.MeasureDescription}></AssignmentDetail>
            <AssignmentDetail detail = 'Assign Date' data = {details.Date}></AssignmentDetail>
            <AssignmentDetail detail = 'Due Date' data = {details.DueDate}></AssignmentDetail>
            <AssignmentDetail detail = 'Notes' data = {details.Notes === '' ? 'N/A' : details.Notes}></AssignmentDetail>
        </View>
    )
}

const AssignmentDetail = ({detail, data}) => {
    return (
        <View style = {{width: '100%', minHeight: 30, marginTop: -10, marginBottom: 25}}>
            <Text style = {{fontFamily: 'Proxima Nova Bold', fontSize: 18}}>{detail}: </Text>
            <Text style = {{fontSize: 15, fontFamily: "ProximaNova-Regular"}}>{data}</Text>
        </View>
    ); 
}

const Stack = createStackNavigator();

function GradebookScreen(){
    return (
        <Stack.Navigator initialRouteName="GradeBook">
            <Stack.Screen 
                name="Gradebook" 
                component={GradebookPage} 
                options={{headerShown: false}}
            />
            <Stack.Screen 
                name="Class Details" 
                component={ClassDetailsScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen 
                name="Assignment Details" 
                component={AssignmentDetailsScreen} 
                options={{headerShown: false}}
            />
        </Stack.Navigator>
    );
}

const gradeStyles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
        padding: 15,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: swatch['s1'],
    },
    image: {
        flex: 1,
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    horizontalDivider: {
        borderBottomColor: swatch['s6'],
        borderBottomWidth: StyleSheet.hairlineWidth,
        width: "100%",
        marginTop: 15,
        marginBottom: 25,
    },
    vertical_line: {
        height: "70%",
        left: 100,
        alignSelf: "center",
        width: StyleSheet.hairlineWidth,
        backgroundColor: swatch['s4'],
        position: "absolute"
    },
    button_wrapper: {
        minHeight: 75,
        padding: 10,
        marginBottom: 15,
        width: "100%",
        flexDirection: "column",
        justifyContent: "center",
        borderRadius: 5,
        backgroundColor: "#EAEAEA",
    },
    grade_container: {
        height: "100%",
    },
    grade_display: {
        width: "100%",
        minHeight: 80,
        padding: 5,
        marginBottom: 15,
        borderRadius: 15,
        backgroundColor: swatch['s2'],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    grade_letter: {
        flex: 1,
        fontSize: 45,
        paddingBottom: 0,
        left: 18,
        color: swatch['s6'],
        fontFamily: "Proxima Nova Bold",
        textAlign: "left",
        textAlignVertical: "center",
    },
    grade_info: {
        flex: 4,
        color: swatch['s6'],
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
        paddingLeft: 45,
        flexWrap: "wrap",
        justifyContent: "center",
        textAlign: "left",
        textAlignVertical: "center",
    },
    info_header: {
        color: swatch['s6'],
        fontFamily: "Proxima Nova Extrabold",
        fontSize: 40,
    },
    info_subheader: {
        fontFamily: "Proxima Nova Bold",
        fontSize: 30,
        fontWeight: "300",
        color: `rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 1)`,
    },
    assignmentDescriptionWrapper: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },
    dropdown_button: {
        flex: 1,
        width: "100%",
        maxHeight: 20,
        marginBottom: -5,
        alignItems: "center",
    },
});

export default GradebookScreen;