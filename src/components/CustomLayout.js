import React from 'react';
import { Keyboard,  ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../Constants/themeColors';

const CustomLayout = ({ children, customStyle }) => {
    const { isDarkMode } = useSelector(store => store.theme);


    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors.transparent ,
            // backgroundColor:  'green'
        }
    });
    return (
        <View style={[styles.container, customStyle]}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView 
                    style={{ backgroundColor: Colors.transparent }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'>
                    {children}
                </ScrollView>
            </TouchableWithoutFeedback>
        </View>
    );
};



export default CustomLayout;
