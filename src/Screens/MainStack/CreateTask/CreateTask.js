import React, {useState, useMemo, useCallback, useRef} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {Colors} from '../../../Constants/themeColors';
import {Fonts} from '../../../Constants/Fonts';
import {SCREENS} from '../../../Constants/Screens';
import {Svgs} from '../../../assets/Svgs/Svgs';
import TxtInput from '../../../components/TextInput/Txtinput';
import {useTranslation} from 'react-i18next';
import DateTimePickerModal from '../../../components/DateTimeModal/CustomDateTimePicker';
import LabeledSwitch from '../../../components/Buttons/LabeledSwitch';
import CustomButton from '../../../components/Buttons/customButton';
import CustomDropDown from '../../../components/DropDown/CustomDropDown';
import CameraBottomSheet from '../../../components/BottomSheets/CameraBottomSheet';
import {createTask, uploadImage, uploadDocument} from '../../../Constants/api';
import {useLocalizedAlert} from '../../../Providers/useLocalizedAlert';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const formatDate = date => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
};

const formatTime = date => {
  if (!date) return '';
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const getDateTimeColor = (value, isDarkMode) => {
  if (value) {
    return isDarkMode
      ? Colors.darkTheme.primaryTextColor
      : Colors.lightTheme.primaryTextColor;
  }
  return isDarkMode
    ? Colors.darkTheme.secondryTextColor
    : Colors.lightTheme.QuaternaryText;
};

const CreateTask = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = useMemo(() => dynamicStyles(isDarkMode), [isDarkMode]);
  const {t} = useTranslation();
  const type = route.params?.type;
  const isProject = type === 'Project';
  const token = useSelector(state => state?.auth?.user?.token);

  const priorityOptions = PRIORITY_OPTIONS.map(opt => t(opt));

  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [description, setDescription] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [faceRequired, setFaceRequired] = useState(true);
  const [locationRequired, setLocationRequired] = useState(true);
  const [radius, setRadius] = useState('100');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const localizedAlert = useLocalizedAlert();

  // Camera sheet ref
  const cameraSheetRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Picker visibility state
  const [pickerState, setPickerState] = useState({
    startDate: false,
    startTime: false,
    endDate: false,
    endTime: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized validation
  const isFormValid = useMemo(() => {
    return (
      taskName.trim() &&
      priority &&
      startDate &&
      startTime &&
      endDate &&
      endTime &&
      (!locationRequired || (locationRequired && locationCoords))
    );
  }, [
    taskName,
    priority,
    startDate,
    startTime,
    endDate,
    endTime,
    locationRequired,
    locationCoords,
  ]);

  // Handlers
  const handleRadiusChange = useCallback(text => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 3);
    setRadius(filtered);
  }, []);

  const handleOpenMapScreen = useCallback(() => {
    navigation.navigate(SCREENS.MAPSCREENGOOGLE, {
      selectedLocation: locationCoords
        ? {
            latitude: locationCoords.latitude,
            longitude: locationCoords.longitude,
          }
        : null,
      onLocationUpdate: locationData => {
        if (locationData) {
          setLocationCoords({
            latitude: parseFloat(locationData.latitude),
            longitude: parseFloat(locationData.longitude),
          });
          setLocationAddress(
            locationData.address || locationData.street_address || '',
          );
        }
      },
    });
  }, [navigation, locationCoords]);

  const handleDocumentPick = useCallback(() => {
    if (cameraSheetRef.current) {
      cameraSheetRef.current.open();
    }
  }, []);

  // Handle camera image capture
  const handleCameraCapture = useCallback(
    async image => {
      if (image && image.path) {
        setIsUploading(true);
        try {
          // Use uploadDocument for PDFs/documents, uploadImage for images
          const isDocument = image.type === 'document';
          const uploadFn = isDocument ? uploadDocument : uploadImage;
          const response = await uploadFn(image, token);
          console.log('Upload response:', JSON.stringify(response, null, 2));

          // Handle different response formats - check for error: false (not success: true)
          let documentUrl = null;
          if (response?.error === false && response?.data?.url) {
            // Success case - get URL from response
            documentUrl = response.data.url;
            console.log('Document uploaded successfully:', documentUrl);
          } else {
            console.log('Upload failed or no URL in response:', response);
          }

          if (documentUrl) {
            setSupportingDocuments(prev => [
              ...prev,
              {
                name:
                  image.name ||
                  image.fileName ||
                  (isDocument ? 'document.pdf' : 'captured_image.jpg'),
                uri: documentUrl,
                type:
                  image.mime || (isDocument ? 'application/pdf' : 'image/jpeg'),
              },
            ]);
          } else {
            Alert.alert(
              t('Upload Failed'),
              t('Could not upload document. Please try again.'),
            );
          }
        } catch (uploadError) {
          console.log('Upload error:', uploadError);
          Alert.alert(
            t('Upload Error'),
            t('An error occurred while uploading. Please try again.'),
          );
        }
        setIsUploading(false);
      }
    },
    [token, t],
  );

  const removeDocument = useCallback(index => {
    setSupportingDocuments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleLocationToggle = useCallback(value => {
    setLocationRequired(value);
    if (!value) {
      setLocationCoords(null);
      setLocationAddress('');
    }
  }, []);

  const handlePickerOpen = useCallback(type => {
    setPickerState(prev => ({...prev, [type]: true}));
  }, []);

  const handlePickerClose = useCallback(type => {
    setPickerState(prev => ({...prev, [type]: false}));
  }, []);

  const handlePickerConfirm = useCallback(
    (type, date) => {
      switch (type) {
        case 'startDate':
          setStartDate(date);
          break;
        case 'startTime':
          setStartTime(date);
          break;
        case 'endDate':
          setEndDate(date);
          break;
        case 'endTime':
          setEndTime(date);
          break;
      }
      handlePickerClose(type);
    },
    [handlePickerClose],
  );

  const getCurrentLocation = useCallback(() => {
    // First try with high accuracy
    Geolocation.getCurrentPosition(
      position => {
        console.log('Current location:', position.coords);
        setLocationCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationAddress('Current Location');
      },
      error => {
        console.log('High accuracy failed, trying with low accuracy:', error);
        // Try again with low accuracy if high accuracy fails
        Geolocation.getCurrentPosition(
          position => {
            console.log('Current location (low accuracy):', position.coords);
            setLocationCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationAddress('Current Location');
          },
          err => {
            console.log('Geolocation error:', err);
            let errorMessage = t('Unable to get current location');
            if (err.code === 1) {
              errorMessage = t('Location permission denied');
            } else if (err.code === 2) {
              errorMessage = t('Location unavailable');
            } else if (err.code === 3) {
              errorMessage = t('Location request timed out. Please try again.');
            }
            Alert.alert(t('Error'), errorMessage);
          },
          {enableHighAccuracy: false, timeout: 30000, maximumAge: 60000},
        );
      },
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 10000},
    );
  }, [t]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert(t('Validation Error'), t('Please fill all required fields'));
      return;
    }

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    console.log('Start:', startDateTime.toISOString());
    console.log('End:', endDateTime.toISOString());
    console.log('End timestamp:', endDateTime.getTime());
    console.log('Start timestamp:', startDateTime.getTime());

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      Alert.alert(
        t('Validation Error'),
        t('End date/time must be after start date/time'),
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const requestBody = {
        title: taskName.trim(),
        description: description.trim() || '',
        priority: priority.toLowerCase(),
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        assignees: [],
        supporting_proof: supportingDocuments.map(doc => doc.uri),
        face_required: faceRequired,
        location_required: locationRequired,
        location_radius: locationRequired ? parseInt(radius) || 100 : null,
        location_lat:
          locationRequired && locationCoords ? locationCoords.latitude : null,
        location_lng:
          locationRequired && locationCoords ? locationCoords.longitude : null,
        location_address: locationAddress || null,
        evidence_required: false,
        completion_policy: 'all',
        meta: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          allow_decline: true,
          allow_reschedule: true,
        },
      };
      console.log('Create task request:', JSON.stringify(requestBody, null, 2));
      const response = await createTask(requestBody, token);
      console.log('Create task response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        localizedAlert(response.data, 'success');
        navigation.goBack();
      } else {
        localizedAlert(response.data, 'error');
      }
    } catch (error) {
      localizedAlert(
        {message: t('An error occurred while creating the task')},
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    t,
    startDate,
    startTime,
    endDate,
    endTime,
    taskName,
    description,
    priority,
    supportingDocuments,
    faceRequired,
    locationRequired,
    radius,
    locationCoords,
    locationAddress,
    token,
    navigation,
  ]);

  // DateTime picker render helper
  const renderDateTimePicker = (type, _value, mode) => (
    <DateTimePickerModal
      isVisible={pickerState[type]}
      onClose={() => handlePickerClose(type)}
      onConfirm={date => handlePickerConfirm(type, date)}
      mode={mode}
    />
  );

  // DateTime input render helper
  const renderDateTimeInput = (
    label,
    dateValue,
    timeValue,
    dateKey,
    timeKey,
    required,
  ) => {
    const dateColor = getDateTimeColor(dateValue, isDarkMode);
    const timeColor = getDateTimeColor(timeValue, isDarkMode);

    return (
      <View style={styles.halfWidth}>
        <Label text={label} required={required} isDarkMode={isDarkMode} />
        <TouchableOpacity
          style={styles.dateTimeInput}
          onPress={() => handlePickerOpen(dateKey)}>
          <Text style={[styles.dateTimeText, {color: dateColor}]}>
            {dateValue ? formatDate(dateValue) : 'dd/mm/yyyy'}
          </Text>
          <Svgs.calenderL />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateTimeInput}
          onPress={() => handlePickerOpen(timeKey)}>
          <Text style={[styles.dateTimeText, {color: timeColor}]}>
            {timeValue ? formatTime(timeValue) : '--:-- --'}
          </Text>
          <Svgs.ClockL />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="close"
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.secondryTextColor
                : Colors.lightTheme.iconColor
            }
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isProject ? t('Add Project') : t('Create Task')}
        </Text>
        <View style={{width: wp(8)}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, {flexGrow: 1}]}>
        {/* Task Name */}
        <Label text={t('Task Name')} required isDarkMode={isDarkMode} />
        <TxtInput
          value={taskName}
          placeholder={t('Enter task name')}
          onChangeText={setTaskName}
          containerStyle={styles.inputContainer}
        />

        {/* Priority */}
        <Label text={t('Priority')} required isDarkMode={isDarkMode} />
        <CustomDropDown
          data={priorityOptions}
          selectedValue={priority}
          onValueChange={setPriority}
          placeholder={t('Select')}
          backgroundColor={
            isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor
          }
          width={wp(90)}
          astrik
        />

        {/* Starting Date & Time */}
        <View style={styles.row}>
          {renderDateTimeInput(
            t('Starting Date'),
            startDate,
            startTime,
            'startDate',
            'startTime',
            true,
          )}
          {renderDateTimeInput(
            t('Ending Date'),
            endDate,
            endTime,
            'endDate',
            'endTime',
            true,
          )}
        </View>

        {/* Description */}
        <Label text={t('Description')} isDarkMode={isDarkMode} />
        <TextInput
          style={styles.textArea}
          placeholder={t('Enter task description')}
          placeholderTextColor={
            isDarkMode
              ? Colors.darkTheme.secondryTextColor
              : Colors.lightTheme.QuaternaryText
          }
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* Supporting Document */}
        <Label text={t('Supporting Document')} isDarkMode={isDarkMode} />
        <TouchableOpacity style={styles.uploadBox} onPress={handleDocumentPick}>
          <Svgs.uploadBlue />
          <Text style={styles.uploadText}>{t('Tap to upload documents')}</Text>
          <Text style={styles.uploadHint}>{t('Images + PDF only')}</Text>
        </TouchableOpacity>

        {supportingDocuments.length > 0 && (
          <View style={styles.documentsList}>
            {supportingDocuments.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {doc.name}
                </Text>
                <TouchableOpacity onPress={() => removeDocument(index)}>
                  <Text style={styles.removeDoc}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Face Scan Restriction Toggle */}
        <View style={styles.toggleSection}>
          <LabeledSwitch
            title={t('Face Scan Restriction')}
            subtitle={t('Require face verification to complete task')}
            value={faceRequired}
            onValueChange={setFaceRequired}
          />
        </View>

        {/* Location Restriction Toggle */}
        <View style={styles.toggleSection}>
          <LabeledSwitch
            title={t('Location Restriction')}
            subtitle={t('Restrict task completion to specific location')}
            value={locationRequired}
            onValueChange={handleLocationToggle}
          />
        </View>

        {/* Location Settings */}
        {locationRequired && (
          <View style={styles.locationSettings}>
            <Label text={t('Radius (meters)')} isDarkMode={isDarkMode} />
            <TxtInput
              value={radius}
              placeholder="100"
              keyboardType="numeric"
              onChangeText={handleRadiusChange}
              maxLength={3}
              containerStyle={styles.inputContainer}
            />

            <Label
              text={t('Pick from Live Location')}
              required
              isDarkMode={isDarkMode}
            />
            <View style={styles.locationRow}>
              <View style={styles.locationInput}>
                <TxtInput
                  value={locationAddress}
                  placeholder={t('Search location...')}
                  onChangeText={setLocationAddress}
                  containerStyle={styles.inputContainer}
                  editable={false}
                  multiline={true}
                />
              </View>
              <CustomButton
                text={t('Full Map')}
                onPress={handleOpenMapScreen}
                containerStyle={styles.fullMapButton}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create Task Button */}
      <View style={styles.buttonContainer}>
        <CustomButton
          text={t('Create Task')}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}
          containerStyle={[
            styles.createButton,
            {
              backgroundColor: isFormValid
                ? isDarkMode
                  ? Colors.darkTheme.primaryColor
                  : Colors.lightTheme.primaryColor
                : isDarkMode
                ? Colors.darkTheme.BorderGrayColor
                : Colors.lightTheme.BorderGrayColor,
            },
          ]}
        />
      </View>

      {/* Date/Time Pickers */}
      {renderDateTimePicker('startDate', startDate, 'date')}
      {renderDateTimePicker('startTime', startTime, 'time')}
      {renderDateTimePicker('endDate', endDate, 'date')}
      {renderDateTimePicker('endTime', endTime, 'time')}

      {/* Camera Bottom Sheet for document upload */}
      <CameraBottomSheet
        refRBSheet={cameraSheetRef}
        onPick={handleCameraCapture}
        cameraType={'back'}
        document
      />
    </View>
  );
};

