import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useIsFocused, useNavigation, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { getGrades } from '../components/api.js';
import dropDownImg from '../assets/images/icons8-expand-arrow.gif';
import { ThemeContext } from '../components/themeContext';
import { toRGBA } from '../components/utils';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons'
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

function* percentageLabel() {
    yield* ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'];
}

const Header = ({ theme, type }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.optionsBar}>
            <View style={[styles.menu_button, {borderColor: toRGBA(theme.s4, 0.5)}]}>
                <MaterialDesignIcon.Button 
                    underlayColor={toRGBA(theme.s4, 0.5)}
                    activeOpacity={0.5}
                    right={type === 'graph' ? 0 : 4}
                    bottom={type === 'graph' ? 0 : 4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius = {80}
                    name={type === 'graph' ? 'chart-line' : 'arrow-left'} // only takes two types for now, 'menu' and 'back' 
                    color={theme.s4} 
                    size={type === 'graph' ? 26 : 35}
                    backgroundColor='transparent'
                    onPress={() => type === 'graph' ? navigation.navigate('Class Analyses') : navigation.goBack()} 
                    style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                />
            </View>
        </View>
    );
}

const GradebookHomeScreen = () => {
    const [isLoading, setIsLoading] = useState(true);  
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState([]);

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;
    
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
    
    const logDiff = (diff) => { // for debugging purposes (assignment differences)
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
            let pull = await getGrades(username, password, quarter);  // pulls data from api asyncronously from api.js]
            let difference = [];
            if(classes !== []) {
                let storedClasses = await AsyncStorage.getItem('classes');
                let prev = JSON.parse(storedClasses); // parse storage pull
                if (Array.isArray(prev)) {
                    difference = findDifference(prev, /* pull */ dummyAddRemove);  // compare to simulated data for added, removed, and modified (ie. pts. changed) assignments
                    // TODO replace above with let difference = findDifference(prev, pull); later

                    if(Object.keys(difference).length !== 0 && difference.constructor === Object) {  // check if there are any differences
                        await AsyncStorage.setItem('gradebookChanges', JSON.stringify(difference));  // save the difference to storage
                        await AsyncStorage.setItem('notifsSeen', JSON.stringify({ seen: false }));   // set the notifs warning to show in profile page everytime there are new changes
                        // send new push notifications here based on the differences
                    } else {
                        console.log('no changes');
                    }
                }
            }
            if(difference !== [])
                await AsyncStorage.setItem('classes', JSON.stringify(dummyAddRemove)); // temporary
            setClasses(pull);
            setIsLoading(false);
        } catch(err) {
            console.error(err);
        }
    }

    useEffect(async () => {                 
        await refreshClasses();
    }, []); // runs once (and saves to local async storage), user can manually refresh

    const onRefresh = useCallback(async() => { // refreshes class data when the user refreshes the screen
        setRefreshing(true);
        await refreshClasses();                // wait for the data to load before setting the refreshing state to false
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView style = {[styles.container, {backgroundColor: theme.s1}]}>
            {isLoading ? (
                <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}}>
                    <ActivityIndicator size = 'large' color = {theme.s4} />
                </View>
            ) : (
                <ScrollView 
                    style={styles.grade_container} 
                    contentContainerStyle = {{}}
                    refreshControl = {
                        <RefreshControl
                            refreshing = {refreshing}
                            onRefresh = {onRefresh}
                        />
                    }
                >
                    <Header theme={theme} type='graph' />
                    <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center', paddingTop: 10, paddingLeft: 15, paddingRight: 15}}>
                        <Text style={[styles.header_text, {color: theme.s6}]}>Your Gradebook:</Text>
                        <GradeBoxes classes={classes} theme={theme} />     
                    </View>
                </ScrollView>
            )}   
        </SafeAreaView>
    );
}

const GradeBoxes = ({ classes, theme }) => { 
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
                style = {[styles.grade_display, {backgroundColor: theme.s2}]}
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
                    <Text style = {[styles.grade_letter, {color: theme.s6}]}>{classSummary.gradeLtr}</Text> 
                    <View style = {[styles.vertical_line, {backgroundColor: theme.s4}]}></View>
                    <Text style = {[styles.grade_info, {color: theme.s6}]}>{`Period ${classSummary.period}: ${classSummary.teacher}`}</Text>
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

const Assignment = ({ index, name, data, navigation, theme }) => (
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
                    backgroundColor: theme.s2,
                    opacity: pressed ? 0.5 : 1,
                },
                styles.button_wrapper
            ]
        }>
        <View style = {styles.assignmentDescriptionWrapper}>
            <Text style = {{fontFamily: 'Proxima Nova Bold', fontSize: 20, color: toRGBA(theme.s6, 0.75), marginLeft: 0}}>{name}</Text>
            <Text style = {{fontFamily: 'ProximaNova-Regular', fontSize: 10, color: theme.s4, alignSelf: 'flex-end', position: 'absolute', right: 0}}>{data.Points}</Text>
        </View>
    </Pressable>   
);

