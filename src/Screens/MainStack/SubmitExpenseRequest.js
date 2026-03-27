import React, {useRef, useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {pick} from '@react-native-documents/picker';
import {viewDocument} from '@react-native-documents/viewer';
import NetInfo from '@react-native-community/netinfo';
import {saveOfflineExpenseRequest} from '../../services/OfflineExpenseRequestQueue';
import {Svgs} from '../../assets/Svgs/Svgs';
import CameraBottomSheet from '../../components/BottomSheets/CameraBottomSheet';
import CustomButton from '../../components/Buttons/customButton';
import TxtInput from '../../components/TextInput/Txtinput';
import {createExpenses, uploadImage, uploadPdf} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {pxToPercentage} from '../../utils/responsive';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const SubmitExpenseRequest = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {user} = useSelector(store => store.auth);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [Amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const {showAlert} = useAlert();
  const token = useSelector(state => state?.auth?.user?.token);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [imageError, setImageError] = useState('');
  const [fileType, setFileType] = useState('image');
  const [selectedFile, setSelectedFile] = useState(null);
  const localizedAlert = useLocalizedAlert();
  const cameraBottomSheetRef = useRef(null);
  // ============ OFFLINE MODE STATE ============
  const [isOnline, setIsOnline] = useState(true);
  // ============================================

  const {type} = route.params;

  // ============ OFFLINE MODE: TRACK NETWORK STATUS ============
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);
  // =============================================================

  const validateFields = () => {
    let isValid = true;

    // Reset errors
    setAmountError('');
    setDescriptionError('');
    setImageError('');

    // Validate amount
    if (!Amount.trim()) {
      setAmountError(t('Amount is required'));
      isValid = false;
    } else if (isNaN(parseFloat(Amount)) || parseFloat(Amount) <= 0) {
      setAmountError(t('Please enter a valid amount'));
      isValid = false;
    } else if (parseFloat(Amount) > 1000000) {
      setAmountError(t('Amount seems too high, please verify'));
      isValid = false;
    }

    // Validate description
    if (!description.trim()) {
      setDescriptionError(t('Description is required'));
      isValid = false;
    } else if (description.trim().length < 10) {
      setDescriptionError(t('Description must be at least 10 characters'));
      isValid = false;
    } else if (description.trim().length > 500) {
      setDescriptionError(t('Description must not exceed 500 characters'));
      isValid = false;
    }

    // Validate file (image or PDF)
    if (!imageData && !selectedFile) {
      setImageError(t('Supporting proof is required'));
      isValid = false;
    }

    return isValid;
  };

  const handleImagePick = image => {
    setImageData(image);
    setSelectedFile(null);
    setFileType('image');
    if (imageError) setImageError('');
  };

  const pickDocument = async () => {
    try {
      const result = await pick({
        mode: 'open',
        type: ['application/pdf'],
        allowMultiSelection: false,
      });

      let selectedDoc;
      if (Array.isArray(result)) {
        selectedDoc = result[0];
      } else if (result && result.uri) {
        selectedDoc = result;
      } else {
        return;
      }

      if (!selectedDoc || !selectedDoc.uri) {
        return;
      }

      setSelectedFile({
        name: selectedDoc.name || 'Unknown.pdf',
        size: selectedDoc.size || 0,
        uri: selectedDoc.uri,
        type: selectedDoc.type || 'application/pdf',
      });

      setImageData(null);
      setFileType('pdf');
      if (imageError) setImageError('');
    } catch (err) {
      if (
        err.code === 'DOCUMENT_PICKER_CANCELED' ||
        err.message === 'User canceled document picker' ||
        err.message?.includes('cancelled') ||
        err.message?.includes('canceled')
      ) {
        return;
      }
    }
  };

  const viewSelectedDocument = async () => {
    if (!selectedFile || !selectedFile.uri) {
      // showAlert(t('No document selected to view'));
      return;
    }

    try {
      await viewDocument({
        uri: selectedFile.uri,
        mimeType: 'application/pdf',
      });
    } catch (error) {
      // showAlert(t('Error opening document'));
    }
  };

  const removeFile = () => {
    if (fileType === 'pdf') {
      setSelectedFile(null);
    } else {
      setImageData(null);
    }
  };

  const handleExpenseRequest = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!validateFields()) {
        setLoading(false);
        return;
      }

      // Prepare request body (without file upload)
      const body = {
        date_of_expense: expenseDate,
        amount: parseFloat(Amount),
        currency: 'USD',
        description: description,
      };

      // Get file data for offline storage
      const fileData = imageData || selectedFile;

      // ============ OFFLINE MODE LOGIC ============
      // Use the network status from state (tracked by useEffect)
      // If offline, save to queue
      if (!isOnline) {
        // Device is OFFLINE - Save request to local queue
        const saved = await saveOfflineExpenseRequest(
          body,
          fileData,
          fileType,
          token,
        );

        if (saved) {
          showAlert(
            t(
              'Request saved offline. It will be submitted automatically when you are online.',
            ),
            'success',
          );
          navigation.goBack();
        } else {
          showAlert(t('Failed to save request offline'), 'error');
        }
      } else {
        // Device is ONLINE - Submit normally
        try {
          let uploadedReceiptUrl = receiptUrl;

          // Upload file based on type
          if (imageData) {
            const responseImage = await uploadImage(imageData);
            if (responseImage?.data?.url) {
              uploadedReceiptUrl = responseImage.data.url;
              setReceiptUrl(responseImage.data.url);
            }
          } else if (selectedFile) {
            const responsePdf = await uploadPdf(selectedFile, token);
            if (responsePdf?.data?.url) {
              uploadedReceiptUrl = responsePdf.data.url;
              setReceiptUrl(responsePdf.data.url);
            }
          }

          const finalBody = {
            ...body,
            receipt_url: uploadedReceiptUrl,
          };

          const response = await createExpenses(finalBody, token);

          if (response.error === false) {
            localizedAlert(response, 'success');
            navigation.goBack();
          } else {
            localizedAlert(response, 'error');
          }
        } catch (error) {
          // If API call fails, save offline as fallback
          console.log('API call failed, saving offline as fallback');
          const saved = await saveOfflineExpenseRequest(
            body,
            fileData,
            fileType,
            token,
          );

          if (saved) {
            showAlert(
              t(
                'Request saved offline. It will be submitted automatically when you are online.',
              ),
              'success',
            );
            navigation.goBack();
          } else {
            localizedAlert(error, 'error');
          }
        }
      }
      // ============================================
    } catch (error) {
      localizedAlert(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        style={styles.container}>
        <View style={styles.backArrowContainer}>
          <MaterialCommunityIcons
            name={'close'}
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.secondryTextColor
                : Colors.lightTheme.iconColor
            }
            onPress={() => {
              navigation.goBack();
            }}
          />

          <Text style={styles.header}>
            {type === 'Expense' ? t('Expense Request') : t('Loan Request')}
          </Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>{t('Request Details')}</Text>

          <Text style={styles.label}>
            {t('Amount')} (USD)
            <Text style={{color: 'red'}}> *</Text>
          </Text>

          <TxtInput
            value={Amount}
            containerStyle={[
              styles.txtInputContainer,
              amountError ? styles.errorInputBorder : null,
            ]}
            placeholder={t('Enter amount')}
            onChangeText={text => {
              setAmount(text);
              // Clear error when user starts typing
              if (amountError) setAmountError('');
            }}
            onBlur={() => {
              // Validate on blur
              if (!Amount.trim()) {
                setAmountError(t('Amount is required'));
              } else if (isNaN(parseFloat(Amount)) || parseFloat(Amount) <= 0) {
                setAmountError(t('Please enter a valid amount'));
              } else if (parseFloat(Amount) > 1000000) {
                setAmountError(t('Amount seems too high, please verify'));
              }
            }}
            keyboardType="numeric"
          />

          {amountError ? (
            <Text style={styles.errorText}>{amountError}</Text>
          ) : null}
          <Text style={[styles.label, {marginTop: hp(2)}]}>
            {t('Description')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.comments,
              descriptionError ? styles.errorInputBorder : null,
            ]}
            placeholder={t('Describe your request')}
            placeholderTextColor="#A0A0A0"
            value={description}
            onChangeText={text => {
              setDescription(text);
              // Clear error when user starts typing
              if (descriptionError) setDescriptionError('');
            }}
            onBlur={() => {
              // Validate on blur
              if (!description.trim()) {
                setDescriptionError(t('Description is required'));
              } else if (description.trim().length < 10) {
                setDescriptionError(
                  t('Description must be at least 10 characters'),
                );
              } else if (description.trim().length > 500) {
                setDescriptionError(
                  t('Description must not exceed 500 characters'),
                );
              }
            }}
            multiline
          />
          {descriptionError ? (
            <Text style={[styles.errorText, {marginTop: -hp(1.5)}]}>
              {descriptionError}
            </Text>
          ) : null}

          <Text style={styles.label}>{t('Date')}</Text>
          <TxtInput
            value={expenseDate}
            containerStyle={styles.txtInputContainer}
            placeholder={t('Select date')}
            editable={false}
            onPress={() => {}}
          />

          <View style={styles.marginTop1}>
            <Text style={styles.label}>
              {t('Supporting Proof')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <Text style={styles.labelSecondary}>
              {t('Upload image/Document in PNG/JPG/PDF Format')}
            </Text>

            <View style={styles.fileTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.fileTypeButton,
                  fileType === 'image' && styles.fileTypeButtonActive,
                ]}
                onPress={() => setFileType('image')}>
                <Text
                  style={[
                    styles.fileTypeText,
                    fileType === 'image' && styles.fileTypeTextActive,
                  ]}>
                  {t('Image')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fileTypeButton,
                  fileType === 'pdf' && styles.fileTypeButtonActive,
                ]}
                onPress={() => setFileType('pdf')}>
                <Text
                  style={[
                    styles.fileTypeText,
                    fileType === 'pdf' && styles.fileTypeTextActive,
                  ]}>
                  {t('PDF')}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.uploadContainer,
                imageError ? styles.errorUpload : null,
              ]}>
              {fileType === 'image' ? (
                imageData ? (
                  <View style={styles.imagePreview}>
                    <Image
                      source={{uri: imageData.path}}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={() => {
                        cameraBottomSheetRef.current?.open();
                        if (imageError) setImageError('');
                      }}>
                      <Svgs.editCircled height={hp(5)} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => {
                      cameraBottomSheetRef.current?.open();
                      if (imageError) setImageError('');
                    }}>
                    <Svgs.whitePlus />
                  </TouchableOpacity>
                )
              ) : selectedFile ? (
                <View style={styles.fileContainer}>
                  <View style={styles.fileInfo}>
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={RFPercentage(4)}
                      color={Colors.error || '#FF0000'}
                    />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{selectedFile.name}</Text>
                      <Text style={styles.fileSize}>
                        {selectedFile.size
                          ? `${(selectedFile.size / (1024 * 1024)).toFixed(
                              2,
                            )} MB`
                          : 'Size unknown'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={viewSelectedDocument}
                      style={styles.viewButton}>
                      <MaterialCommunityIcons
                        name="eye"
                        size={RFPercentage(3)}
                        color={
                          isDarkMode
                            ? Colors.darkTheme.primaryTextColor
                            : Colors.lightTheme.primaryTextColor
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={removeFile}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={RFPercentage(3)}
                        color={Colors.error || '#FF0000'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    pickDocument();
                    if (imageError) setImageError('');
                  }}>
                  <Svgs.whitePlus />
                </TouchableOpacity>
              )}
            </View>
            {imageError ? (
              <Text style={[styles.errorText, {marginTop: 5}]}>
                {imageError}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <CameraBottomSheet
        refRBSheet={cameraBottomSheetRef}
        onPick={handleImagePick}
        navigate={false}
        cameraType={'back'}
      />

      <View style={styles.btnContainer}>
        <CustomButton
          text={loading ? t('Sending...') : t('Send')}
          onPress={handleExpenseRequest}
          disabled={loading}
          textStyle={styles.continueButtonText}
          containerStyle={styles.continueButton}
        />
      </View>
    </View>
  );
};

