import React from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/core';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
} from 'react-native';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const SplashScreen = ({ navigation }) => {
const textOpacity = useSharedValue(0);
  const textSize = useSharedValue(55);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(250);

  const footerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(`rgba(255, 255, 255, ${cardOpacity.value})`, {duration: 400}),
      transform: [{translateY: withTiming(cardY.value, {duration: 800, easing: Easing.bezier(0.5, 0.01, 0, 1)})}],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(textOpacity.value, {duration: 400}),
      fontSize: withTiming(textSize.value, {duration: 850, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
    };
  });

  useFocusEffect(
    React.useCallback(() => {
      textSize.value = 55;
      textOpacity.value = 1;
      setTimeout(() => {
        cardOpacity.value = 1;
        cardY.value = 0;
      }, 150);

      return () => {
        textSize.value = 45;
        textOpacity.value = 0;
        cardOpacity.value = 0;
        cardY.value = 250;
      }
    }, [])
  );

  return (
    <View
    style={{
      flex: 1,
      flexDirection: 'column',
      backgroundColor: '#7FB685'
    }}>
    <View style={{flex: 3, alignItems: 'center', justifyContent: 'center'}}>
      <Animated.Text style={[{color: 'white', fontWeight: 'bold', fontSize: 55}, textStyle]}>Welcome!</Animated.Text>
    </View>
    <Animated.View 
      style={[
        {flex: 2, backgroundColor: 'rgba(255, 255, 255, 0)', borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center', justifyContent: 'center'},
        footerStyle,
      ]}>
        <Button title='Sign In!' onPress={() => navigation.navigate('Login')} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        flexDirection: "column",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
    },
    signIn_button: {
        height: 60,
        marginTop: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: "100%",
        backgroundColor: "#EAEAEA",
        borderRadius: 5,
    }
});

export default SplashScreen;