const ClassDetailsScreen = ({ route, navigation }) => {
    const { periodNumber, classInfo } = route.params;
    const [isDropped, setIsDropped] = useState(false);
    
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

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

            // results in x axis labels that are too long
            
            // if(words.length > 1) { 
            //     for(let i=0; i<words.length-1; i++) {
            //         //capitalized += words[i][0].toUpperCase() + words[i].substring(1).toLowerCase() + ' ';   
            //     }
            // }
            // let lastWord = words[words.length - 1];
            // capitalized += lastWord[0].toUpperCase() + lastWord.substring(1).toLowerCase();
            if(words.length > 1) {
                let trim = words[0][0].toUpperCase() + words[0].substr(1) + ' ' + words[1][0].toUpperCase() + words[1].substr(1).trim() + '...';
                if(trim.length - 4 > 10)
                {
                    trim = trim.substr(0, 10).trim() + "...";
                }     
                return trim;
            } else if(words[0].length > 10) {
                return words[0].substr(0, 10).trim() + '...';
            }
            capitalized = words[0][0].toUpperCase() + words[0].substr(1);
            return capitalized;
        });

        classValues = categoryData.map(data => {
            return parseFloat(data.WeightedPct.substring(0, data.WeightedPct.length - 1)).toFixed(2);
        });
    } else {
        labels = ['Total'];
        classValues = [totalPct];
    } 

    const [graphData, setGraphData] = useState({ 
        labels: labels, 
        datasets: [{ 
            data: classValues, 
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            colors: [
                () => toRGBA(theme.s4, 0.5),
                () => toRGBA(theme.s3, 0.5),
                () => toRGBA(theme.s3, 0.5),
                () => toRGBA(theme.s3, 0.5),
            ]
            }, 
        ]
    });
    
    const assignments = classInfo.Marks.Mark.Assignments.Assignment;

    const chartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0,
        color: (/* opacity = 1 */) => toRGBA(theme.s4, 1),
        fillShadowGradient: theme.s3,
        fillShadowGradientOpacity: 0.75,
        strokeWidth: 2, 
        barPercentage: 0.75,
        decimalPlaces: 2,
        propsForBackgroundLines: {
            stroke: toRGBA(theme.s6, 0.25),
            strokeWidth: 1,
            strokeDasharray: '0',
            strokeDashoffset: null,
        },
        propsForLabels: {
            fontFamily: 'Proxima Nova Bold',
            fill: 'none',
            //stroke: theme.s4,
            fontSize: '10',
        },
        useShadowColorFromDataset: false, // optional
    };

    const renderItem = ({ item, index }) => {
        let name = item.Measure;
        return (
            <Assignment 
                index = {index}
                name = {name}
                data = {item}
                navigation = {navigation}
                theme={theme}
            />
        );
    }

    const percentageLabelIterator = percentageLabel();

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: theme.s1}]}>
            <Header theme={theme} type='back' />
            <View style={{flex: 1, flexDirection: "column", alignItems: "flex-start", marginTop: -10, paddingLeft: 15, paddingRight: 15}}>
                <Text style={[{marginBottom: 10, color: theme.s6}, styles.info_header]}>
                    Period {parseInt(periodNumber)+1}: {classInfo.Title}
                </Text>
                <Text style={[styles.info_subheader, {marginBottom: 5, color: theme.s4}]}>
                    {totalPct}% {isDropped ? '\n' : null}
                </Text>
                <View style = {{width: '100%', minHeight: isDropped ? 220 : 20, padding: 0}}>
                    <View style = {{flex: isDropped ? 1 : 0, alignItems: 'center'}}>
                        {/*bar graphs for weights in here*/}
                        {isDropped  
                            ? (
                                <BarChart
                                    data={graphData}
                                    width={screenWidth+10}
                                    height={220}
                                    fromZero={true}
                                    yAxisSuffix=''
                                    chartConfig={chartConfig}
                                    // withCustomBarColorFromData={true}
                                    showValuesOnTopOfBars={true}
                                    //segments={10}
                                    withInnerLines={false}
                                    flatColor={false}
                                    verticalLabelRotation={0}
                                />
                            ) 
                            : null
                        }
                    </View>
                    <Pressable 
                        style = {({pressed}) => [{opacity: pressed ? 0.5 : 1}, styles.dropdown_button]}
                        onPress = {() => {
                            setIsDropped(!isDropped); 
                        }}
                    >
                        {/* <Image style = {[styles.image, {transform: [{rotate: isDropped ? '180deg' : '0deg'}]}]} source = {dropDownImg} /> */}
                        <MaterialDesignIcon name={isDropped ? 'menu-up' : 'menu-down'} size={40} style={{bottom: isDropped ? -10 : 5}} color={theme.s4} />
                    </Pressable>
                </View>
                <View style={[styles.horizontalDivider, {borderBottomColor: theme.s4}]} />
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

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style={styles.container}>
            <Header theme={theme} type='back' />
            <View style={{paddingLeft: 15, paddingRight: 15, marginTop: -10, height: '100%'}}>
                <Text style = {[{marginBottom: 0, color: theme.s6}, styles.info_header]}>{name}:</Text>
                <Text style = {[styles.info_subheader, {fontSize: 15, marginTop: -2, marginBottom: 10, color: theme.s8}]}>{details.Type}</Text>
                <Text style = {[styles.info_subheader, {color: theme.s4}]}>Score: {details.Points}</Text>
                <View style = {[styles.horizontalDivider, {borderBottomColor: theme.s4}]} />
                <AssignmentDetail 
                    detail='Description' 
                    data={
                        details.MeasureDescription === '' 
                            ? 'N/A' 
                            : details.MeasureDescription
                    }
                />
                <AssignmentDetail 
                    detail='Assign Date' 
                    data={details.Date} 
                />
                <AssignmentDetail 
                    detail='Due Date' 
                    data={details.DueDate} 
                />
                <AssignmentDetail 
                    detail='Notes' 
                    data={
                        details.Notes === '' 
                        ? 'N/A' 
                        : details.Notes
                    }
                />
            </View>
        </View>
    )
}

