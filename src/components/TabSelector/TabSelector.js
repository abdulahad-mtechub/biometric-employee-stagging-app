import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP,
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useButtonColors} from '../../Constants/colorHelper';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';

const TabSelector = ({
  tabs = [],
  selectedTab,
  onTabPress,
  isScrollable = false,
  alignTabsLeft = false,
}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const styles = dynamicStyles(isDarkMode, primaryButtonColors);

  const scrollRef = useRef();
  const tabRefs = useRef([]);
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const [measured, setMeasured] = useState(false);
  const [tabMeasurements, setTabMeasurements] = useState([]);

  useEffect(() => {
    if (!isScrollable || !measured || tabs.length === 0) return;

    const index = tabs.indexOf(selectedTab);
    const ref = tabRefs.current[index];

    if (ref && scrollRef.current) {
      ref.measureLayout(
        scrollRef.current,
        (x, y, width) => {
          // Animate underline
          Animated.timing(underlineX, {
            toValue: x,
            duration: 200,
            useNativeDriver: false,
          }).start();
          Animated.timing(underlineWidth, {
            toValue: width,
            duration: 200,
            useNativeDriver: false,
          }).start();

          // Scroll the tab into view (optional but useful)
          scrollRef.current.scrollTo({
            x: Math.max(0, x - wp(10)), // center-ish
            animated: true,
          });
        },
        error => console.error('measureLayout error:', error),
      );
    }
  }, [selectedTab, measured]);

  const renderTabs = () =>
    tabs.map((tab, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => onTabPress(tab)}
        style={[
          isScrollable ? styles.scrollableTab : styles.fixedTab,
          selectedTab === tab && styles.activeTab,
          alignTabsLeft && !isScrollable && styles.leftAlignedTab,
        ]}
        ref={ref => (tabRefs.current[index] = ref)}
        onLayout={event => {
          if (alignTabsLeft && !isScrollable) {
            const {x, width} = event.nativeEvent.layout;
            const newMeasurements = [...tabMeasurements];
            newMeasurements[index] = {x, width};
            setTabMeasurements(newMeasurements);
          }
        }}>
        <Text
          numberOfLines={1}
          style={[
            styles.tabText,
            selectedTab === tab && styles.activeText,
            {},
          ]}>
          {tab}
        </Text>
      </TouchableOpacity>
    ));

  useEffect(() => {
    if (isScrollable) setMeasured(false);
  }, [tabs]);

  return (
    <>
      {isScrollable ? (
        <View style={{marginVertical: wp(1.5)}}>
          <ScrollView
            horizontal
            ref={scrollRef}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContainer}
            onContentSizeChange={() => setMeasured(true)}>
            {renderTabs()}
            <Animated.View
              style={[
                styles.activeLine,
                {
                  width: underlineWidth,
                  transform: [{translateX: underlineX}],
                  bottom: 5,
                },
              ]}
            />
          </ScrollView>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.tabContainer,
              alignTabsLeft && styles.leftAlignedContainer,
            ]}>
            {renderTabs()}
          </View>
          <View style={styles.underlineContainer}>
            <View style={styles.inactiveLine} />
            <View
              style={[
                styles.activeLine,
                alignTabsLeft
                  ? {
                      left: tabMeasurements[tabs.indexOf(selectedTab)]?.x || 0,
                      width:
                        tabMeasurements[tabs.indexOf(selectedTab)]?.width *
                          0.6 || wp(15), // 60% of tab width for smaller underline
                      transform: [
                        {
                          translateX:
                            tabMeasurements[tabs.indexOf(selectedTab)]?.width *
                              0.2 || wp(2), // Center the smaller underline
                        },
                      ],
                    }
                  : {
                      left: `${
                        (tabs.indexOf(selectedTab) / tabs.length) * 100
                      }%`,
                      width: `${100 / tabs.length}%`,
                    },
              ]}
            />
          </View>
        </>
      )}
    </>
  );
};

const dynamicStyles = (isDarkMode, primaryButtonColors) =>
  StyleSheet.create({
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: hp(1.5),
      paddingBottom: hp(0.7),
      marginHorizontal: wp(2),
    },
    leftAlignedContainer: {
      justifyContent: 'center',
    },
    tabScrollContainer: {
      paddingTop: hp(1.5),
      paddingBottom: hp(0.7),
    },
    fixedTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftAlignedTab: {
      flex: 0,
      minWidth: wp(20),
      paddingHorizontal: wp(4),
      marginRight: wp(2),
    },
    scrollableTab: {
      paddingHorizontal: wp(4),
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: wp(28),
    },
    tabText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(1.8),
      textAlign: 'center',
      marginBottom: 5,
    },
    activeText: {
      color: primaryButtonColors.backgroundColor,
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.8),
    },
    underlineContainer: {
      position: 'relative',
      height: 2,
      marginHorizontal: wp(1),
    },
    inactiveLine: {
      position: 'absolute',
      width: '100%',
      height: 3,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    activeLine: {
      position: 'absolute',
      height: heightPercentageToDP(0.5),
      backgroundColor: primaryButtonColors.backgroundColor,
      bottom: 0,
    },
    scrollUnderlineContainer: {
      height: 1,
      marginTop: -3,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      position: 'relative',
    },
  });

export default TabSelector;
