import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import * as DocumentPicker from '@react-native-documents/picker';
import RBSheet from 'react-native-raw-bottom-sheet';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {Colors} from '../../Constants/themeColors';

const CameraBottomSheet = ({
  refRBSheet,
  onPick,
  navigate,
  document = false,
  cameraType = 'back',
}) => {
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(state => state.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const [currentSide, setCurrentSide] = React.useState('front');
  const internalRef = React.useRef();

  // Expose a method to set the side via ref
  React.useImperativeHandle(refRBSheet, () => ({
    open: (side = 'front') => {
      setCurrentSide(side);
      if (internalRef.current) {
        internalRef.current.open();
      }
    },
  }));

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  // New: request storage permission on Android before picking documents
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to pick documents',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true;
  };

  const takePhotoFromCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to take photos.',
      );
      return;
    }

    try {
      if (cameraType === 'front') {
        // Use react-native-image-crop-picker for front camera
        const image = await ImageCropPicker.openCamera({
          width: 1920,
          height: 1080,
          cropping: false,
          mediaType: 'photo',
          useFrontCamera: true,
          compressImageQuality: 0.7,
          includeBase64: false,
        });

        const image1 = {
          path: image.path,
          mime: image.mime,
          name: image.filename || 'photo.jpg',
          side: currentSide,
        };

        if (navigate) {
          navigation.navigate('ImageUpload', {image: image1});
        }
        onPick?.(image1);
      } else {
        // Use react-native-image-picker for back camera or other cases
        const options = {
          cameraType: 'back',
          mediaType: 'photo',
          includeBase64: false,
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.7,
          saveToPhotos: true,
        };

        const res = await launchCamera(options);

        if (res?.didCancel) {
          console.log('User cancelled image picker');
          return;
        }

        if (res?.errorCode) {
          console.log('ImagePicker Error: ', res.errorMessage);
          return;
        }

        if (res?.assets && res.assets.length > 0) {
          const asset = res.assets[0];
          const image1 = {
            path: asset.uri,
            mime: asset.type,
            name: asset.fileName,
            saveToPhotos: true,
            side: currentSide,
          };

          if (navigate) {
            navigation.navigate('ImageUpload', {image: image1});
          }
          onPick?.(image1);
        }
      }
    } catch (err) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        console.log('Error: ', err);
      }
    }
  };

  const choosePhotoFromLibrary = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.7,
    };

    try {
      const res = await launchImageLibrary(options);
      console.log('Picker result:', res);

      if (res.didCancel) {
        console.log('User cancelled picker');
      } else if (res.errorCode) {
        console.warn('Picker Error:', res.errorMessage);
      } else if (res?.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const image1 = {
          path: asset.uri,
          mime: asset.type,
          name: asset.fileName,
          side: currentSide,
        };

        if (navigate) {
          navigation.navigate('ImageUpload', {image: image1});
        }
        onPick?.(image1);
      }
    } catch (err) {
      console.log('Error launching picker:', err);
    }
  };

  // New helper: try available DocumentPicker methods and normalize a single file object
  const performDocumentPick = async types => {
    // prefer provided types or fallback to application/pdf
    const pickTypes =
      types ||
      (DocumentPicker?.types?.pdf
        ? [DocumentPicker.types.pdf]
        : ['application/pdf']);

    // pickSingle (older code expects this)
    if (typeof DocumentPicker.pickSingle === 'function') {
      return await DocumentPicker.pickSingle({type: pickTypes});
    }

    // pick may return array or single depending on implementation
    if (typeof DocumentPicker.pick === 'function') {
      const res = await DocumentPicker.pick({type: pickTypes});
      return Array.isArray(res) ? res[0] : res;
    }

    // some builds expose open
    if (typeof DocumentPicker.open === 'function') {
      const res = await DocumentPicker.open({type: pickTypes});
      return Array.isArray(res) ? res[0] : res;
    }

    throw new Error('No compatible DocumentPicker method found');
  };

  const pickDocument = async () => {
    try {
      // Request storage permission first (Android)
      const hasStoragePermission = await requestStoragePermission();
      if (!hasStoragePermission) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to pick documents.',
        );
        return;
      }

      // Try to pick a PDF using a compatible method
      const res = await performDocumentPick([
        DocumentPicker?.types?.pdf || 'application/pdf',
      ]);
      console.log('Document picked (normalized):', res);

      if (!res) {
        console.log('No document returned from picker');
        return;
      }

      const document = {
        path: res.uri || res.path,
        mime: res.type || res.mimeType || 'application/pdf',
        name: res.name || res.fileName || 'document.pdf',
        size: res.size || res.fileSize || 0,
        type: 'document',
        side: currentSide,
      };

      // close the sheet after successful pick
      try {
        internalRef?.current?.close();
      } catch (e) {
        console.warn('Error closing RBSheet:', e);
      }

      if (navigate) {
        navigation.navigate('ImageUpload', {image: document});
      }
      onPick?.(document);
    } catch (err) {
      // document picker cancel can be reported in different ways across libs/versions
      const isCancel =
        (DocumentPicker &&
          typeof DocumentPicker.isCancel === 'function' &&
          DocumentPicker.isCancel(err)) ||
        err?.code === 'DOCUMENT_PICKER_CANCELED' ||
        err?.code === 'E_PICKER_CANCELLED' ||
        (typeof err?.message === 'string' &&
          err.message.toLowerCase().includes('cancel'));

      if (isCancel) {
        console.log('User cancelled document picker:', err);
      } else if (
        err.message &&
        err.message.includes('No compatible DocumentPicker')
      ) {
        console.error('DocumentPicker compatibility issue:', err);
        Alert.alert(
          'Error',
          'Document picker is not available on this device.',
        );
      } else {
        console.log('DocumentPicker Error: ', err);
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  return (
    <RBSheet
      ref={internalRef}
      closeOnDragDown={true}
      closeOnPressMask={true}
      animationType="fade"
      minClosingHeight={0}
      customStyles={{
        container: {
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.secondryColor,
          height: document ? hp(40) : hp(30),
        },
      }}>
      <View style={styles.headerContainer}>
        <Text style={styles.mainText}>{t('Select An Option')}</Text>
        <TouchableOpacity onPress={() => internalRef.current.close()}>
          <Ionicons
            name="close"
            size={22}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          onPress={() => {
            internalRef.current.close();
            setTimeout(() => {
              takePhotoFromCamera();
            }, 500);
          }}
          style={[
            styles.modalTextView,
            {
              borderBottomColor: isDarkMode
                ? Colors.darkTheme.BorderGrayColor
                : Colors.lightTheme.BorderGrayColor,
              borderBottomWidth: 1,
            },
          ]}>
          <Svgs.Camera height={hp(5)} width={wp(9)} />

          <View style={{marginLeft: wp(3)}}>
            <Text style={styles.optionText}>{t('Camera')}</Text>
            <Text style={styles.descriptionText}>
              {t('Select Camera to capture images.')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            internalRef.current.close();
            setTimeout(() => {
              choosePhotoFromLibrary();
            }, 300);
          }}
          style={[
            styles.modalTextView,
            {
              borderBottomColor: isDarkMode
                ? Colors.darkTheme.BorderGrayColor
                : Colors.lightTheme.BorderGrayColor,
              borderBottomWidth: 1,
            },
          ]}>
          <Svgs.Gallery height={hp(5)} width={wp(9)} />
          <View style={{marginLeft: wp(3)}}>
            <Text style={styles.optionText}>{t('Gallery')}</Text>
            <Text style={styles.descriptionText}>
              {t('Select Gallery to choose images.')}
            </Text>
          </View>
        </TouchableOpacity>

        {document && (
          <TouchableOpacity
            onPress={() => {
              // call picker directly; pickDocument will close the sheet on success
              pickDocument();
            }}
            style={[styles.modalTextView, {margin: 0}]}>
            <Svgs.documentRequest height={hp(5)} width={wp(9)} />
            <View style={{marginLeft: wp(3)}}>
              <Text style={styles.optionText}>{t('Document')}</Text>
              <Text style={styles.descriptionText}>
                {t('Select Document from device.')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </RBSheet>
  );
};

export default CameraBottomSheet;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: wp(8),
      alignItems: 'center',
      marginTop: hp(2),
    },
    mainText: {
      fontSize: FontsSize.size22,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      paddingTop: hp(1),
    },
    optionsContainer: {
      justifyContent: 'center',
      marginHorizontal: wp(8),
    },
    modalTextView: {
      paddingVertical: hp(2),
      flexDirection: 'row',
    },
    optionText: {
      fontSize: FontsSize.size18,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    descriptionText: {
      marginLeft: wp(0),
      fontSize: FontsSize.size15,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
