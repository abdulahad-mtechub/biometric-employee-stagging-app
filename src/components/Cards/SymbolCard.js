import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Fonts } from "../../Constants/Fonts";
import { Colors } from "../../Constants/themeColors";
import { Svgs } from "../../assets/Svgs/Svgs";
import { useSelector } from "react-redux";
import { Symbols } from "../../Constants/DummyData";
import { useTranslation } from "react-i18next";
import { pxToPercentage } from "../../utils/responsive";

const SymbolCard = ({ theme = false, heading, title, array, contianerStyle }) => {
  const colors = Colors[theme ? "darkTheme" : "lightTheme"];
  const { t } = useTranslation();
  const { isDarkMode } = useSelector((store) => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const { icon, backgroundColor, subTextIcon } = Symbols[title] || {
    icon: <Svgs.alertWhite height={hp(6)} width={hp(6)} />,
    backgroundColor: "#9CA3AF",
  };

  return (
    <View style={[styles.cardContainer, contianerStyle]}>
      <Text style={[styles.title]}>{t(heading)}</Text>
      <View style={styles.divider} />

      <View style={styles.symbolsContainer}>
        {array?.map((item, index) => (
          <View style={[styles.symbolRow, {width: array.length === 3 ? '30%' : '48%'}]} key={index}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: Symbols[item]?.backgroundColor || "#9CA3AF" },
              ]}
            >
              {Symbols[item]?.icon || (
                <Svgs.alertWhite height={hp(6)} width={hp(6)} />
              )}
            </View>
            <Text style={[styles.symbolText, {}]}>{t(item)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    cardContainer: {
      padding: wp(4),
      borderRadius: wp(3),
      borderWidth: 1,
      marginVertical: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    title: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginBottom: hp(2),
    },
    symbolsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      //   width: "70%",
    },
    symbolRow: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: hp(2),
    },
    iconWrapper: {
      height: hp(3.5),
      width: hp(3.5),
      borderRadius: hp(2.25),
      alignItems: "center",
      justifyContent: "center",
      marginRight: wp(3),
    },
    symbolText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
  });

export default SymbolCard;
