import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useState, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Images} from '../../assets/Images/Images';
import StackHeader from '../../components/Header/StackHeader';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';
import {getBranding} from '../../Constants/api';

const Branding = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = useMemo(() => dynamicStyles(isDarkMode), [isDarkMode]);

  const [brandInfo, setBrandInfo] = useState({
    primaryColor: Colors.lightTheme.primaryColor,
    secondaryColor: Colors.lightTheme.secondryColor,
    logo: Images.artist1,
    appName: 'Biometric Pro',
    companyName: '',
    version: '1.0.0',
    lastUpdated: '2024-01-01',
  });

  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadBrandInfo = async () => {
        if (!isActive) return;

        setLoading(true);
        try {
          // Replace with actual company_id from your app state/params
          const company_id = 'your_company_id_here';
          const response = await getBranding(company_id);

          if (response?.ok) {
            const data = await response.json();
            setBrandInfo(prev => ({
              ...prev,
              primaryColor:
                data.data.primary_color || Colors.lightTheme.primaryColor,
              secondaryColor:
                data.data.secondary_color || Colors.lightTheme.secondryColor,
              logo: data.data.logo ? {uri: data.data.logo} : Images.artist1,
              appName: data.data.app_name || prev.appName,
              companyName: data.data.company_name || '',
              lastUpdated: data.data.updated_at || prev.lastUpdated,
            }));
          }
        } catch (error) {
          console.error('Error loading brand info:', error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      loadBrandInfo();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const ColorBox = useMemo(
    () =>
      ({color, label}) =>
        (
          <View style={styles.colorContainer}>
            <Text style={styles.colorLabel}>{label}</Text>
            <View style={[styles.colorBox, {backgroundColor: color}]} />
            <Text style={styles.colorValue}>{color}</Text>
          </View>
        ),
    [styles],
  );

  const ThemePreviewBox = useMemo(
    () =>
      ({theme, colors, label, isDark = false}) =>
        (
          <View
            style={[
              styles.themeBox,
              isDark ? styles.darkTheme : styles.lightTheme,
            ]}>
            <Text style={[styles.themeLabel, isDark && styles.darkText]}>
              {label}
            </Text>
            <View style={styles.themeColors}>
              {colors.map((color, index) => (
                <View
                  key={index}
                  style={[styles.themeColorDot, {backgroundColor: color}]}
                />
              ))}
            </View>
          </View>
        ),
    [styles],
  );

  const InfoRow = useMemo(
    () =>
      ({label, value}) =>
        (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ),
    [styles],
  );

  const lightThemeColors = [
    Colors.lightTheme.primaryColor,
    Colors.lightTheme.secondryColor,
    Colors.lightTheme.backgroundColor,
  ];

  const darkThemeColors = [
    Colors.darkTheme.primaryColor,
    Colors.darkTheme.secondryColor,
    Colors.darkTheme.backgroundColor,
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <StackHeader
          title={t('Branding')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('Loading...')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <StackHeader
          title={t('Branding')}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />

        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('App Logo')}</Text>
            <View style={styles.logoContainer}>
              <Image
                source={brandInfo.logo}
                style={styles.logoImage}
                resizeMode="contain"
                defaultSource={Images.artist1}
              />
            </View>
            <Text style={styles.appName}>{brandInfo.appName}</Text>
          </View>

          {/* Colors Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Brand Colors')}</Text>

            <ColorBox
              color={brandInfo.primaryColor}
              label={t('Primary Color')}
            />

            <ColorBox
              color={brandInfo.secondaryColor}
              label={t('Secondary Color')}
            />

            {/* Theme Colors Preview */}
            <View style={styles.themePreviewContainer}>
              <Text style={styles.themePreviewTitle}>{t('Theme Preview')}</Text>

              <View style={styles.themePreview}>
                <ThemePreviewBox
                  theme="light"
                  colors={lightThemeColors}
                  label={t('Light Theme')}
                />
                <ThemePreviewBox
                  theme="dark"
                  colors={darkThemeColors}
                  label={t('Dark Theme')}
                  isDark
                />
              </View>
            </View>
          </View>

          {/* Brand Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Brand Information')}</Text>
            <View style={styles.infoContainer}>
              <InfoRow
                label={t('Company Name')}
                value={brandInfo.companyName || t('Not set')}
              />
              <InfoRow label={t('App Version')} value={brandInfo.version} />
              <InfoRow
                label={t('Last Updated')}
                value={brandInfo.lastUpdated}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Branding;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    scrollContent: {
      flexGrow: 1,
    },
    contentContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
    },
    section: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      marginBottom: hp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : '#f8f9fa',
      borderRadius: wp(3),
      marginBottom: hp(1),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    logoImage: {
      width: wp(25),
      height: wp(25),
      borderRadius: wp(2),
    },
    appName: {
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      marginTop: hp(0.5),
    },
    colorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : '#f8f9fa',
      padding: wp(3.5),
      borderRadius: wp(2),
      marginBottom: hp(1.5),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    colorLabel: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
    },
    colorBox: {
      width: wp(7),
      height: wp(7),
      borderRadius: wp(1.5),
      marginHorizontal: wp(2.5),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    colorValue: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
      textAlign: 'right',
    },
    themePreviewContainer: {
      marginTop: hp(2),
    },
    themePreviewTitle: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1.5),
    },
    themePreview: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: wp(2),
    },
    themeBox: {
      flex: 1,
      padding: wp(3),
      borderRadius: wp(2),
      minHeight: hp(8),
      justifyContent: 'center',
    },
    lightTheme: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: Colors.lightTheme.BorderGrayColor,
    },
    darkTheme: {
      backgroundColor: Colors.darkTheme.backgroundColor,
      borderWidth: 1,
      borderColor: Colors.darkTheme.BorderGrayColor,
    },
    themeLabel: {
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsMedium,
      color: Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      marginBottom: hp(1),
    },
    darkText: {
      color: Colors.darkTheme.primaryTextColor,
    },
    themeColors: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: wp(1),
    },
    themeColorDot: {
      width: wp(3.5),
      height: wp(3.5),
      borderRadius: wp(1.75),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    infoContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : '#f8f9fa',
      borderRadius: wp(2),
      padding: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoLabel: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    infoValue: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'right',
      flex: 1,
      marginLeft: wp(2),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
