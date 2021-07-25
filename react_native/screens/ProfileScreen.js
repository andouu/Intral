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

import { swatch, swatchRGB, toRGBA } from '../components/theme'; 

const profPicSize = 50;

const data = {
    labels: ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
        {
        data: [2.5, 3.4, 3.0, 2.8, 3.8, 3.5, 4.0, 3.9, 3.4, 4.0], // TODO: get actual GPAs per month/day
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
                    underlayColor={`rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`}
                    activeOpacity={0.5}
                    right={2}
                    bottom={4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius = {80}
                    name='menu' 
                    color={swatch.s4} 
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

const Card = ({ style, outlined=false, children }) => {
    const getStyle = (style) => {
        return StyleSheet.create({
            card: {
                width: style.width ? style.width : '100%',
                height: style.height ? style.height : 150,
                alignItems: style.alignItems ? style.alignItems : 'center',
                justifyContent: style.justifyContent ? style.justifyContent : 'center',
                backgroundColor: outlined ? 'transparent' : (style.backgroundColor ? style.backgroundColor : swatch.s2),
                borderRadius: style.borderRadius ? style.borderRadius : 30,
                borderWidth: outlined ? (style.borderWidth ? style.borderWidth : 1.5) : 0,
                borderColor: outlined ? (style.borderColor ? style.borderColor : swatch.s4) : 'transparent',
                padding: style.padding ? style.padding : 10,
                marginBottom: style.marginBottom ? style.marginBottom : 10,
            },
        });
    }
    const cardStyle = getStyle(style);
    const widthDP = widthPctToDP(style.width, 0);
    return (
        <View style={cardStyle.card}>
            {React.Children.map(children, child => {
                if(React.isValidElement(child)) {
                    return (
                        React.cloneElement(child, {width: widthDP, height: style.height})
                    )
                }
            })}
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

const HomePage = () => {
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
            <Header studentInfo={studentInfo} />
            <View style = {styles.main_container}>
                <Text style={styles.header_text}>Hi {studentInfo.StudentInfo.FormattedName.split(' ')[0]}!</Text>
                <Text style={styles.cardHeader_text}>GPA Growth Overview:</Text>
                <Card 
                    style={{
                        width: '100%',
                        height: 200,
                        padding: 0,
                        borderColor: 'transparent',
                    }}
                    outlined={false}
                >
                    <CustomLineChart />               
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
        borderColor: `rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`,
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
});

export default ProfileScreen;