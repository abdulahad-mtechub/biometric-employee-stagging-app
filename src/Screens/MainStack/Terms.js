import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {WebView} from 'react-native-webview';
import {useTranslation} from 'react-i18next';
import StackHeader from '../../components/Header/StackHeader';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {useSelector} from 'react-redux';
import {getTermsAndConditions} from '../../Constants/api';
import {useAlert} from '../../Providers/AlertContext';

const TermsAndConditions = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {i18n, t} = useTranslation();
  const {showAlert} = useAlert();
  const styles = dynamicStyles(isDarkMode);

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTermsAndConditions();
  }, [i18n.language]);

  const fetchTermsAndConditions = async () => {
    try {
      setLoading(true);
      const response = await getTermsAndConditions();

      if (response?.error === false && response?.data) {
        // Use Spanish content if language is Spanish, otherwise use English
        const htmlContent =
          i18n.language === 'es'
            ? response.data.content_es
            : response.data.content;
        setContent(htmlContent);
      } else {
        showAlert(
          response?.message || t('Failed to load terms and conditions'),
          'error',
        );
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      showAlert(t('Failed to load terms and conditions'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getHtmlContent = () => {
    const backgroundColor = isDarkMode
      ? Colors.darkTheme.backgroundColor
      : Colors.lightTheme.backgroundColor;
    const textColor = isDarkMode
      ? Colors.darkTheme.primaryTextColor
      : Colors.lightTheme.primaryTextColor;
    const secondaryTextColor = isDarkMode
      ? Colors.darkTheme.secondryTextColor
      : Colors.lightTheme.secondryTextColor;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: ${backgroundColor};
              color: ${textColor};
              padding: 16px;
              font-size: 15px;
              line-height: 1.6;
            }
            h1, h2, h3, h4, h5, h6 {
              color: ${textColor};
              margin-top: 24px;
              margin-bottom: 16px;
              font-weight: 700;
              letter-spacing: 0.3px;
            }
            h1 { 
              font-size: 26px;
              margin-top: 8px;
              padding-bottom: 12px;
              border-bottom: 2px solid ${isDarkMode ? '#333' : '#e0e0e0'};
            }
            h2 { 
              font-size: 22px;
              margin-top: 20px;
              padding-bottom: 8px;
              border-bottom: 1px solid ${isDarkMode ? '#2a2a2a' : '#f0f0f0'};
            }
            h3 { 
              font-size: 19px;
              font-weight: 600;
            }
            h4 { 
              font-size: 17px;
              font-weight: 600;
            }
            p {
              color: ${secondaryTextColor};
              margin-bottom: 14px;
              line-height: 1.7;
            }
            strong {
              color: ${textColor};
              font-weight: 600;
            }
            ul, ol {
              margin-left: 20px;
              margin-bottom: 14px;
              color: ${secondaryTextColor};
            }
            li {
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Terms and Conditions')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.3),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{
          paddingVertical: hp(2),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        }}
        onBackPress={() => navigation.goBack()}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={
              isDarkMode
                ? Colors.darkTheme.primaryColor
                : Colors.lightTheme.primaryColor
            }
          />
        </View>
      ) : (
        <WebView
          style={styles.webView}
          source={{html: getHtmlContent()}}
          originWhitelist={['*']}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default TermsAndConditions;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    webView: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
