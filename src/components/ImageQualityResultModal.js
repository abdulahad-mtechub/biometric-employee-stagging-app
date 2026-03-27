import {useTranslation} from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Colors} from '../Constants/themeColors';
import {formatCheckLabel} from '../utils/imageQualityValidate';

const ImageQualityResultModal = ({
  visible,
  isDarkMode,
  qualityPayload,
  pendingPath,
  onRetake,
  onContinue,
}) => {
  const {t} = useTranslation();
  const s = styles;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRetake}>
      <View style={s.overlay}>
        <View
          style={[
            s.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : 'white'},
          ]}>
          <Text style={s.title}>{t('Photo quality result')}</Text>
          {qualityPayload?.serverMessage ? (
            <Text
              style={[
                s.summaryText,
                {color: isDarkMode ? '#ffb74d' : '#e65100'},
              ]}>
              {qualityPayload.serverMessage}
            </Text>
          ) : null}
          {qualityPayload &&
          qualityPayload.overall_valid !== undefined &&
          !qualityPayload.serverMessage ? (
            <View style={s.summaryRow}>
              <Icon
                name={
                  qualityPayload.overall_valid
                    ? 'check-circle'
                    : 'error-outline'
                }
                size={28}
                color={qualityPayload.overall_valid ? '#2e7d32' : '#c62828'}
              />
              <Text
                style={[
                  s.summaryText,
                  {
                    color: qualityPayload.overall_valid
                      ? '#2e7d32'
                      : '#c62828',
                  },
                ]}>
                {qualityPayload.overall_valid
                  ? t('Your photo passed quality checks.')
                  : t('Your photo did not pass quality checks.')}
              </Text>
            </View>
          ) : null}
          <ScrollView
            style={s.checksScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
            {qualityPayload?.checks &&
            typeof qualityPayload.checks === 'object' ? (
              Object.entries(qualityPayload.checks).map(([key, val]) => {
                const passed =
                  val && typeof val === 'object' && val.passed === true;
                const reason =
                  val && typeof val === 'object' && val.reason
                    ? String(val.reason)
                    : '';
                return (
                  <View key={key} style={s.checkRow}>
                    <Icon
                      name={passed ? 'check' : 'close'}
                      size={20}
                      color={passed ? '#2e7d32' : '#c62828'}
                    />
                    <View style={s.checkRowText}>
                      <Text
                        style={[
                          s.checkLabel,
                          {color: isDarkMode ? '#e0e0e0' : '#333'},
                        ]}>
                        {formatCheckLabel(key)}
                      </Text>
                      {reason ? (
                        <Text
                          style={[
                            s.checkReason,
                            {color: isDarkMode ? '#b0b0b0' : '#666'},
                          ]}>
                          {reason}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : null}
          </ScrollView>
          <View style={s.actions}>
            <TouchableOpacity style={s.btnRetake} onPress={onRetake}>
              <Text style={s.btnRetakeText}>{t('Retake')}</Text>
            </TouchableOpacity>
            {qualityPayload?.overall_valid && pendingPath ? (
              <TouchableOpacity style={s.btnContinue} onPress={onContinue}>
                <Text style={s.btnContinueText}>{t('Continue')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    card: {
      width: '88%',
      maxHeight: '78%',
      borderRadius: 15,
      padding: wp(4),
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: hp(1.5),
      color: Colors.lightTheme.primaryColor,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: hp(1),
    },
    summaryText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
    },
    checksScroll: {
      maxHeight: hp(28),
      marginBottom: hp(1),
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: hp(0.8),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(128,128,128,0.35)',
    },
    checkRowText: {
      flex: 1,
      marginLeft: 8,
    },
    checkLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    checkReason: {
      fontSize: 12,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: wp(3),
      marginTop: hp(1),
    },
    btnRetake: {
      flex: 1,
      backgroundColor: '#E9ECEF',
      paddingVertical: hp(1.4),
      borderRadius: 8,
      alignItems: 'center',
    },
    btnRetakeText: {
      color: '#333',
      fontSize: 15,
      fontWeight: '600',
    },
    btnContinue: {
      flex: 1,
      backgroundColor: '#006EC2',
      paddingVertical: hp(1.4),
      borderRadius: 8,
      alignItems: 'center',
    },
    btnContinueText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '600',
    },
});

export default ImageQualityResultModal;
