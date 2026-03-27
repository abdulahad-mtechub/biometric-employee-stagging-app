import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import {saveOfflineRequest} from '../../services/OfflineLeaveRequestQueue';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import CustomSwitch from '../../components/Buttons/CustomSwitch';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import MultiSelectDropdown from '../../components/DropDown/MultiSelectDropdown';
import TxtInput from '../../components/TextInput/Txtinput';
import {createRequest} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {pxToPercentage} from '../../utils/responsive';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const SubmitLeaveRequest = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const {showAlert} = useAlert();
  const localizedAlert = useLocalizedAlert();
  const [name, setName] = useState('');
  const [is1day, setIs1day] = useState(false);
  const [halfDay, setHalfDay] = useState(false);
  const [halfTime, setHalfTime] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [isLoading, setIsLoading] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const token = useSelector(state => state?.auth?.user?.token);
  const [leaveCode, setLeaveCode] = useState('');
  const [currentDays, setCurrentDays] = useState([]);
  const [currentStartTime, setCurrentStartTime] = useState('');
  const [currentEndTime, setCurrentEndTime] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date());
  const [details, setDetails] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const [errors, setErrors] = useState({
    name: '',
    halfTime: '',
    description: '',
    date: '',
    leaveCode: '',
    leaveType: '',
    currentDays: '',
    currentStartTime: '',
    currentEndTime: '',
    effectiveFrom: '',
    details: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    halfTime: false,
    description: false,
    leaveCode: false,
    leaveType: false,
    currentDays: false,
    currentStartTime: false,
    currentEndTime: false,
    effectiveFrom: false,
    details: false,
  });

  const leaveTypes = [
    {label: t('Sick Leave'), value: 'SICK'},
    {label: t('Urgent Leave'), value: 'URGENT'},
    {label: t('Vacation'), value: 'VACATION'},
    {label: t('Other'), value: 'OTHER'},
  ];

  const leaveCodes = [
    {label: t('Leave'), value: 'LEAVE'},
    {label: t('Schedule Change'), value: 'SCHEDULE_CHANGE'},
    {label: t('General Request'), value: 'GENERIC_HR'},
  ];

  const weekDays = [
    {label: t('Monday'), value: 'MON'},
    {label: t('Tuesday'), value: 'TUE'},
    {label: t('Wednesday'), value: 'WED'},
    {label: t('Thursday'), value: 'THU'},
    {label: t('Friday'), value: 'FRI'},
    {label: t('Saturday'), value: 'SAT'},
    {label: t('Sunday'), value: 'SUN'},
  ];

  const timeSlots = [
    {label: '09:00', value: '09:00'},
    {label: '10:00', value: '10:00'},
    {label: '11:00', value: '11:00'},
    {label: '12:00', value: '12:00'},
    {label: '13:00', value: '13:00'},
    {label: '14:00', value: '14:00'},
    {label: '15:00', value: '15:00'},
    {label: '16:00', value: '16:00'},
    {label: '17:00', value: '17:00'},
    {label: '18:00', value: '18:00'},
    {label: '19:00', value: '19:00'},
    {label: '20:00', value: '20:00'},
    {label: '21:00', value: '21:00'},
  ];

  const validateField = (field, value) => {
    let error = '';

    switch (field) {
      case 'name':
        if (!value.trim()) error = t('Subject is required');
        else if (value.trim().length < 3)
          error = t('Subject must be at least 3 characters');
        break;

      case 'halfTime':
        if (halfDay && !value) error = t('Please select half time');
        break;

      case 'description':
        if (leaveCode === 'LEAVE' && !value.trim())
          error = t('Reason is required');
        else if (leaveCode === 'SCHEDULE_CHANGE' && !value.trim())
          error = t('Reason is required');
        else if (value.trim() && value.trim().length < 5)
          error = t('Description must be at least 5 characters');
        break;

      case 'details':
        if (leaveCode === 'GENERIC_HR' && !value.trim())
          error = t('Details are required');
        else if (value.trim() && value.trim().length < 10)
          error = t('Details must be at least 10 characters');
        break;

      case 'leaveCode':
        if (!value) error = t('Request Type is required');
        break;

      case 'leaveType':
        if (leaveCode === 'LEAVE' && !value)
          error = t('Leave Reason is required');
        break;

      case 'currentDays':
        if (leaveCode === 'SCHEDULE_CHANGE' && (!value || value.length === 0))
          error = t('Please select current working days');
        break;

      case 'currentStartTime':
        if (leaveCode === 'SCHEDULE_CHANGE' && !value)
          error = t('Current start time is required');
        break;

      case 'currentEndTime':
        if (leaveCode === 'SCHEDULE_CHANGE' && !value)
          error = t('Current end time is required');
        break;

      case 'effectiveFrom':
        if (
          leaveCode === 'SCHEDULE_CHANGE' &&
          effectiveFrom < new Date().setHours(0, 0, 0, 0)
        )
          error = t('Effective date cannot be in the past');
        break;

      case 'date':
        if (leaveCode === 'LEAVE' && !is1day && !halfDay && startDate > endDate)
          error = t('End date cannot be before start date');
        break;
    }

    return error;
  };

  const validateForm = () => {
    const baseErrors = {
      leaveCode: validateField('leaveCode', leaveCode),
      name: validateField('name', name),
    };

    let typeSpecificErrors = {};

    if (leaveCode === 'LEAVE') {
      typeSpecificErrors = {
        leaveType: validateField('leaveType', leaveType),
        halfTime: validateField('halfTime', halfTime),
        description: validateField('description', description),
        date: validateField('date'),
      };
    } else if (leaveCode === 'SCHEDULE_CHANGE') {
      typeSpecificErrors = {
        currentDays: validateField('currentDays', currentDays),
        currentStartTime: validateField('currentStartTime', currentStartTime),
        currentEndTime: validateField('currentEndTime', currentEndTime),
        effectiveFrom: validateField('effectiveFrom'),
        description: validateField('description', description),
      };
    } else if (leaveCode === 'GENERIC_HR') {
      typeSpecificErrors = {
        details: validateField('details', details),
      };
    }

    const newErrors = {...baseErrors, ...typeSpecificErrors};
    setErrors(prev => ({...prev, ...newErrors}));

    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleBlur = field => {
    setTouched(prev => ({...prev, [field]: true}));

    let fieldValue;
    switch (field) {
      case 'name':
        fieldValue = name;
        break;
      case 'description':
        fieldValue = description;
        break;
      case 'details':
        fieldValue = details;
        break;
      case 'halfTime':
        fieldValue = halfTime;
        break;
      default:
        fieldValue = '';
    }

    const error = validateField(field, fieldValue);
    setErrors(prev => ({...prev, [field]: error}));
  };

  const handleSubmit = async () => {
    const baseTouched = {
      leaveCode: true,
      name: true,
    };

    let typeSpecificTouched = {};

    if (leaveCode === 'LEAVE') {
      typeSpecificTouched = {
        leaveType: true,
        halfTime: halfDay,
        description: true,
      };
    } else if (leaveCode === 'SCHEDULE_CHANGE') {
      typeSpecificTouched = {
        currentDays: true,
        currentStartTime: true,
        currentEndTime: true,
        effectiveFrom: true,
        description: true,
      };
    } else if (leaveCode === 'GENERIC_HR') {
      typeSpecificTouched = {
        details: true,
      };
    }

    setTouched(prev => ({...prev, ...baseTouched, ...typeSpecificTouched}));

    if (!validateForm()) {
      showAlert(t('Please fix the errors in the form'), 'error');
      return;
    }

    setIsLoading(true);

    try {
      let body = {
        type: leaveCode,
        subject: name,
      };

      if (leaveCode === 'LEAVE') {
        body = {
          ...body,
          leave_reason_code: leaveType,
          start_date: formatDate(startDate),
          end_date:
            is1day || halfDay ? formatDate(startDate) : formatDate(endDate),
          partial: halfDay,
          reason: description,
        };

        if (halfDay && halfTime) {
          const timeMapping = {
            '9:00 Am - 12:00 Pm': {start: 'FIRST_HALF', end: 'FIRST_HALF'},
            '12:00 Pm - 3:00 Pm': {start: 'SECOND_HALF', end: 'SECOND_HALF'},
            '3:00 Pm - 6:00 Pm': {start: 'SECOND_HALF', end: 'SECOND_HALF'},
          };

          const selectedTime = timeMapping[halfTime];
          if (selectedTime) {
            body.partial_start = selectedTime.start;
            body.partial_end = selectedTime.end;
          }
        }
      } else if (leaveCode === 'SCHEDULE_CHANGE') {
        body = {
          ...body,
          current_days: currentDays,
          current_start_time: currentStartTime,
          current_end_time: currentEndTime,
          effective_from: formatDate(effectiveFrom),
          reason: description,
        };
      } else if (leaveCode === 'GENERIC_HR') {
        body = {
          ...body,
          details: details,
        };
      }

      if (!isOnline) {
        const saved = await saveOfflineRequest(body, token);

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
        try {
          const response = await createRequest(body, token);
          localizedAlert(response, 'success');
          navigation.goBack();
        } catch (error) {
          console.log('API call failed, saving offline as fallback');
          const saved = await saveOfflineRequest(body, token);

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
    } catch (error) {
      localizedAlert(error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = date => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = date => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const openDatePicker = mode => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const handleDateConfirm = date => {
    setDatePickerVisible(false);

    if (datePickerMode === 'start') {
      setStartDate(date);
      if (is1day || halfDay) {
        setEndDate(date);
      }
    } else if (datePickerMode === 'end') {
      setEndDate(date);
    } else if (datePickerMode === 'effective') {
      setEffectiveFrom(date);
    }

    setErrors(prev => ({...prev, date: validateField('date')}));
  };

  const handleDateCancel = () => {
    setDatePickerVisible(false);
  };

  React.useEffect(() => {
    setIs1day(false);
    setHalfDay(false);
    setHalfTime('');
    setLeaveType('');
    setCurrentDays([]);
    setCurrentStartTime('');
    setCurrentEndTime('');
    setDescription('');
    setDetails('');
    setErrors({
      name: '',
      halfTime: '',
      description: '',
      date: '',
      leaveCode: '',
      leaveType: '',
      currentDays: '',
      currentStartTime: '',
      currentEndTime: '',
      effectiveFrom: '',
      details: '',
    });
    setTouched({
      name: false,
      halfTime: false,
      description: false,
      leaveCode: false,
      leaveType: false,
      currentDays: false,
      currentStartTime: false,
      currentEndTime: false,
      effectiveFrom: false,
      details: false,
    });
  }, [leaveCode]);

  // Update validation when halfDay or is1day changes
  React.useEffect(() => {
    if (touched.halfTime) {
      setErrors(prev => ({
        ...prev,
        halfTime: validateField('halfTime', halfTime),
      }));
    }
    setErrors(prev => ({...prev, date: validateField('date')}));

    // If it's a one-day or half-day leave, set end date to start date
    if (is1day || halfDay) {
      setEndDate(startDate);
    }
  }, [halfDay, is1day, halfTime, startDate, touched.halfTime]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    // Initial check on component mount
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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
            {leaveCode === 'LEAVE'
              ? t('Leave Request')
              : leaveCode === 'SCHEDULE_CHANGE'
                ? t('Schedule Change Request')
                : leaveCode === 'GENERIC_HR'
                  ? t('General Request')
                  : t('Leave Request')}
          </Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>{t('Request Details')}</Text>

          {/* Leave Type Selection */}
          <Text style={[styles.label]}>
            {t('Request Type')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <CustomDropDown
            data={leaveCodes}
            selectedValue={leaveCode}
            onValueChange={value => {
              setLeaveCode(value);
              if (touched.leaveCode) {
                setErrors(prev => ({
                  ...prev,
                  leaveCode: validateField('leaveCode', value),
                }));
              }
            }}
            placeholder={t('Select Request Type')}
            containerStyle={[
              styles.dropdownContainer,
              touched.leaveCode && errors.leaveCode && styles.inputError,
            ]}
            width={'100%'}
            btnStyle={{paddingVertical: hp(1.5)}}
          />
          {touched.leaveCode && errors.leaveCode ? (
            <Text style={styles.errorText}>{errors.leaveCode}</Text>
          ) : null}

          {/* Name Field with Validation */}
          <Text style={[styles.label]}>
            {t('Subject')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <TxtInput
            value={name}
            containerStyle={[
              styles.txtInputContainer,
              touched.name && errors.name && styles.inputError,
            ]}
            placeholder={t('Enter subject')}
            onChangeText={text => {
              setName(text);
              if (touched.name) {
                setErrors(prev => ({
                  ...prev,
                  name: validateField('name', text),
                }));
              }
            }}
            onBlur={() => handleBlur('name')}
          />
          {touched.name && errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}

          {/* Conditional Fields Based on Request Type */}
          {leaveCode === 'LEAVE' && (
            <>
              <Text style={[styles.label]}>
                {t('Leave Reason')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <CustomDropDown
                data={leaveTypes}
                selectedValue={leaveType}
                onValueChange={value => {
                  setLeaveType(value);
                  if (touched.leaveType) {
                    setErrors(prev => ({
                      ...prev,
                      leaveType: validateField('leaveType', value),
                    }));
                  }
                }}
                placeholder={t('Select Leave Reason')}
                containerStyle={[
                  styles.dropdownContainer,
                  touched.leaveType && errors.leaveType && styles.inputError,
                ]}
                width={'100%'}
                btnStyle={{paddingVertical: hp(1.5)}}
              />
              {touched.leaveType && errors.leaveType ? (
                <Text style={styles.errorText}>{errors.leaveType}</Text>
              ) : null}

              {leaveType !== 'VACATION' && (
                <>
                  <View style={styles.rowViewSb}>
                    <Text style={styles.label}>{t('One Day Leave')}</Text>
                    <CustomSwitch
                      value={is1day}
                      onValueChange={value => {
                        setIs1day(value);
                        if (value) {
                          setHalfDay(false);
                        }
                      }}
                    />
                  </View>

                  <View style={styles.rowViewSb}>
                    <Text style={styles.label}>{t('Half Day')}</Text>
                    <CustomSwitch
                      value={halfDay}
                      onValueChange={value => {
                        setHalfDay(value);
                        if (value) {
                          setIs1day(false);
                        }
                      }}
                    />
                  </View>
                </>
              )}

              {halfDay && (
                <View>
                  <CustomDropDown
                    data={[
                      '9:00 Am - 12:00 Pm',
                      '12:00 Pm - 3:00 Pm',
                      '3:00 Pm - 6:00 Pm',
                    ]}
                    selectedValue={halfTime}
                    onValueChange={value => {
                      setHalfTime(value);
                      if (touched.halfTime) {
                        setErrors(prev => ({
                          ...prev,
                          halfTime: validateField('halfTime', value),
                        }));
                      }
                    }}
                    placeholder={t('Select Half Time')}
                    containerStyle={[
                      styles.dropdownContainer,
                      touched.halfTime && errors.halfTime && styles.inputError,
                    ]}
                    width={'100%'}
                    btnStyle={{paddingVertical: hp(1.5)}}
                  />
                  {touched.halfTime && errors.halfTime ? (
                    <Text style={styles.errorText}>{errors.halfTime}</Text>
                  ) : null}
                </View>
              )}

              {is1day || halfDay ? (
                <View>
                  <Text style={styles.label}>{t('Date')}</Text>
                  <TouchableOpacity
                    style={[styles.input, errors.date && styles.inputError]}
                    onPress={() => openDatePicker('start')}>
                    <Text style={styles.dateText}>
                      {formatDisplayDate(startDate)}
                    </Text>
                    <View style={styles.iconRight}>{<Svgs.calenderL />}</View>
                  </TouchableOpacity>
                  {errors.date ? (
                    <Text style={styles.errorText}>{errors.date}</Text>
                  ) : null}
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>{t('Starting Date')}</Text>
                  <TouchableOpacity
                    style={[styles.input, errors.date && styles.inputError]}
                    onPress={() => openDatePicker('start')}>
                    <Text style={styles.dateText}>
                      {formatDisplayDate(startDate)}
                    </Text>
                    <View style={styles.iconRight}>{<Svgs.calenderL />}</View>
                  </TouchableOpacity>

                  <Text style={styles.label}>{t('Ending Date')}</Text>
                  <TouchableOpacity
                    style={[styles.input, errors.date && styles.inputError]}
                    onPress={() => openDatePicker('end')}>
                    <Text style={styles.dateText}>
                      {formatDisplayDate(endDate)}
                    </Text>
                    <View style={styles.iconRight}>{<Svgs.calenderL />}</View>
                  </TouchableOpacity>
                  {errors.date ? (
                    <Text style={styles.errorText}>{errors.date}</Text>
                  ) : null}
                </View>
              )}

              <Text style={[styles.label]}>
                {t('Reason')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.comments,
                  touched.description &&
                    errors.description &&
                    styles.inputError,
                ]}
                placeholder={t('Describe your leave request')}
                placeholderTextColor={
                  isDarkMode
                    ? Colors.darkTheme.QuaternaryText
                    : Colors.lightTheme.QuaternaryText
                }
                multiline
                value={description}
                onChangeText={text => {
                  setDescription(text);
                  if (touched.description) {
                    setErrors(prev => ({
                      ...prev,
                      description: validateField('description', text),
                    }));
                  }
                }}
                onBlur={() => handleBlur('description')}
              />
              {touched.description && errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : null}
            </>
          )}

          {leaveCode === 'SCHEDULE_CHANGE' && (
            <>
              <Text style={[styles.label]}>
                {t('Current Working Days')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <MultiSelectDropdown
                data={weekDays}
                selectedValue={currentDays}
                onValueChange={value => {
                  setCurrentDays(value);
                  if (touched.currentDays) {
                    setErrors(prev => ({
                      ...prev,
                      currentDays: validateField('currentDays', value),
                    }));
                  }
                }}
                placeholder="Select Working Days"
                width={'100%'}
                error={
                  touched.currentDays && errors.currentDays
                    ? errors.currentDays
                    : null
                }
              />

              <Text style={[styles.label]}>
                {t('Current Start Time')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <CustomDropDown
                data={timeSlots}
                selectedValue={currentStartTime}
                onValueChange={value => {
                  setCurrentStartTime(value);
                  if (touched.currentStartTime) {
                    setErrors(prev => ({
                      ...prev,
                      currentStartTime: validateField(
                        'currentStartTime',
                        value,
                      ),
                    }));
                  }
                }}
                placeholder={t('Select Start Time')}
                containerStyle={[
                  styles.dropdownContainer,
                  touched.currentStartTime &&
                    errors.currentStartTime &&
                    styles.inputError,
                ]}
                width={'100%'}
                btnStyle={{paddingVertical: hp(1.5)}}
              />
              {touched.currentStartTime && errors.currentStartTime ? (
                <Text style={styles.errorText}>{errors.currentStartTime}</Text>
              ) : null}

              <Text style={[styles.label]}>
                {t('Current End Time')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <CustomDropDown
                data={timeSlots}
                selectedValue={currentEndTime}
                onValueChange={value => {
                  setCurrentEndTime(value);
                  if (touched.currentEndTime) {
                    setErrors(prev => ({
                      ...prev,
                      currentEndTime: validateField('currentEndTime', value),
                    }));
                  }
                }}
                placeholder={t('Select End Time')}
                containerStyle={[
                  styles.dropdownContainer,
                  touched.currentEndTime &&
                    errors.currentEndTime &&
                    styles.inputError,
                ]}
                width={'100%'}
                btnStyle={{paddingVertical: hp(1.5)}}
              />
              {touched.currentEndTime && errors.currentEndTime ? (
                <Text style={styles.errorText}>{errors.currentEndTime}</Text>
              ) : null}

              <Text style={styles.label}>{t('Effective From')}</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  errors.effectiveFrom && styles.inputError,
                ]}
                onPress={() => openDatePicker('effective')}>
                <Text style={styles.dateText}>
                  {formatDisplayDate(effectiveFrom)}
                </Text>
                <View style={styles.iconRight}>{<Svgs.calenderL />}</View>
              </TouchableOpacity>
              {errors.effectiveFrom ? (
                <Text style={styles.errorText}>{errors.effectiveFrom}</Text>
              ) : null}

              <Text style={[styles.label]}>
                {t('Reason')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.comments,
                  touched.description &&
                    errors.description &&
                    styles.inputError,
                ]}
                placeholder={t('Describe your schedule change request')}
                placeholderTextColor={
                  isDarkMode
                    ? Colors.darkTheme.QuaternaryText
                    : Colors.lightTheme.QuaternaryText
                }
                multiline
                value={description}
                onChangeText={text => {
                  setDescription(text);
                  if (touched.description) {
                    setErrors(prev => ({
                      ...prev,
                      description: validateField('description', text),
                    }));
                  }
                }}
                onBlur={() => handleBlur('description')}
              />
              {touched.description && errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : null}
            </>
          )}

          {leaveCode === 'GENERIC_HR' && (
            <>
              <Text style={[styles.label]}>
                {t('Details')}
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.comments,
                  touched.details && errors.details && styles.inputError,
                ]}
                placeholder={t(
                  'Provide detailed information about your request',
                )}
                placeholderTextColor={
                  isDarkMode
                    ? Colors.darkTheme.QuaternaryText
                    : Colors.lightTheme.QuaternaryText
                }
                multiline
                value={details}
                onChangeText={text => {
                  setDetails(text);
                  if (touched.details) {
                    setErrors(prev => ({
                      ...prev,
                      details: validateField('details', text),
                    }));
                  }
                }}
                onBlur={() => handleBlur('details')}
              />
              {touched.details && errors.details ? (
                <Text style={styles.errorText}>{errors.details}</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      <View style={styles.btnContainer}>
        <CustomButton
          text={isLoading ? t('Submitting...') : t('Send')}
          onPress={handleSubmit}
          textStyle={styles.continueButtonText}
          containerStyle={styles.continueButton}
          disabled={isLoading}
        />
      </View>

      {/* Date Picker Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={isDatePickerVisible}
        onRequestClose={handleDateCancel}>
        <View style={styles.modalContainer}>
          <View style={styles.datePickerContainer}>
            <DatePicker
              date={
                datePickerMode === 'start'
                  ? startDate
                  : datePickerMode === 'end'
                  ? endDate
                  : effectiveFrom
              }
              onDateChange={date => {
                // Update the date in state when user changes it
                if (datePickerMode === 'start') {
                  setStartDate(date);
                } else if (datePickerMode === 'end') {
                  setEndDate(date);
                } else if (datePickerMode === 'effective') {
                  setEffectiveFrom(date);
                }
              }}
              mode="date"
              theme={isDarkMode ? 'dark' : 'light'}
            />
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleDateCancel}>
                <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() =>
                  handleDateConfirm(
                    datePickerMode === 'start'
                      ? startDate
                      : datePickerMode === 'end'
                      ? endDate
                      : effectiveFrom,
                  )
                }>
                <Text style={styles.confirmButtonText}>{t('Confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SubmitLeaveRequest;

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
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
      fontSize: RFPercentage(pxToPercentage(15)),
    },
    inputError: {
      borderColor: Colors.error,
    },
    comments: {
      height: hp(20),
      textAlignVertical: 'top',
    },
    uploadContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(20),
      marginBottom: hp(1),
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
      marginBottom: hp(1),
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
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : '#5E5F60',
      borderRadius: wp(10),
    },
    dateText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.QuaternaryText
        : Colors.lightTheme.QuaternaryText,
    },
    iconRight: {
      marginLeft: wp(2),
    },
    rowViewSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    dropdownContainer: {
      zIndex: 10000,
      marginRight: wp(5),
      width: '100%',
      marginBottom: hp(1),
      position: 'relative',
    },
    errorText: {
      color: Colors.error,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
      marginBottom: hp(1),
      marginTop: -hp(0.5),
    },
    // Date Picker Styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    datePickerContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(4),
      padding: wp(4),
      width: wp(90),
      alignItems: 'center',
    },
    datePickerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: hp(2),
    },
    cancelButton: {
      padding: wp(3),
      borderRadius: wp(2),
      backgroundColor: isDarkMode ? Colors.darkTheme.secondryColor : '#f0f0f0',
    },
    cancelButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    confirmButton: {
      padding: wp(3),
      borderRadius: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
    },
    confirmButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
  });