const AssignmentDetail = ({detail, data}) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style = {{width: '100%', minHeight: 30, marginBottom: 25}}>
            <Text style = {{fontFamily: 'Proxima Nova Bold', fontSize: 25, color: theme.s6}}>{detail}: </Text>
            <Text style = {{fontSize: 20, fontFamily: 'ProximaNova-Regular', color: theme.s4}}>{data}</Text>
        </View>
    ); 
}

const ClassAnalysesScreen = ({ route, navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [classData, setClassData] = useState(null); 

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const onRefresh = () => {
        console.log('refreshing'); // TODO: get class data locally or from server
    }

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, [isLoading])

    return (
        <SafeAreaView style = {[styles.container, {backgroundColor: theme.s1}]}>
            {isLoading ? (
                <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}}>
                    <ActivityIndicator size = 'large' color = {theme.s4} />
                </View>
            ) : (
                <ScrollView 
                    style={styles.grade_container} 
                    contentContainerStyle = {{}}
                    refreshControl = {
                        <RefreshControl
                            refreshing = {isRefreshing}
                            onRefresh = {onRefresh}
                        />
                    }
                >
                    <Header theme={theme} type='back' />
                    <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center', paddingTop: 10, paddingLeft: 15, paddingRight: 15}}>
                        <Text style={[styles.header_text, {color: theme.s6}]}>Your Class Analyses:</Text>
                    </View>
                </ScrollView>
            )}   
        </SafeAreaView>
    )
}

const Stack = createStackNavigator();

const GradebookScreen = () => {
    return (
        <Stack.Navigator initialRouteName='GradeBook'>
            <Stack.Screen 
                name='Gradebook' 
                component={GradebookHomeScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen 
                name='Class Details' 
                component={ClassDetailsScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen 
                name='Assignment Details' 
                component={AssignmentDetailsScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen
                name='Class Analyses'
                component={ClassAnalysesScreen}
                options={{headerShown: false}}
            />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
    },
    image: {
        flex: 1,
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    horizontalDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        width: "100%",
        marginTop: 15,
        marginBottom: 15,
    },
    vertical_line: {
        height: "70%",
        left: 100,
        alignSelf: "center",
        width: StyleSheet.hairlineWidth,
        position: "absolute"
    },
    button_wrapper: {
        minHeight: 75,
        padding: 10,
        marginBottom: 15,
        width: "100%",
        flexDirection: "column",
        justifyContent: "center",
        borderRadius: 15,
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    header_text: {
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
        left: 2,
        marginTop: -10,
        marginBottom: 20,
    },
    grade_letter: {
        flex: 1,
        fontSize: 45,
        paddingBottom: 0,
        left: 18,
        fontFamily: "Proxima Nova Bold",
        textAlign: "left",
        textAlignVertical: "center",
    },
    grade_info: {
        flex: 4,
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
        paddingLeft: 45,
        flexWrap: "wrap",
        justifyContent: "center",
        textAlign: "left",
        textAlignVertical: "center",
    },
    info_header: {
        fontFamily: "Proxima Nova Extrabold",
        fontSize: 40,
    },
    info_subheader: {
        fontFamily: "Proxima Nova Bold",
        fontSize: 30,
        fontWeight: "300",
    },
    assignmentDescriptionWrapper: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    dropdown_button: {
        flex: 1,
        width: "100%",
        maxHeight: 40,
        marginBottom: -5,
        alignItems: "center",
        justifyContent: "center",
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
});

export default GradebookScreen;