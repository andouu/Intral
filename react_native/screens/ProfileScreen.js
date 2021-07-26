import React, { useEffect, useState, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getStudentInfo } from '../components/api.js';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {
    StyleSheet,
    Dimensions,
    View,
    Text,
    Image,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    PixelRatio,
} from 'react-native';
import {
    LineChart,
} from 'react-native-chart-kit';
import GoogleIcon from 'react-native-vector-icons/MaterialIcons'
import { swatch, swatchRGB, toRGBA } from '../components/theme'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const profPicSize = 50;

const data = {
    labels: ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
        {
        data: [3.8, 3.4, 3.0, 3.2, 3.8, 3.5, 4.0, 3.9, 3.4, 4.0], // TODO: get actual GPAs per month/day
        color: (/* opacity = 1 */) => `rgba(${swatchRGB.s3.r}, ${swatchRGB.s3.g}, ${swatchRGB.s3.b}, 1)`,
        strokeWidth: 3 // optional
        }
    ],
};

function* yLabel() {                                 // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
    yield* ['0.00', '1.00', '2.00', '3.00', '4.00']; // https://stackoverflow.com/questions/63905403/how-to-change-the-y-axis-values-from-numbers-to-strings-in-react-native-chart-ki
}

const credentials = require('../credentials.json') // WARNING: temporary solution

const username = credentials.username // temporary for testing, authentication isn't up yet
const password = credentials.password

const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}

const Header = ({ studentInfo }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.optionsBar}>
            <View style={styles.menu_button}>
                <MaterialDesignIcons.Button 
                    underlayColor={toRGBA(swatchRGB.s4, 0.5)}
                    activeOpacity={0.5}
                    right={2}
                    bottom={4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius = {80}
                    name='menu' 
                    color={toRGBA(swatchRGB.s4, 0.5)} 
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
    );
}

const Card = ({ customStyle, outlined=false, children }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                minHeight: 150,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: outlined ? 'transparent' : swatch.s2,
                borderRadius: 30,
                borderWidth: outlined ? 1.5 : 0,
                borderColor: outlined ? swatch.s2 : 'transparent',
                padding: 10,
                marginBottom: 20,
            },
        });
    }
    const cardStyle = getStyle();
    const widthDP = widthPctToDP('100%', 0);
    return (
        <View style={[cardStyle.card, customStyle]}>
            {children ? React.Children.map(children, child => {
                if(React.isValidElement(child)) {
                    return (
                        React.cloneElement(child, {width: widthDP, height: customStyle.height})
                    )
                }
            }) : null}
        </View>
    );
}

const CustomLineChart = ({ width, height }) => {
    const chartConfig = {
        backgroundGradientFrom: swatch.s1,
        backgroundGradientTo: swatch.s1,
        backgroundGradientFromOpacity: 1,
        backgroundGradientToOpacity: 1,
        fillShadowGradient: swatch.s3,
        fillShadowGradientOpacity: 0.5,
        color: () => swatch.s4,
        propsForBackgroundLines: {
            stroke: toRGBA(swatchRGB.s6, 0.25),
            strokeWidth: 1.5,
            strokeDasharray: '0',
            strokeDashoffset: null,
        },
        propsForLabels: {
            fontFamily: 'ProximaNova-Regular',
            fill: swatch.s5,
            fontSize: '10',
        },
        useShadowColorFromDataset: false // optional
    };
    
    const yLabelIterator = yLabel();

    let hiddenPoints = [];
    for(let i=0; i<data.datasets[0].data.length-1; i++) {
        hiddenPoints.push(i);
    }

    return (
        <View style={{left: -15, width: '100%', alignItems: 'center', justifyContent: 'center'}}>
            <LineChart
                data={data}
                fromZero={true}
                formatXLabel={(month) => month.substr(0, 3)}
                formatYLabel={() => yLabelIterator.next().value}
                withDots={true}
                getDotColor={(dataPoint, dataPointIndex) => dataPointIndex === data.datasets[0].data.length-1 ? swatch.s3 : 'transparent'}
                width={width}
                height={height}
                chartConfig={chartConfig}
                withInnerLines={false}
                withOuterLines={true}
                yAxisInterval={1.0}
                segments={4}
                bezier // optional, but sexy 😎
            />
        </View>
    )
}

const ChangeTypeIcon = ({ type, size }) => {
    let iconName;
    let iconColor;
    let iconSize = size;

    switch(type) {
        case 'Added':
            iconName = 'add';
            iconColor = '#04cc47'
            break;
        case 'Removed':
            iconName = 'remove';
            iconColor = '#ff3b3b'
            break;
        case 'Changed':
            iconName = 'edit';
            iconColor = '#7733ff';
            iconSize *= 0.75;  // the changed icon is too big
            break;
        default:
            iconName = 'add';
            break;
    }
    return (
        <View style={[styles.typeIcon, {width: size, height: size}]}>
            <GoogleIcon name={iconName} size={iconSize * 0.75} color={iconColor} />
            {/* TODO: Add a 'goto' icon here (for added and changed events only), that will navigate to the page in the gradebook when pressed */}
        </View>
    )
}

