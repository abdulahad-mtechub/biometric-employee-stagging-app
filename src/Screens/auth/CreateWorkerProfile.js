import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryList from 'country-list-with-dial-code-and-flag';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {logout} from '../../redux/Slices/authSlice';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {
  getCompanies,
  getDepartmentsByCompId,
  uploadDocument,
  uploadImage,
} from '../../Constants/api';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {Images} from '../../assets/Images/Images';
import {Svgs} from '../../assets/Svgs/Svgs';
import CameraBottomSheet from '../../components/BottomSheets/CameraBottomSheet';
import CustomButton from '../../components/Buttons/customButton';
import CustomDateTimePicker from '../../components/DateTimeModal/CustomDateTimePicker';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import NumericStepper from '../../components/NumericStepper';
import CInputWithCountryCode from '../../components/TextInput/CInputWithCountryCode';
import TxtInput from '../../components/TextInput/Txtinput';
import {pxToPercentage} from '../../utils/responsive';
import useBackHandler from '../../utils/useBackHandler';

const normalizeSearchText = value =>
  (value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = string =>
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CreateWorkerProfile = ({navigation}) => {
  const dispatch = useDispatch();
  const [CompanyName, setCompanyName] = useState('');
  const [Designation, setDesignation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    // Find US specifically by country code, not just dial code
    const countryData = CountryList.findByCountryCode('US');
    if (countryData && countryData.data) {
      return countryData.data;
    }
    // Fallback to hardcoded US data
    return {
      name: 'United States',
      dial_code: '+1',
      code: 'US',
      flag: '🇺🇸',
    };
  });
  const [DOB, setDOB] = useState('');
  const {isDarkMode} = useSelector(store => store?.theme);
  const [image, setImage] = useState(null);
  const {t, i18n} = useTranslation();
  const [step, setStep] = useState(5);
  const totalSteps = 4;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;
  const cameraSheet_ref = useRef();
  const {showAlert} = useAlert();
  const [company, setcompany] = useState('');
  const [position, setPosition] = useState('');
  const [WorkingId, setWorkingId] = useState('');
  const [HireDate, setHireDate] = useState('');
  const [Department, setDepartment] = useState('');
  const [EmploymentType, setEmploymentType] = useState('');
  const [Shift, setShift] = useState('');
  const [Zone, setZone] = useState('');
  const [Countries, setCountries] = useState('');
  const [Cities, setCities] = useState('');
  // Currency fixed to USD; no dropdown needed
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showHireDatePicker, setShowHireDatePicker] = useState(false);
  const [salary, setSalary] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [workingHoursError, setWorkingHoursError] = useState('');

  // National ID states
  const [nationalIdFrontImage, setNationalIdFrontImage] = useState(null);
  const [nationalIdBackImage, setNationalIdBackImage] = useState(null);
  const nationalIdSheet_ref = useRef();

  // Company search states
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [searchedCompanies, setSearchedCompanies] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Enhanced validation states
  const [errors, setErrors] = useState({
    CompanyName: false,
    firstName: false,
    lastName: false,
    DOB: false,
    company: false,
    position: false,
    WorkingId: false,
    Department: false,
    departmentId: false,
    Designation: false,
    EmploymentType: false,
    HireDate: false,
    Shift: false,
    phoneNumber: false,
    profileImage: false,
    salary: false,
    nationalId: false,
  });

  const [errorMessages, setErrorMessages] = useState({
    CompanyName: '',
    firstName: '',
    lastName: '',
    DOB: '',
    company: '',
    position: '',
    WorkingId: '',
    Department: '',
    departmentId: '',
    Designation: '',
    EmploymentType: '',
    HireDate: '',
    Shift: '',
    phoneNumber: '',
    profileImage: '',
    salary: '',
    nationalId: '',
  });

  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Clear old data when starting a new registration
  useEffect(() => {
    const clearOldData = async () => {
      try {
        // Clear Redux auth state
        dispatch(logout());

        // Clear ALL previous registration and session data
        // NOTE: Do NOT clear profile_token here - it's needed for profile completion
        // profile_token should only be cleared after successful registration
        await AsyncStorage.multiRemove([
          'rememberedAccount',
          'localuserData',
          'isLoggedIn',
          'signupData', // Clear old signup data - new user needs fresh data
          // 'profile_token', // DON'T CLEAR THIS - needed for profile completion
          'jwt_token',
          'workerPersonalData',
          'workerCompanyData',
          'workerEmploymentData',
          'workerLocationData',
          'selectedLocation',
          'FaceImageUrl',
          'workerProfileData',
          'profile_user_data',
          'profile_user_id',
        ]);
        console.log('✅ All old data cleared on CreateWorkerProfile mount');
      } catch (error) {
        console.log('⚠️ Error clearing old data:', error.message);
      }
    };

    clearOldData();
  }, [dispatch]);

  // Phone number validation function
  const validatePhoneNumber = phone => {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  // position validation function
  // const validatePosition = code => {
  //   return code.length >= 3;
  // };

  // Salary validation function
  const validateSalary = salaryValue => {
    if (!salaryValue) return true;
    const salaryNum = parseFloat(salaryValue.replace(/[^0-9.]/g, ''));
    return !isNaN(salaryNum) && salaryNum >= 0;
  };

  // Working hours validation function
  const validateWorkingHours = hours => {
    if (!hours.trim()) {
      setWorkingHoursError('Working hours are required');
      return false;
    }
    setWorkingHoursError('');
    return true;
  };

  const formatDate = date => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const handleDOBConfirm = date => {
    try {
      const formattedDate = formatDate(date);
      setDOB(formattedDate);
      setErrors(prev => ({...prev, DOB: false}));
      setErrorMessages(prev => ({...prev, DOB: ''}));
      setShowDOBPicker(false);
    } catch (error) {
      console.error('DOB handling error:', error);
    }
  };

  const handleHireDateConfirm = date => {
    try {
      const formattedDate = formatDate(date);
      setHireDate(formattedDate);
      setErrors(prev => ({...prev, HireDate: false}));
      setErrorMessages(prev => ({...prev, HireDate: ''}));
      setShowHireDatePicker(false);
    } catch (error) {
      console.error('Hire date handling error:', error);
    }
  };

  // Enhanced validation functions with National ID validation
  const validateCurrentStep = () => {
    const newErrors = {...errors};
    const newErrorMessages = {...errorMessages};
    let isValid = true;

    switch (index) {
      case 1: // Personal Details
        // Profile image validation
        if (!image?.path) {
          newErrors.profileImage = true;
          newErrorMessages.profileImage = t('Profile picture is required');
          isValid = false;
        } else {
          newErrors.profileImage = false;
          newErrorMessages.profileImage = '';
        }

        // First Name validation
        if (!firstName.trim()) {
          newErrors.firstName = true;
          newErrorMessages.firstName = t('First name is required');
          isValid = false;
        } else {
          newErrors.firstName = false;
          newErrorMessages.firstName = '';
        }

        // Last Name validation
        if (!lastName.trim()) {
          newErrors.lastName = true;
          newErrorMessages.lastName = t('Last name is required');
          isValid = false;
        } else {
          newErrors.lastName = false;
          newErrorMessages.lastName = '';
        }

        // DOB validation
        if (!DOB.trim()) {
          newErrors.DOB = true;
          newErrorMessages.DOB = t('Date of birth is required');
          isValid = false;
        } else {
          const dobDate = new Date(DOB);
          const today = new Date();
          let age = today.getFullYear() - dobDate.getFullYear();
          const monthDiff = today.getMonth() - dobDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dobDate.getDate())
          ) {
            age--;
          }

          if (age < 18) {
            newErrors.DOB = true;
            newErrorMessages.DOB = t('You must be at least 18 years old');
            isValid = false;
          } else {
            newErrors.DOB = false;
            newErrorMessages.DOB = '';
          }
        }

        // National ID validation - optional field (not required)
        // Removed required validation - National ID documents are now optional

        // Phone number is required and must be valid
        if (!phoneNumber.trim()) {
          newErrors.phoneNumber = true;
          newErrorMessages.phoneNumber = t('Phone number is required');
          isValid = false;
        } else if (!validatePhoneNumber(phoneNumber)) {
          newErrors.phoneNumber = true;
          newErrorMessages.phoneNumber = t('Please enter a valid phone number');
          isValid = false;
        } else {
          newErrors.phoneNumber = false;
          newErrorMessages.phoneNumber = '';
        }
        break;

      case 2: // Company Details
        // Company validation
        if (!selectedCompanyId) {
          newErrors.company = true;
          newErrorMessages.company = t('Company selection is required');
          isValid = false;
        } else {
          newErrors.company = false;
          newErrorMessages.company = '';
        }

        // Department validation
        if (!selectedDepartmentId) {
          newErrors.departmentId = true;
          newErrorMessages.departmentId = t('Department selection is required');
          isValid = false;
        } else {
          newErrors.departmentId = false;
          newErrorMessages.departmentId = '';
        }

        // Company selection validation
        if (!company.trim() && !position.trim()) {
          newErrors.company = true;
          newErrors.position = true;
          newErrorMessages.company = t(
            'Please select a company or enter position',
          );
          newErrorMessages.position = t(
            'Please select a company or enter position',
          );
          isValid = false;
        } else {
          newErrors.company = false;
          newErrors.position = false;
          newErrorMessages.company = '';
          newErrorMessages.position = '';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setErrorMessages(newErrorMessages);
    return isValid;
  };

  const handleFieldChange = (field, value) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: false}));
      setErrorMessages(prev => ({...prev, [field]: ''}));
    }

    // Update the corresponding state
    switch (field) {
      case 'CompanyName':
        setCompanyName(value);
        break;
      case 'firstName':
        setFirstName(value);
        break;
      case 'middleName':
        setMiddleName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'company':
        setcompany(value);
        break;
      case 'position':
        setPosition(value);
        break;
      case 'WorkingId':
        setWorkingId(value);
        break;
      case 'Department':
        setDepartment(value);
        break;
      case 'Designation':
        setDesignation(value);
        break;
      case 'EmploymentType':
        setEmploymentType(value);
        break;
      case 'Shift':
        setShift(value);
        break;
      case 'phoneNumber':
        setPhoneNumber(value);
        if (value.trim() && !validatePhoneNumber(value)) {
          setErrors(prev => ({...prev, phoneNumber: true}));
          setErrorMessages(prev => ({
            ...prev,
            phoneNumber: 'Please enter a valid phone number',
          }));
        } else {
          setErrors(prev => ({...prev, phoneNumber: false}));
          setErrorMessages(prev => ({...prev, phoneNumber: ''}));
        }
        break;
      case 'salary':
        setSalary(value);
        if (value.trim() && !validateSalary(value)) {
          setErrors(prev => ({...prev, salary: true}));
          setErrorMessages(prev => ({
            ...prev,
            salary: 'Please enter a valid salary amount',
          }));
        } else {
          setErrors(prev => ({...prev, salary: false}));
          setErrorMessages(prev => ({...prev, salary: ''}));
        }
        break;
      default:
        break;
    }
  };

  const handleWorkingHoursChange = value => {
    setWorkingHours(value);
    if (workingHoursError) {
      validateWorkingHours(value);
    }
  };

  // Company search: list comes from GET public/companies (client-side filter only).
  // Match admin-style search: normalize spaces, substring + word-boundary phrase, escape regex.
  const handleCompanySearch = () => {
    if (!companySearchQuery.trim()) {
      setSearchError(t('Please enter search query'));
      setSearchedCompanies([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');

    setTimeout(() => {
      const query = normalizeSearchText(companySearchQuery);
      if (!query) {
        setSearchError(t('Please enter search query'));
        setSearchedCompanies([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      const scored = [];

      for (const company of companies) {
        const companyName = normalizeSearchText(company.name);
        const companyEmail = normalizeSearchText(company.email);

        let score = 0;

        if (companyName === query || companyEmail === query) {
          score = 100;
        } else {
          try {
            const phrase = new RegExp(`\\b${escapeRegExp(query)}\\b`);
            if (phrase.test(companyName) || phrase.test(companyEmail)) {
              score = 80;
            }
          } catch {
            /* ignore invalid regex */
          }
        }

        if (score === 0) {
          if (
            companyName.startsWith(query) ||
            companyEmail.startsWith(query)
          ) {
            score = 60;
          } else if (
            companyName.includes(query) ||
            companyEmail.includes(query)
          ) {
            score = 40;
          }
        }

        if (score > 0) {
          scored.push({company, score});
        }
      }

      scored.sort((a, b) => b.score - a.score);
      const results = scored.map(s => s.company);

      if (results.length === 0) {
        setSearchError(t('No companies match your search'));
        setSearchedCompanies([]);
        setShowSearchResults(false);
      } else {
        setSearchedCompanies(results);
        setShowSearchResults(true);
        setSearchError('');
      }

      setIsSearching(false);
    }, 300);
  };

  // Handle selecting a company from search results
  const handleSelectSearchedCompany = companyId => {
    const selectedCompany = companies.find(c => c.value === companyId);
    if (selectedCompany) {
      setcompany(selectedCompany.name);
      setSelectedCompanyId(companyId);
      setErrors(prev => ({...prev, company: false}));
      setErrorMessages(prev => ({...prev, company: ''}));
      setShowSearchResults(false);
      setCompanySearchQuery('');
      setSearchError('');

      // Reset department when company changes
      setSelectedDepartmentId(null);
      setDepartment('');
      setErrors(prev => ({...prev, departmentId: false}));
      setErrorMessages(prev => ({...prev, departmentId: ''}));
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanies();
        if (!response.error && response.data?.companies) {
          const formattedCompanies = response.data.companies.map(company => ({
            label: company.business_email
              ? `${company.name}\n${company.business_email}`
              : company.name,
            value: company.id,
            name: company.name,
            email: company.business_email,
          }));
          setCompanies(formattedCompanies);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        showAlert('Error fetching companies', 'error');
      }
    };

    fetchCompanies();
  }, []);
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedCompanyId) {
        setDepartments([]);
        return;
      }

      try {
        const response = await getDepartmentsByCompId(selectedCompanyId);
        console.log('Departments response:', JSON.stringify(response, null, 2));
        if (response.success !== false) {
          setDepartments(response?.data?.departments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        showAlert('Error fetching departments', 'error');
      }
    };

    fetchDepartments();
  }, [selectedCompanyId]);

  const handleCompanyChange = value => {
    const selectedCompany = companies.find(c => c.value === value);
    setcompany(selectedCompany?.name || value);
    setSelectedCompanyId(value);
    setErrors(prev => ({...prev, company: false}));
    setErrorMessages(prev => ({...prev, company: ''}));

    // Reset department when company changes
    setSelectedDepartmentId(null);
    setDepartment('');
    setErrors(prev => ({...prev, departmentId: false}));
    setErrorMessages(prev => ({...prev, departmentId: ''}));
  };

  const handleDepartmentChange = value => {
    const selectedDept = departments.find(d => d.id === value);
    setDepartment(selectedDept?.name || value);
    setSelectedDepartmentId(value);
    setErrors(prev => ({...prev, departmentId: false}));
    setErrorMessages(prev => ({...prev, departmentId: ''}));
  };

  // Currency dropdown removed; currency is fixed to USD.

  const goBack = () => {
    if (index === 4) {
      setIndex(3);
      setStep(3);
    } else if (index === 3) {
      setIndex(2);
      setStep(2);
    } else if (index === 2) {
      setIndex(1);
      setStep(1);
    } else if (index === 1) {
      setIndex(0);
    }
  };

  useBackHandler(() => {
    goBack();
  });

  const handleImageUpload = img => {
    setImage(img);
    setErrors(prev => ({...prev, profileImage: false}));
    setErrorMessages(prev => ({...prev, profileImage: ''}));
  };

  const handleContinue = async () => {
    console.log('➡️ handleContinue called | current index:', index);
    console.log(
      '🔄 Current state - index:',
      index,
      'step:',
      step,
      'isLoading:',
      isLoading,
    );

    if (isLoading) {
      console.log('⚠️ Already processing, ignoring click');
      return;
    }

    setIsLoading(true);
    console.log('🔒 Set loading to true');

    // Validate current step
    const isValid = validateCurrentStep();
    console.log('✅ validateCurrentStep result:', isValid);

    if (!isValid) {
      console.log('❌ Validation failed at step:', index);
      setIsLoading(false);
      console.log('🔓 Set loading to false - validation failed');
      showAlert(t('Please fill all required fields correctly'), 'error');
      return;
    }

    try {
      switch (index) {
        case 0:
          console.log('🟢 STEP 0 → Moving to STEP 1');
          setIndex(1);
          break;

        case 1: {
          console.log('🟢 STEP 1 → Uploading personal data');

          const profileImageResponse = await uploadImage(image);
          console.log('✅ Profile image uploaded:', profileImageResponse);

          // Check if profile image upload failed
          if (profileImageResponse.success === false) {
            console.error(
              '❌ Profile image upload failed:',
              profileImageResponse.message,
            );
            showAlert(
              'Failed to upload profile image. Please try again.',
              'error',
            );
            return;
          }

          let nationalIdFrontUrl = null;
          let nationalIdBackUrl = null;

          if (nationalIdFrontImage) {
            nationalIdFrontUrl =
              nationalIdFrontImage.type === 'document'
                ? await uploadDocument(nationalIdFrontImage)
                : await uploadImage(nationalIdFrontImage);
            console.log('✅ National ID Front uploaded:', nationalIdFrontUrl);

            // Check if upload failed
            if (nationalIdFrontUrl?.success === false) {
              console.error(
                '❌ National ID Front upload failed:',
                nationalIdFrontUrl.message,
              );
              showAlert(
                'Failed to upload National ID Front. Please try again.',
                'error',
              );
              return;
            }
          }

          if (nationalIdBackImage) {
            nationalIdBackUrl =
              nationalIdBackImage.type === 'document'
                ? await uploadDocument(nationalIdBackImage)
                : await uploadImage(nationalIdBackImage);
            console.log('✅ National ID Back uploaded:', nationalIdBackUrl);

            // Check if upload failed
            if (nationalIdBackUrl?.success === false) {
              console.error(
                '❌ National ID Back upload failed:',
                nationalIdBackUrl.message,
              );
              showAlert(
                'Failed to upload National ID Back. Please try again.',
                'error',
              );
              return;
            }
          }

          const personalData = {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            dob: DOB,
            phone: phoneNumber,
            profile_image: profileImageResponse?.data?.url || '',
            national_id_document_front: nationalIdFrontUrl?.data?.url || '',
            national_id_document_back: nationalIdBackUrl?.data?.url || '',
          };

          console.log('💾 Saving workerPersonalData:', personalData);
          await AsyncStorage.setItem(
            'workerPersonalData',
            JSON.stringify(personalData),
          );

          console.log('➡️ STEP 1 completed → Moving to STEP 2');
          console.log('🔄 Setting index to 2, step to 2');
          setIndex(2);
          setStep(2);
          console.log('✅ State update called');
          break;
        }

        case 2: {
          console.log('🟢 STEP 2 → Company info');

          console.log('🏢 selectedCompanyId:', selectedCompanyId);
          console.log('🧑‍💼 position:', position);

          if (!selectedCompanyId && !position.trim()) {
            console.log('❌ Company validation failed');
            showAlert('Please select a company or enter position', 'error');
            return;
          }

          const companyData = {
            company_id: selectedCompanyId,
            department_id: selectedDepartmentId,
            workspace_code: position,
          };

          console.log('💾 Saving workerCompanyData:', companyData);
          await AsyncStorage.setItem(
            'workerCompanyData',
            JSON.stringify(companyData),
          );

          console.log('➡️ STEP 2 completed → Moving to STEP 3');
          setIndex(3);
          setStep(3);
          break;
        }

        case 3: {
          console.log('🟢 STEP 3 → Location details');

          const locationData = {
            assign_region: Zone,
            assign_zone: Zone,
            country: Countries,
            city: Cities,
          };

          console.log('💾 Saving workerLocationData:', locationData);
          await AsyncStorage.setItem(
            'workerLocationData',
            JSON.stringify(locationData),
          );

          console.log('🚀 Navigating to PROFILE VERIFICATION');
          navigation.navigate(SCREENS.PROFILEVERIFICATION);
          break;
        }

        default:
          console.log('⚠️ Unknown step index:', index);
          break;
      }
      console.log('✅ Step completed successfully');
      setIsLoading(false);
      console.log('🔓 Set loading to false - success');
    } catch (error) {
      console.log('🔥 ERROR in handleContinue at step:', index);
      console.log(error);
      setIsLoading(false);
      console.log('🔓 Set loading to false - error');
      showAlert('Error saving data', 'error');
    }
  };

  const styles = dynamicStyles(isDarkMode, errors);

  const CreateProfileComponent = () => {
    return (
      <View style={styles.inputsContainer}>
        <View style={styles.paginationContainer}>
          <Text style={[styles.paginationText, styles.activeText]}>1</Text>
          <View style={styles.line} />
          <Text style={styles.paginationText}>2</Text>
        </View>
        <View style={[styles.contentContainer, {alignItems: 'center'}]}>
          <Svgs.Logo />
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>{t('Profile Registration')}</Text>
            <Text style={styles.subheading}>
              <Text style={{fontFamily: Fonts.NunitoBold}}>
                {t('Employee Registration')}
                {': '}
              </Text>
              {t('Tell us about yourself')}
            </Text>
          </View>

          <View style={{flex: 1, alignItems: 'center', marginTop: hp(7)}}>
            <Image
              source={Images.CreateCompanyProfile}
              style={{height: hp(40), width: hp(40), resizeMode: 'contain'}}
            />
          </View>
        </View>
      </View>
    );
  };

  const CompanyNameComponent = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.inputsContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>{t('Create Profile')}</Text>
            <Text style={styles.subheading}>
              {t('Add your personal details')}
            </Text>
          </View>

          <View style={{flex: 1}}>
            <View style={styles.imageSection}>
              {image?.path ? (
                <>
                  <Image
                    source={{uri: image.path}}
                    style={styles.profileImage}
                  />
                  <Svgs.editCircled
                    style={styles.editIcon}
                    onPress={() => cameraSheet_ref.current.open()}
                  />
                </>
              ) : (
                <Svgs.addAccImagePlaceHolder
                  height={hp(15)}
                  width={wp(23)}
                  style={[
                    styles.placeholderImage,
                    errors.profileImage && styles.errorImagePlaceholder,
                  ]}
                />
              )}

              {errors.profileImage && (
                <Text style={styles.errorText}>
                  {errorMessages.profileImage}
                </Text>
              )}

              {!image?.path && (
                <CustomButton
                  text={t('Upload Profile Picture')}
                  onPress={() => cameraSheet_ref.current.open()}
                  containerStyle={styles.uploadButton}
                  textStyle={styles.uploadButtonText}
                />
              )}
            </View>

            <Text style={styles.label}>
              {t('First Name')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <TxtInput
              value={firstName}
              containerStyle={[
                styles.inputField,
                errors.firstName && styles.errorInput,
              ]}
              placeholder={t('Enter your first name')}
              onChangeText={value => handleFieldChange('firstName', value)}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errorMessages.firstName}</Text>
            )}

            <Text style={styles.label}>{t('Middle Name')}</Text>
            <TxtInput
              value={middleName}
              containerStyle={styles.inputField}
              placeholder={t('Enter your middle name')}
              onChangeText={value => handleFieldChange('middleName', value)}
            />

            <Text style={styles.label}>
              {t('Last Name')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <TxtInput
              value={lastName}
              containerStyle={[
                styles.inputField,
                errors.lastName && styles.errorInput,
              ]}
              placeholder={t('Enter your last name')}
              onChangeText={value => handleFieldChange('lastName', value)}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errorMessages.lastName}</Text>
            )}

            <Text style={styles.label}>
              {t('Date of Birth (DOB)')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDOBPicker(true)}
              style={{width: '100%'}}>
              <TxtInput
                value={DOB}
                containerStyle={[
                  styles.inputField,
                  errors.DOB && styles.errorInput,
                ]}
                placeholder={t('Select your birth date')}
                editable={false}
                rightSvg={<Svgs.calenderL />}
                rightIconPress={() => setShowDOBPicker(true)}
                rightIconContainerStyle={{
                  marginRight: wp(2),
                  backgroundColor: isDarkMode
                    ? Colors.darkTheme.backgroundColor
                    : Colors.lightTheme.backgroundColor,
                }}
              />
            </TouchableOpacity>
            {errors.DOB && (
              <Text style={styles.errorText}>{errorMessages.DOB}</Text>
            )}

            {/* National ID Section (both front and back required) */}
            <Text style={styles.label}>{t('National ID Document')}</Text>
            <View style={styles.nationalIdSection}>
              {/* Front Image */}
              {/* <Text style={styles.nationalIdSubLabel}>{t('Front Side')}</Text> */}
              {nationalIdFrontImage?.path ? (
                <View style={styles.nationalIdImageContainer}>
                  {nationalIdFrontImage.type !== 'document' ? (
                    <Image
                      source={{uri: nationalIdFrontImage.path}}
                      style={styles.nationalIdImage}
                    />
                  ) : (
                    <View style={styles.pdfContainer}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={RFPercentage(16)}
                        color="red"
                      />
                      <Text style={styles.pdfText} numberOfLines={1}>
                        {nationalIdFrontImage.name}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.nationalIdEditIcon}
                    onPress={() => nationalIdSheet_ref.current.open('front')}>
                    <MaterialCommunityIcons
                      name="pencil"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nationalIdRemoveIcon}
                    onPress={() => {
                      setNationalIdFrontImage(null);
                      setErrors(prev => ({...prev, nationalId: false}));
                      setErrorMessages(prev => ({...prev, nationalId: ''}));
                    }}>
                    <MaterialCommunityIcons
                      name="close"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.nationalIdUploadButton,
                    errors.nationalId && styles.nationalIdUploadButtonError,
                  ]}
                  onPress={() => nationalIdSheet_ref.current.open('front')}>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={RFPercentage(3)}
                    color={
                      isDarkMode
                        ? Colors.darkTheme.QuaternaryText
                        : Colors.lightTheme.QuaternaryText
                    }
                  />
                  <Text style={styles.nationalIdUploadText}>
                    {t('Upload National ID')}
                  </Text>
                  <Text style={styles.nationalIdHint}>
                    {t('Upload a clear photo of the National ID')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Back Image */}
              {/* <Text style={[styles.nationalIdSubLabel, {marginTop: hp(2)}]}>
                {t('Back Side')}
              </Text>
              {nationalIdBackImage?.path ? (
                <View style={styles.nationalIdImageContainer}>
                  {nationalIdBackImage.type !== 'document' ? (
                    <Image
                      source={{uri: nationalIdBackImage.path}}
                      style={styles.nationalIdImage}
                    />
                  ) : (
                    <View style={styles.pdfContainer}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={RFPercentage(16)}
                        color="red"
                      />
                      <Text style={styles.pdfText} numberOfLines={1}>
                        {nationalIdBackImage.name}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.nationalIdEditIcon}
                    onPress={() => nationalIdSheet_ref.current.open('back')}>
                    <MaterialCommunityIcons
                      name="pencil"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nationalIdRemoveIcon}
                    onPress={() => {
                      setNationalIdBackImage(null);
                      setErrors(prev => ({...prev, nationalId: false}));
                      setErrorMessages(prev => ({...prev, nationalId: ''}));
                    }}>
                    <MaterialCommunityIcons
                      name="close"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.nationalIdUploadButton,
                    errors.nationalId && styles.nationalIdUploadButtonError,
                  ]}
                  onPress={() => nationalIdSheet_ref.current.open('back')}>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={RFPercentage(3)}
                    color={
                      isDarkMode
                        ? Colors.darkTheme.QuaternaryText
                        : Colors.lightTheme.QuaternaryText
                    }
                  />
                  <Text style={styles.nationalIdUploadText}>
                    {t('Upload Back Side')}
                  </Text>
                  <Text style={styles.nationalIdHint}>
                    {t('Upload a clear photo of the back side')}
                  </Text>
                </TouchableOpacity>
              )} */}

              {errors.nationalId && (
                <Text
                  style={[
                    styles.errorText,
                    {
                      marginTop: hp(1),
                    },
                  ]}>
                  {errorMessages.nationalId}
                </Text>
              )}
            </View>

            <Text style={styles.label}>
              {t('Phone Number')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <CInputWithCountryCode
              phoneNo={phoneNumber}
              setPhoneNo={value => handleFieldChange('phoneNumber', value)}
              setCountryCode={setCountryCode}
              countryCode={countryCode}
              selectedCountry={selectedCountry}
              setSelectedCountry={setSelectedCountry}
              placeholder="(555) 123-4567"
              width="100%"
              placeholderTextColor={
                isDarkMode
                  ? Colors.darkTheme.QuaternaryText
                  : Colors.lightTheme.QuaternaryText
              }
              containerStyle={errors.phoneNumber && styles.errorInput}
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errorMessages.phoneNumber}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const CompanyDetails = () => {
    return (
      <ScrollView
        contentContainerStyle={[styles.inputsContainer]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={[styles.headerContainer, {marginBottom: hp(5)}]}>
            <Text style={styles.heading}>{t('Company Details')}</Text>
            <Text style={styles.subheading}>{t('Choose your company')}</Text>
          </View>
          <View style={styles.helperMessageContainer}>
            <MaterialCommunityIcons
              name="information-outline"
              size={RFPercentage(2)}
              color={
                isDarkMode
                  ? Colors.darkTheme.primaryColor
                  : Colors.lightTheme.primaryColor
              }
            />
            <Text style={styles.helperText}>
              {t(
                'Please provide the exact company name. If you’re not sure what it is, reach out to the administrator to confirm.',
              )}
            </Text>
          </View>

          {/* Company Search Section */}
          <Text style={styles.label}>
            {t('Search your company')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <MaterialCommunityIcons
                name="office-building-outline"
                size={RFPercentage(2.5)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor
                }
                style={styles.searchIcon}
              />
              <TextInput
                value={companySearchQuery}
                placeholder={t('Type company name or email...')}
                placeholderTextColor={
                  isDarkMode
                    ? Colors.darkTheme.QuaternaryText
                    : Colors.lightTheme.QuaternaryText
                }
                onChangeText={value => {
                  setCompanySearchQuery(value);
                  if (searchError) {
                    setSearchError('');
                  }
                  if (showSearchResults) {
                    setShowSearchResults(false);
                  }
                }}
                onSubmitEditing={handleCompanySearch}
                returnKeyType="search"
                style={[
                  styles.searchTextInput,
                  searchError && styles.searchTextInputError,
                ]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {companySearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setCompanySearchQuery('');
                    setSearchError('');
                    setShowSearchResults(false);
                    setSearchedCompanies([]);
                    // Also clear department states
                    setSelectedCompanyId(null);
                    setcompany('');
                    setSelectedDepartmentId(null);
                    setDepartment('');
                    setDepartments([]);
                  }}
                  style={styles.clearButton}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={RFPercentage(2.2)}
                    color={
                      isDarkMode
                        ? Colors.darkTheme.secondryTextColor
                        : Colors.lightTheme.secondryTextColor
                    }
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                isSearching && styles.searchButtonDisabled,
              ]}
              onPress={handleCompanySearch}
              disabled={isSearching || !companySearchQuery.trim()}>
              {isSearching ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.lightTheme.backgroundColor}
                />
              ) : (
                <MaterialCommunityIcons
                  name="magnify"
                  size={RFPercentage(2.8)}
                  color={Colors.lightTheme.backgroundColor}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Error Message */}
          {searchError && (
            <View style={styles.searchErrorContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={RFPercentage(2.2)}
                color={Colors.error}
              />
              <Text style={styles.searchErrorText}>{searchError}</Text>
            </View>
          )}

          {/* Selected Company Display */}
          {selectedCompanyId && company && (
            <View style={styles.selectedCompanyContainer}>
              <View style={styles.selectedCompanyInfo}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={RFPercentage(2.5)}
                  color={
                    isDarkMode
                      ? Colors.darkTheme.primaryColor
                      : Colors.lightTheme.primaryColor
                  }
                />
                <View style={{flex: 1, marginLeft: wp(2)}}>
                  <Text style={styles.selectedCompanyName}>{company}</Text>
                  {companies.find(c => c.value === selectedCompanyId)
                    ?.email && (
                    <Text style={styles.selectedCompanyEmail}>
                      {
                        companies.find(c => c.value === selectedCompanyId)
                          ?.email
                      }
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCompanyId(null);
                    setcompany('');
                    setSelectedDepartmentId(null);
                    setDepartment('');
                  }}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={RFPercentage(2.5)}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Search Results */}
          {showSearchResults && searchedCompanies.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsTitle}>
                {t('Search Results')} ({searchedCompanies.length})
              </Text>
              {searchedCompanies.map((company, index) => (
                <TouchableOpacity
                  key={company.value}
                  style={[
                    styles.searchResultItem,
                    index === searchedCompanies.length - 1 &&
                      styles.searchResultItemLast,
                  ]}
                  onPress={() => handleSelectSearchedCompany(company.value)}>
                  <View style={styles.searchResultContent}>
                    <MaterialCommunityIcons
                      name="office-building"
                      size={RFPercentage(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor
                      }
                    />
                    <View style={{flex: 1, marginLeft: wp(2)}}>
                      <Text style={styles.searchResultName}>
                        {company.name}
                      </Text>
                      {company.email && (
                        <Text style={styles.searchResultEmail}>
                          {company.email}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={RFPercentage(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.secondryTextColor
                          : Colors.lightTheme.secondryTextColor
                      }
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {errors.company && (
            <Text style={styles.errorText}>{errorMessages.company}</Text>
          )}

          <Text style={styles.label}>
            {t('Select Department')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <CustomDropDown
            data={departments.map(dept => ({
              label: dept.name,
              value: dept.id,
            }))}
            selectedValue={selectedDepartmentId}
            onValueChange={handleDepartmentChange}
            placeholder={t('Select your department')}
            containerStyle={[
              styles.dropdownContainer,
              errors.departmentId && {
                backgroundColor: '#FFE6E6',
                borderColor: Colors.error,
                borderWidth: 1,
                borderRadius: 10,
                overflow: 'hidden',
              },
            ]}
            width={'100%'}
          />
          {errors.departmentId && (
            <Text style={styles.errorText}>{errorMessages.departmentId}</Text>
          )}

          <Text style={styles.label}>{t('Position')}</Text>
          <TxtInput
            value={position}
            containerStyle={[styles.inputField]}
            placeholder={t('Enter your company position')}
            onChangeText={value => handleFieldChange('position', value)}
          />
        </View>
      </ScrollView>
    );
  };

  const renderView = () => {
    switch (index) {
      case 1:
        return CompanyNameComponent();
      case 2:
        return CompanyDetails();
      default:
        return CreateProfileComponent();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: hp(10),
          paddingTop: hp(2),
        }}
        style={{flex: 1}}>
        {index !== 0 && (
          <View style={styles.backArrowContainer}>
            <MaterialCommunityIcons
              name={'chevron-left'}
              size={RFPercentage(4)}
              color={
                isDarkMode
                  ? Colors.darkTheme.secondryTextColor
                  : Colors.lightTheme.iconColor
              }
              onPress={goBack}
            />
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View style={[styles.progressFill, {width: `${progress}%`}]} />
              </View>
              <Text style={styles.stepText}>{`${step}/${totalSteps}`}</Text>
            </View>
          </View>
        )}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {renderView()}
        </TouchableWithoutFeedback>
      </ScrollView>

      <View style={[styles.btnContainer]}>
        {isLoading ? (
          <View
            style={[
              styles.continueButton,
              {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <ActivityIndicator
              size="small"
              color={isDarkMode ? '#fff' : '#000'}
            />
            <Text style={[styles.continueButtonText, {marginLeft: 10}]}>
              Processing...
            </Text>
          </View>
        ) : (
          <CustomButton
            text={'Next'}
            onPress={handleContinue}
            textStyle={styles.continueButtonText}
            containerStyle={[styles.continueButton]}
          />
        )}
      </View>

      <CameraBottomSheet
        refRBSheet={cameraSheet_ref}
        onPick={handleImageUpload}
        cameraType={'front'}
      />

      {/* National ID Camera Bottom Sheet */}
      <CameraBottomSheet
        refRBSheet={nationalIdSheet_ref}
        onPick={img => {
          // Determine which side to update based on how the sheet was opened
          const side = img.side || 'front';
          if (side === 'front') {
            setNationalIdFrontImage(img);
          } else {
            setNationalIdBackImage(img);
          }
          setErrors(prev => ({...prev, nationalId: false}));
          setErrorMessages(prev => ({...prev, nationalId: ''}));
        }}
        document={true}
        cameraType={'front'}
      />

      <CustomDateTimePicker
        isVisible={showDOBPicker}
        onClose={() => setShowDOBPicker(false)}
        onConfirm={handleDOBConfirm}
        mode="date"
      />

      <CustomDateTimePicker
        isVisible={showHireDatePicker}
        onClose={() => setShowHireDatePicker(false)}
        onConfirm={handleHireDateConfirm}
        mode="date"
      />
    </View>
  );
};

export default CreateWorkerProfile;

const dynamicStyles = (isDarkMode, errors) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: wp(9),
    },
    paginationContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      marginBottom: hp(3),
    },
    line: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      height: hp(0.2),
      alignSelf: 'center',
      width: wp(30),
      marginHorizontal: wp(1),
    },
    paginationText: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.BorderGrayColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(100),
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.2),
    },
    activeText: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderWidth: 1,
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: wp(5),
      marginBottom: hp(2),
    },
    progressContainer: {
      flex: 1,
      marginLeft: 10,
      alignItems: 'center',
      flexDirection: 'row',
    },
    progressBackground: {
      height: hp(1),
      backgroundColor: '#ddd',
      borderRadius: 4,
      width: '80%',
      overflow: 'hidden',
      marginRight: hp(2),
    },
    progressFill: {
      height: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    stepText: {
      fontSize: 12,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    headerContainer: {
      alignItems: 'center',
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(25)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    subheading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp(85),
    },
    inputsContainer: {
      paddingBottom: hp(5),
      flex: 1,
    },
    imageSection: {
      alignItems: 'center',
    },
    profileImage: {
      height: hp(12),
      width: hp(12),
      borderRadius: hp(10),
      alignSelf: 'center',
      marginVertical: hp(2),
    },
    editIcon: {
      position: 'absolute',
      right: wp(28),
      top: hp(10),
    },
    placeholderImage: {
      alignSelf: 'center',
    },
    errorImagePlaceholder: {
      borderColor: Colors.error,
      borderWidth: 2,
      borderRadius: hp(10),
    },
    uploadButton: {
      alignSelf: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      alignItems: 'center',
      marginBottom: hp(3),
    },
    errorUploadButton: {
      borderColor: Colors.error,
      borderWidth: 1,
    },
    uploadButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.secondryBtn.TextColor
        : Colors.lightTheme.secondryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(18)),
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
    inputField: {
      borderRadius: wp(3),
      marginBottom: hp(2),
    },
    // Error styles
    errorInput: {
      backgroundColor: '#FFE6E6',
      borderColor: Colors.error,
      borderWidth: 1,
    },
    errorText: {
      color: Colors.error,
      fontSize: RFPercentage(pxToPercentage(12)),
      fontFamily: Fonts.PoppinsRegular,
      marginTop: -hp(1),
      marginBottom: hp(1),
      marginLeft: wp(2),
    },
    // Dropdown styles
    dropdownContainer: {
      zIndex: 10000,
      marginRight: wp(5),
      width: '100%',
      position: 'relative',
    },
    dropdownButton: {
      paddingVertical: hp(1.8),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(3),
    },
    // Error styles for dropdowns
    errorDropdownContainer: {
      marginBottom: hp(3),
    },
    errorDropdownButton: {
      backgroundColor: '#FFE6E6',
      borderColor: Colors.error,
      borderWidth: 1,
    },
    errorDropdown: {
      backgroundColor: '#FFE6E6',
      borderColor: Colors.error,
    },
    btnContainer: {
      paddingTop: wp(5),
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.2),
      borderRadius: wp(3),
      alignItems: 'center',
      marginBottom: hp(2),
    },
    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    orContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hp(2),
      marginBottom: hp(4),
    },
    orLine: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      height: hp(0.2),
      width: wp(30),
      alignSelf: 'center',
    },
    selectedZone: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      backgroundColor: '#579DFF',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      borderRadius: wp(1),
      marginRight: wp(2),
      marginBottom: hp(1),
    },
    SalarydropdownContainer: {
      zIndex: 500,
      width: '30%',
      position: 'relative',
      borderWidth: 0,
    },
    dropdownInput: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : 'transparent',
      marginBottom: hp(2),
      position: 'relative',
      zIndex: 1000,
    },
    currenySign: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginRight: wp(2),
    },
    CurrencyStyle: {
      justifyContent: 'center',
    },
    fieldContainer: {
      marginBottom: hp(2),
    },
    label: {
      fontSize: RFPercentage(2),
      color: '#000',
      marginBottom: hp(0.5),
    },
    uploadBox: {
      height: hp(6),
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f8f8',
    },
    uploadText: {
      color: '#666',
      fontSize: RFPercentage(1.8),
    },
    uploadedText: {
      color: '#000',
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
    },
    // National ID Styles
    nationalIdSection: {
      marginBottom: hp(2),
    },
    nationalIdImageContainer: {
      position: 'relative',
      alignItems: 'center',
      backgroundColor: Colors.lightTheme.secondryColor,
      borderRadius: wp(3),
      // padding: wp(2),
    },
    nationalIdImage: {
      height: hp(30),
      width: '100%',
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    pdfContainer: {
      alignItems: 'center',
    },
    pdfText: {
      width: '20%',
    },
    nationalIdEditIcon: {
      position: 'absolute',
      top: wp(1),
      right: wp(1),
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: wp(2),
      padding: wp(1.5),
    },
    nationalIdRemoveIcon: {
      position: 'absolute',
      top: wp(1),
      left: wp(1),
      backgroundColor: 'rgba(220, 38, 38, 0.8)',
      borderRadius: wp(2),
      padding: wp(1.5),
    },
    nationalIdUploadButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(3),
      padding: wp(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
    },
    nationalIdUploadButtonError: {
      borderColor: Colors.error,
    },
    nationalIdUploadText: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginTop: hp(1),
      textAlign: 'center',
    },
    nationalIdHint: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.QuaternaryText
        : Colors.lightTheme.QuaternaryText,
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.5),
      textAlign: 'center',
    },
    nationalIdSubLabel: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.5),
    },
    helperMessageContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDarkMode
        ? 'rgba(87, 157, 255, 0.1)'
        : 'rgba(87, 157, 255, 0.05)',
      borderLeftWidth: 3,
      borderLeftColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      padding: wp(3),
      borderRadius: wp(2),
      marginTop: hp(1),
      marginBottom: hp(2),
    },
    helperText: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginLeft: wp(2),
      flex: 1,
      lineHeight: hp(2.5),
    },
    // Company Search Styles
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1.5),
      gap: wp(2),
    },
    searchInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      borderWidth: 1.5,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      paddingHorizontal: wp(3),
      height: hp(7),
    },
    searchIcon: {
      marginRight: wp(2),
    },
    searchTextInput: {
      flex: 1,
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      // paddingVertical: 0,
    },
    searchTextInputError: {
      borderColor: Colors.error,
    },
    clearButton: {
      padding: wp(1),
      marginLeft: wp(1),
    },
    searchButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      height: hp(7),
      width: wp(15),
      borderRadius: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3.84,
      elevation: 5,
    },
    searchButtonDisabled: {
      opacity: 0.6,
    },
    searchErrorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(220, 38, 38, 0.1)'
        : 'rgba(220, 38, 38, 0.05)',
      padding: wp(3.5),
      borderRadius: wp(2.5),
      marginBottom: hp(2),
      marginTop: hp(1),
      borderLeftWidth: 4,
      borderLeftColor: Colors.error,
    },
    searchErrorText: {
      flex: 1,
      marginLeft: wp(2.5),
      color: Colors.error,
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsMedium,
      lineHeight: hp(2.2),
    },
    selectedCompanyContainer: {
      marginBottom: hp(2),
    },
    selectedCompanyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? 'rgba(87, 157, 255, 0.15)'
        : 'rgba(87, 157, 255, 0.08)',
      padding: wp(4),
      borderRadius: wp(3),
      borderWidth: 1.5,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    selectedCompanyName: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    selectedCompanyEmail: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.3),
    },
    searchResultsContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginBottom: hp(2),
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    searchResultsTitle: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      padding: wp(4),
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(87, 157, 255, 0.08)',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    searchResultItem: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    searchResultItemLast: {
      borderBottomWidth: 0,
    },
    searchResultContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(4),
      backgroundColor: isDarkMode
        ? 'transparent'
        : Colors.lightTheme.backgroundColor,
    },
    searchResultName: {
      fontSize: RFPercentage(1.75),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(0.2),
    },
    searchResultEmail: {
      fontSize: RFPercentage(1.45),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.2),
    },
  });
