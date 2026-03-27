import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';
import { useSelector } from 'react-redux';
import { Colors } from '../../Constants/themeColors';

const BarChartForWorker = () => {
      const { isDarkMode } = useSelector((store) => store.theme);
      const styles = dynamicStyles(isDarkMode);
    const barData = [
        {
          value: 40,
          label: 'Jan',
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: {color: 'gray'},
          frontColor: '#4BCE97',
        },
        {value: 20, frontColor: '#579DFF'},
        {
          value: 50,
          label: 'Feb',
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: {color: 'gray'},
          frontColor: '#4BCE97',
        },
        {value: 40, frontColor: '#579DFF'},
        {
          value: 75,
          label: 'Mar',
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: {color: 'gray'},
          frontColor: '#4BCE97',
        },
        {value: 25, frontColor: '#579DFF'},
        {
          value: 30,
          label: 'Apr',
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: {color: 'gray'},
          frontColor: '#4BCE97',
        },
        {value: 20, frontColor: '#579DFF'},
        {
          value: 60,
          label: 'May',
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: {color: 'gray'},
          frontColor: '#4BCE97',
        },
        {value: 40, frontColor: '#579DFF'},
        {
          value: 65,
          label: 'Jun',
          spacing: 2,
          labelWidth: 30,
          labelTextStyle: {color: 'gray'},
          frontColor: '#4BCE97',
        },
        {value: 30, frontColor: '#579DFF'},
      ];

      const renderTitle = () => {
          return(
            <View style={{marginVertical: 30}}>
            <Text
              style={{
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              Chart title goes here
            </Text>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                marginTop: 24,
                backgroundColor: 'yellow',
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View
                  style={{
                    height: 12,
                    width: 12,
                    borderRadius: 6,
                    backgroundColor: '#4BCE97',
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    width: 60,
                    height: 16,
                    color: 'lightgray',
                  }}>
                  Point 01
                </Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View
                  style={{
                    height: 12,
                    width: 12,
                    borderRadius: 6,
                    backgroundColor: '#579DFF',
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    width: 60,
                    height: 16,
                    color: 'lightgray',
                  }}>
                  Point 02
                </Text>
              </View>
            </View>
          </View>
          )
      }

    return (
        <View
        style={styles.container}>
        {/* {renderTitle()} */}
        <BarChart
          data={barData}
          barWidth={8}
          spacing={24}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{color: 'gray'}}
          noOfSections={3}
          maxValue={75}
        />
      </View>
    );
};
export default BarChartForWorker

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
    //   backgroundColor: isDarkMode? Colors.darkTheme.backgroundColor : Colors.lightTheme.backgroundColor,
      paddingBottom: 40,
      borderRadius: 10,
    },
  })