// Memoized Label component
const Label = React.memo(({text, required, isDarkMode}) => {
  const style = useMemo(
    () => ({
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.5),
      marginTop: hp(1.5),
    }),
    [isDarkMode],
  );

  return (
    <Text style={style}>
      {text}
      {required && <Text style={{color: '#ef4444'}}> *</Text>}
    </Text>
  );
});

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    headerTitle: {
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: wp(5),
      paddingBottom: hp(3),
    },
    inputContainer: {
      backgroundColor: isDarkMode ? Colors.darkTheme.input : 'transparent',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfWidth: {
      width: '48%',
    },
    dateTimeInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      marginBottom: hp(1),
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
    },
    dateTimeText: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsMedium,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      minHeight: hp(15),
      textAlignVertical: 'top',
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsRegular,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    uploadBox: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: wp(2),
      paddingVertical: hp(3),
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    uploadText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginTop: hp(1),
    },
    uploadHint: {
      fontSize: RFPercentage(1.3),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.QuaternaryText,
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.5),
    },
    documentsList: {
      marginTop: hp(1),
    },
    documentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: wp(2),
      marginBottom: hp(0.5),
    },
    documentName: {
      flex: 1,
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    removeDoc: {
      fontSize: RFPercentage(1.6),
      color: '#ef4444',
      paddingLeft: wp(2),
    },
    toggleSection: {
      marginTop: hp(2),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      paddingTop: hp(1),
    },
    locationSettings: {
      marginTop: hp(2),
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    locationInput: {
      flex: 1,
    },
    fullMapButton: {
      padding: hp(1),
      borderRadius: wp(3),
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },

    buttonContainer: {
      paddingVertical: hp(2),
      paddingHorizontal: wp(5),
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    createButton: {
      paddingVertical: hp(2),
      borderRadius: wp(3),
      alignItems: 'center',
    },
  });

export default CreateTask;
