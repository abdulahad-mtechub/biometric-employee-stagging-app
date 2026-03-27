import {pick} from '@react-native-documents/picker';
import {viewDocument} from '@react-native-documents/viewer';
import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
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
import NetInfo from '@react-native-community/netinfo';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import TxtInput from '../../components/TextInput/Txtinput';
import {createDocument, uploadPdf} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {pxToPercentage} from '../../utils/responsive';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';
import {saveOfflineDocument} from '../../services/OfflineDocumentQueue';

const UploadDocument = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [docName, setDocName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const {showAlert} = useAlert();
  const token = useSelector(state => state?.auth?.user?.token);
  const localizedAlert = useLocalizedAlert();

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    // Check initial network status
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Validation states
  const [errors, setErrors] = useState({
    docName: '',
    description: '',
    category: '',
    document: '',
  });

  const categories = [
    {label: t('Medical'), value: 'medical'},
    {label: t('Expense'), value: 'expense'},
    {label: t('ID'), value: 'id'},
    {label: t('Other'), value: 'other'},
  ];

  // Validation functions
  const validateDocName = value => {
    if (!value.trim()) {
      return t('Document name is required');
    }
    if (value.trim().length < 3) {
      return t('Document name must be at least 3 characters');
    }
    return '';
  };

  const validateDescription = value => {
    if (!value.trim()) {
      return t('Description is required');
    }
    if (value.trim().length < 10) {
      return t('Description must be at least 10 characters');
    }
    return '';
  };

  const validateCategory = value => {
    if (!value) {
      return t('Please select a category');
    }
    return '';
  };

  const validateDocument = file => {
    if (!file) {
      return t('Please select a document');
    }
    return '';
  };

  // Handle field changes with validation
  const handleDocNameChange = value => {
    setDocName(value);
    setErrors(prev => ({
      ...prev,
      docName: '',
    }));
  };

  const handleDescriptionChange = value => {
    setDescription(value);
    setErrors(prev => ({
      ...prev,
      description: '',
    }));
  };

  const handleCategoryChange = value => {
    console.log('🚀 ~ Category selected:', value);
    setCategory(value);
    setErrors(prev => ({
      ...prev,
      category: '',
    }));
  };

  const pickDocument = async () => {
    try {
      const result = await pick({
        mode: 'open',
        type: ['application/pdf'],
        allowMultiSelection: false,
      });

      // Handle different response structures
      let selectedDoc;
      if (Array.isArray(result)) {
        selectedDoc = result[0];
      } else if (result && result.uri) {
        selectedDoc = result;
      } else {
        showAlert(t('No file selected'));
        return;
      }

      console.log('🚀 ~ Document picked:', selectedDoc);

      // Validate file exists
      if (!selectedDoc || !selectedDoc.uri) {
        showAlert(t('No file selected'));
        return;
      }

      // Validate file size (max 10MB)
      if (selectedDoc.size && selectedDoc.size > 10 * 1024 * 1024) {
        showAlert(t('File size should not exceed 10MB'));
        return;
      }

      // Validate file type
      const fileExtension = selectedDoc.name?.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'pdf') {
        showAlert(t('Please select a PDF file'));
        return;
      }

      setSelectedFile({
        name: selectedDoc.name || 'Unknown.pdf',
        size: selectedDoc.size || 0,
        uri: selectedDoc.uri,
        type: selectedDoc.type || 'application/pdf',
      });

      setErrors(prev => ({
        ...prev,
        document: '',
      }));
    } catch (err) {
      console.log('DocumentPicker Error: ', err);
      console.log(err.code, err.message);

      // Handle different types of errors
      if (
        err.code === 'DOCUMENT_PICKER_CANCELED' ||
        err.message === 'User canceled document picker' ||
        err.message?.includes('cancelled') ||
        err.message?.includes('canceled')
      ) {
        // User cancelled - do nothing
        return;
      }

      // Show error for other cases
      showAlert(t('Error selecting file. Please try again.'));
    }
  };

  const viewSelectedDocument = async () => {
    if (!selectedFile || !selectedFile.uri) {
      showAlert(t('No document selected to view'));
      return;
    }

    try {
      await viewDocument({
        uri: selectedFile.uri,
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.log('Error viewing document:', error);
      showAlert(t('Error opening document'));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const uploadDocument = async () => {
    const nameError = validateDocName(docName);
    const descError = validateDescription(description);
    const catError = validateCategory(category);
    const docError = validateDocument(selectedFile);

    setErrors({
      docName: nameError,
      description: descError,
      category: catError,
      document: docError,
    });

    if (nameError || descError || catError || docError) {
      showAlert(
        t('Please fix all validation errors before uploading'),
        'error',
      );
      return;
    }

    if (!docName.trim() || !description.trim() || !category || !selectedFile) {
      showAlert(t('All fields are required'), 'error');
      return;
    }

    setUploading(true);

    // ============ OFFLINE MODE HANDLING ============
    // Use the network status from state (tracked by useEffect)
    if (!isOnline) {
      console.log('📴 Device is offline, saving document to queue...');

      // Save document data for offline processing
      const documentData = {
        name: docName.trim(),
        description: description.trim(),
        category: category,
      };

      const saved = await saveOfflineDocument(
        documentData,
        selectedFile,
        token,
      );

      if (saved) {
        showAlert(
          t(
            'No internet connection. Document will be uploaded automatically when online.',
          ),
          'info',
        );
        // Clear form
        setDocName('');
        setDescription('');
        setCategory('');
        setSelectedFile(null);
        setErrors({
          docName: '',
          description: '',
          category: '',
          document: '',
        });
        navigation.goBack();
      } else {
        showAlert(
          t('Failed to save document for offline upload. Please try again.'),
          'error',
        );
      }

      setUploading(false);
      return;
    }

    try {
      const getfinalUrlofPdf = await uploadPdf(selectedFile, token);
      const payload = {
        subject: docName.trim(),
        description: description.trim(),
        file_id: getfinalUrlofPdf?.data?.url,
        file_type: 'pdf',
        category: category,
        name: docName.trim(),
      };

      const uploadResponse = await createDocument(payload, token);

      if (uploadResponse.error === false) {
        const responseData = uploadResponse?.data || uploadResponse;
        localizedAlert(
          responseData,
          'success',
          t('Document uploaded successfully'),
        );
        setDocName('');
        setDescription('');
        setCategory('');
        setSelectedFile(null);
        setErrors({
          docName: '',
          description: '',
          category: '',
          document: '',
        });
        navigation.goBack();
      } else {
        localizedAlert(uploadResponse, 'error');
      }
    } catch (error) {
      console.error('❌ Error uploading document:', error);

      console.log('📴 Upload failed, saving to offline queue as fallback...');
      const documentData = {
        name: docName.trim(),
        description: description.trim(),
        category: category,
      };

      const saved = await saveOfflineDocument(
        documentData,
        selectedFile,
        token,
      );

      if (saved) {
        showAlert(
          t('Upload failed. Document saved and will be uploaded when online.'),
          'info',
        );
        // Clear form
        setDocName('');
        setDescription('');
        setCategory('');
        setSelectedFile(null);
        setErrors({
          docName: '',
          description: '',
          category: '',
          document: '',
        });
        navigation.goBack();
      } else {
        showAlert(t('Upload failed. Please try again.'), 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode
          ? Colors.darkTheme.backgroundColor
          : Colors.lightTheme.backgroundColor,
      }}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1, paddingBottom: hp(4)}}
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

          <Text style={[styles.header]}>{t('Upload Document')}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>{t('Document Details')}</Text>
          <Text style={[styles.label]}>
            {t('Name')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <TxtInput
            value={docName}
            containerStyle={{
              backgroundColor: isDarkMode
                ? Colors.darkTheme.input
                : 'transparent',
              marginBottom: errors.docName ? hp(0.5) : hp(2),
              borderColor: errors.docName ? Colors.error : undefined,
            }}
            placeholder={t('Eg. My CV')}
            onChangeText={handleDocNameChange}
          />
          {errors.docName && (
            <Text style={styles.errorText}>{errors.docName}</Text>
          )}

          <Text style={[styles.label]}>
            {t('Category')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <CustomDropDown
            data={categories}
            selectedValue={category}
            onValueChange={handleCategoryChange}
            placeholder={t('Select Category')}
            astrik={false}
            // zIndex={1000}
            // zIndexInverse={3000}
          />
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}

          <Text style={[styles.label]}>
            {t('Description')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.comments,
              errors.description && styles.inputError,
            ]}
            placeholder={t('Describe your document')}
            placeholderTextColor="#A0A0A0"
            value={description}
            onChangeText={handleDescriptionChange}
            multiline
          />
          {errors.description && (
            <Text style={[styles.errorText, {marginTop: -hp(1.5)}]}>
              {errors.description}
            </Text>
          )}

          <View style={{marginTop: hp(1)}}>
            <Text style={styles.label}>
              {t('Document')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor,
                  fontFamily: Fonts.PoppinsRegular,
                },
              ]}>
              {t('Document in PDF Format (Max 10MB)')}
            </Text>

            {!selectedFile ? (
              <TouchableOpacity
                style={[
                  styles.uploadContainer,
                  errors.document && styles.uploadContainerError,
                ]}
                onPress={pickDocument}>
                <View
                  style={{
                    padding: wp(4),
                    backgroundColor: isDarkMode
                      ? Colors.darkTheme.backgroundColor
                      : '#5E5F60',
                    borderRadius: wp(10),
                    marginBottom: hp(1),
                  }}>
                  <Svgs.whitePlus />
                </View>
                <Text style={styles.uploadText}>{t('Tap to select PDF')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.fileContainer}>
                <View style={styles.fileInfo}>
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={RFPercentage(4)}
                    color={Colors.error}
                  />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {selectedFile.size
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
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
                      color={Colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {errors.document && (
              <Text style={[styles.errorText, {marginTop: hp(1)}]}>
                {errors.document}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.btnContainer}>
        <CustomButton
          text={uploading ? t('Uploading...') : t('Upload')}
          onPress={uploadDocument}
          disabled={uploading}
          textStyle={styles.continueButtonText}
          containerStyle={[
            styles.continueButton,
            uploading && styles.disabledButton,
          ]}
        />
      </View>
    </View>
  );
};

export default UploadDocument;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
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
    uploadText: {
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
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
    disabledButton: {
      opacity: 0.6,
    },
    disabledUploadContainer: {
      opacity: 0.5,
    },
    disabledText: {
      opacity: 0.5,
    },
    errorText: {
      color: Colors.error,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
      marginBottom: hp(1.5),
      marginLeft: wp(1),
    },
    inputError: {
      borderColor: Colors.error,
      borderWidth: 1,
    },
    uploadContainerError: {
      borderColor: Colors.error,
      borderWidth: 2,
    },
    dropdownWrapper: {
      marginBottom: hp(2),
      zIndex: 1000,
    },
    dropdown: {
      borderWidth: 1,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      minHeight: hp(6),
    },
    dropdownContainer: {
      borderWidth: 1,
      borderRadius: wp(2),
      zIndex: 1000,
    },
    dropdownError: {
      borderColor: Colors.error,
      borderWidth: 1,
    },
    viewButton: {
      marginRight: wp(2),
      padding: wp(1),
    },
  });