const ChangeEvent = ({ data }) => {
    const type = data.eventType[0].toUpperCase() + data.eventType.substr(1);
    let typeText = '';
    if(type !== 'Changed') {
        typeText = data.assignment.Type;
    } else {
        changes = data.assignment.changes;
        if(changes.length > 1) {
            for(let i=0; i<changes.length-1; i++) {
                typeText += changes[i] + ', ';
            }
        }
        typeText += changes[changes.length-1];
    }

    return (
        <View style={styles.changeEventCardContainer}>
            <View style={styles.changeEventCardLeft}>
                <ChangeTypeIcon type={type} size={50} />
            </View>
            <View style={styles.changeEventCardRight}>
                <View style={{flex: 1}}>
                    <Text style={styles.changeEventMainText}>
                        P{data.period+1}
                        <Text style={styles.changeEventMainSubtext}>{type}:</Text>
                    </Text>
                    <Text style={styles.assignmentDetail}>
                        {data.assignment.Measure}{' '}
                        <Text style={styles.assignmentType}>
                            [{ typeText }]
                        </Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}

const HomePage = () => {
    const [studentInfo, setStudentInfo] = useState([]);
    const [gradeChanges, setGradeChanges] = useState([]);
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
            let changesJSON = await AsyncStorage.getItem('gradebookChanges');
            let changesParsed = await JSON.parse(changesJSON);
            setGradeChanges(changesParsed);
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

    let getChangeObjs = () => {
        let objArr = [];
        for(let key in gradeChanges) {
            let arr = gradeChanges[key];
            arr.forEach(period => { 
                period.assignments.forEach(assignment => {
                    objArr.push(
                        <ChangeEvent 
                            key={assignment.GradebookID} 
                            data={{
                                period: period.period,
                                eventType: key,
                                assignment: assignment
                            }} 
                        />
                    )
                })
            })
        }
        return objArr;
    }

    let changes = getChangeObjs();
    
    const calcGpaDelta = (data) => {
        let dataArr = data.datasets[0].data;
        if(dataArr.length >= 2) {
            let latestMonth = dataArr[dataArr.length-1];
            let secondLatestMonth = dataArr[dataArr.length-2];
            if(latestMonth === secondLatestMonth)
                return 0;
            return ((latestMonth / secondLatestMonth - 1) * 100).toFixed(0);
        }
        return null;
    }
    const gpaDelta = calcGpaDelta(data);
    const pctColor = (gpaDelta > 0) ? swatch.s10 : (gpaDelta < 0) ? swatch.s11 : swatch.s5
    const deltaChar = (gpaDelta > 0) ? '+' : ''

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
            <Header studentInfo={studentInfo} />
            <View style = {styles.main_container}>
                <Text style={styles.header_text}>Hi {studentInfo.StudentInfo.FormattedName.split(' ')[0]}!</Text>
                <Text style={styles.cardHeader_text}>
                    Your GPA Growth Overview:{'  '}
                    <Text style={{color: pctColor}}>
                        {deltaChar}{gpaDelta}%
                    </Text>
                </Text>
                <Card 
                    customStyle={{
                        width: '100%',
                        height: 200,
                        padding: 0,
                        borderColor: 'transparent',
                    }}
                    outlined={false}
                >
                    <CustomLineChart />               
                </Card>
                <Text style={styles.cardHeader_text}>Latest Updates:</Text>
                <Card customStyle={{padding: 15, paddingTop: 10, paddingBottom: 10, minHeight: 400, borderColor: toRGBA(swatchRGB.s2, 1)}} outlined={true}>
                    { changes }
                </Card>
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
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: swatch.s2,
        borderRadius: 30,
        padding: 10,
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
        borderColor: toRGBA(swatchRGB.s4, 0.5),
    },
    header_text: {
        color: swatch['s6'],
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
        left: 2,
        marginBottom: 20,
    },
    cardHeader_text: {
        color: swatch.s4,
        fontFamily: 'Proxima Nova Bold',
        fontSize: 20,
        marginBottom: 15,
        left: 2,
    },
    changeEventCardContainer: {
        flexDirection: 'row',
        width: '100%', 
        minHeight: 115, 
        marginTop: 5, 
        marginBottom: 5,
        borderRadius: 15,
        justifyContent: 'center', 
        backgroundColor: toRGBA(swatchRGB.s2, 0.35),
    },
    changeEventCardLeft: {
        flex: 1.5, 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderTopLeftRadius: 15,
        borderBottomLeftRadius: 15, 
    },
    changeEventCardRight: {
        flex: 3, 
        padding: 10, 
        paddingTop: 5, 
        paddingBottom: 5,
        marginRight: 10,
        justifyContent: 'center',
    },
    changeEventMainText: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 80,
        textAlignVertical: 'center',
        color: swatch.s6,
    },
    changeEventMainSubtext: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 23,
        textAlignVertical: 'center',
        color: swatch.s5,
    },
    assignmentDetail: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 18,
        color: swatch.s6,
        bottom: 10,
    },  
    assignmentType: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
        color: swatch.s4,
    }, 
    typeIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 40, 
        backgroundColor: toRGBA(swatchRGB.s2, 0.4),
    },
});

export default ProfileScreen;