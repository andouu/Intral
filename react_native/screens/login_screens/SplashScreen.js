import React, { useContext } from 'react';
import { useFocusEffect } from '@react-navigation/core';
import {
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import { ThemeContext } from '../../components/themeContext';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const SplashScreen = ({ navigation }) => {
  const themeContext = useContext(ThemeContext);
  const theme = themeContext.themeData.swatch;
  const textOpacity = useSharedValue(0);
  const textSize = useSharedValue(55);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(250);

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(textOpacity.value, {duration: 1000}),
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
    <LinearGradient colors={[theme.s1, theme.s1, theme.s14]}
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <View style={{flex: 3, alignItems: 'center', justifyContent: 'center'}}>
        <Animated.Text style={[{color: 'white', fontWeight: 'bold', fontSize: 55}, textStyle]}>Welcome</Animated.Text>
      </View>
      <Animated.View 
        style={[
          {flex: 2, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: 'center', justifyContent: 'center'},
        ]}>
        <Pressable style={[styles.signIn_button, {color: theme.s6}]} onPress={() => navigation.navigate('Login')}>
          <Animated.Text style={styles.text}>Tap to Sign In </Animated.Text>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
};


const styles = StyleSheet.create ({
    container: {
        flex: 1,
        flexDirection: "column",
        width: "50%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
    },
    signIn_button: {
        width: "45%",
        height: 65,
        marginTop: 10,
        marginHorizontal: 500,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        fontFamily: 'Proxima Nova Bold',
    },
    text: {
        fontSize: 20,
        lineHeight: 60,       
        color: 'rgb(247,248,249)',
        fontFamily: 'Proxima Nova Bold',
    
    },
});


export default SplashScreen;