export default SubmitExpenseRequest;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    scrollContentContainer: {
      flexGrow: 1,
      paddingBottom: hp(4),
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(2),
      paddingTop: hp(2),
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: wp(2),
      marginBottom: hp(2),
    },
    header: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      width: wp(80),
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsMedium,
    },
    contentContainer: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      width: wp(80),
      marginBottom: hp(0.5),
    },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      marginBottom: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
      fontSize: RFPercentage(pxToPercentage(15)),
    },
    comments: {
      height: hp(40),
      textAlignVertical: 'top',
    },
    uploadContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(30),
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    txtInputContainer: {
      backgroundColor: isDarkMode ? Colors.darkTheme.input : 'transparent',
      marginBottom: hp(2),
    },
    marginTop1: {
      marginTop: hp(1),
    },
    labelSecondary: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginBottom: hp(0.5),
    },
    uploadButton: {
      padding: wp(4),
      backgroundColor: '#006EC2',
      borderRadius: wp(10),
      alignItems: 'center',
    },
    errorText: {
      fontSize: RFPercentage(pxToPercentage(12)),
      color: Colors.error || '#FF0000',
      fontFamily: Fonts.PoppinsRegular,
      marginBottom: hp(1),
      marginTop: -hp(1),
    },
    errorInput: {
      borderColor: Colors.error || '#FF0000',
      borderWidth: 1,
    },
    errorInputBorder: {
      borderColor: Colors.error || '#FF0000',
    },
    errorUpload: {
      borderColor: Colors.error || '#FF0000',
      borderWidth: 1,
    },
    imagePreview: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    previewImage: {
      width: '100%',
      height: '100%',
      borderRadius: wp(2),
    },
    changeImageButton: {
      position: 'absolute',
      top: -2,
      right: 0,
    },
    uploadButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.secondryColor,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsMedium,
      marginTop: hp(0.5),
      fontWeight: 'bold',
    },
    fileTypeContainer: {
      flexDirection: 'row',
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(2),
      padding: wp(0.5),
    },
    fileTypeButton: {
      flex: 1,
      paddingVertical: hp(1),
      alignItems: 'center',
      borderRadius: wp(1.5),
    },
    fileTypeButtonActive: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
    },
    fileTypeText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    fileTypeTextActive: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
    },
    fileContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(2),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      padding: wp(3),
      width: '100%',
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fileDetails: {
      flex: 1,
      marginLeft: wp(3),
    },
    fileName: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
    },
    fileSize: {
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
    },
    viewButton: {
      marginRight: wp(2),
      padding: wp(1),
    },
  });
