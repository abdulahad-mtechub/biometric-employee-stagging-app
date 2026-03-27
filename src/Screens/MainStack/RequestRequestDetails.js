import {pick} from '@react-native-documents/picker';
import React, {useEffect, useMemo, useState} from 'react';
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
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import StackHeader from '../../components/Header/StackHeader';
import {getRequestDetails} from '../../Constants/api';
import {API_BASE_URL} from '../../Constants/Base_URL';
import {useButtonColors} from '../../Constants/colorHelper';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';

const RequestRequestDetails = ({navigation, route}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const transaction = route?.params?.item;
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitData, setResubmitData] = useState({
    subject: '',
    details: '',
    document: null,
  });
  const [isResubmitting, setIsResubmitting] = useState(false);
  const {showAlert} = useAlert();
  const [refresh, setRefresh] = useState(false);
  const [showFullSchedReason, setShowFullSchedReason] = useState(false);
  const [showFullLeaveReason, setShowFullLeaveReason] = useState(false);

  const fetchExpenseDetails = async expenseIdToFetch => {
    try {
      setLoading(true);

      const response = await getRequestDetails(expenseIdToFetch, token);
      console.log('=== Fetched Expense Details (raw):', response);
      try {
        console.log(
          '=== Fetched Expense Details (stringified):',
          JSON.stringify(response, null, 2),
        );
      } catch (e) {
        console.log('=== Could not stringify response:', e);
      }
      if (response && response.error === false) {
        setExpenseData(response.data);
      }
    } catch (error) {
      console.error('=== Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered', {
      expenseId: route.params?.expenseId,
      token,
      transaction,
      refresh,
    });
    if (route.params?.expenseId && token) {
      console.log(
        'Calling fetchExpenseDetails with expenseId:',
        route.params.expenseId,
      );
      fetchExpenseDetails(route.params.expenseId);
    } else if (transaction?.id && token) {
      console.log(
        'Calling fetchExpenseDetails with fallback transaction.id:',
        transaction.id,
      );
      fetchExpenseDetails(transaction.id);
    } else if (transaction) {
      setExpenseData(transaction);
      setLoading(false);
    }
  }, [route.params?.expenseId, token, transaction, refresh]);

  const formatDate = dateString => {
    if (!dateString) return t('N/A');
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = dateString => {
    if (!dateString) return t('N/A');
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTimeHM = timeStr => {
    if (!timeStr) return t('N/A');
    // Expecting HH:mm:ss or HH:mm
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const DAY_MAP = {
    MON: 'Mon',
    TUE: 'Tue',
    WED: 'Wed',
    THU: 'Thu',
    FRI: 'Fri',
    SAT: 'Sat',
    SUN: 'Sun',
  };

  const scheduleDays = useMemo(() => {
    const value = (expenseData || transaction)?.sched_current_days;
    if (!value) return [];
    return value
      .split(',')
      .map(d => d.trim())
      .filter(Boolean)
      .map(d => DAY_MAP[d] || d);
  }, [expenseData, transaction]);

  const StatusBox = ({status, backgroundColor, color, icon}) => (
    <View style={[styles.statusBadge, {backgroundColor}]}>
      {icon}
      <Text style={[styles.statusBadgeText, {color}]}>{t(status)}</Text>
    </View>
  );

  const renderDetailRow = (label, value) => (
    <View style={styles.rowViewSB}>
      <Text style={styles.detailLabel}>{t(label)}</Text>
      <Text style={styles.detailValue}>{value || t('N/A')}</Text>
    </View>
  );

  const handleCancelRequest = async () => {
    try {
      const requestToCancel = expenseData || transaction;
      if (!requestToCancel?.id) {
        showAlert('No request selected to cancel.');
        return;
      }

      console.log('Cancel request for:', requestToCancel.id);

      const response = await fetch(
        `${API_BASE_URL}requests/v1/requests/${requestToCancel.id}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('Full API Response:', result);

      if (result.error) {
        showAlert(`Cancellation failed: ${result.message}`);
      } else {
        showAlert(t('Request has been cancelled successfully!'));
        setTimeout(() => setRefresh(prev => !prev), 1000);
        navigation.goBack();
      }

      setShowDropdown(false);
    } catch (error) {
      console.error('Error cancelling request:', error);
      showAlert(`Error: ${error.message || 'Failed to cancel request'}`);
    }
  };

  // UPDATED: Document picker using the same pattern as UploadDocument.js
  const handleDocumentPick = async () => {
    try {
      const result = await pick({
        mode: 'open',
        type: ['application/pdf'],
        allowMultiSelection: false,
      });

      // Handle different response structures (same as UploadDocument.js)
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

      // Update resubmit data with the selected document
      setResubmitData(prev => ({
        ...prev,
        document: {
          name: selectedDoc.name || 'Unknown.pdf',
          size: selectedDoc.size || 0,
          uri: selectedDoc.uri,
          type: selectedDoc.type || 'application/pdf',
        },
      }));
    } catch (err) {
      console.log('DocumentPicker Error: ', err);
      console.log(err.code, err.message);

      // Handle different types of errors (same as UploadDocument.js)
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

  const handleRemoveDocument = () => {
    setResubmitData(prev => ({
      ...prev,
      document: null,
    }));
  };

  const handleResubmitRequest = async () => {
    try {
      if (!resubmitData.subject.trim() || !resubmitData.details.trim()) {
        showAlert('Please fill in all required fields');
        return;
      }

      setIsResubmitting(true);
      const requestToResubmit = expenseData || transaction;

      if (!requestToResubmit?.id) {
        showAlert('No request selected to resubmit.');
        return;
      }

      const formData = new FormData();
      formData.append('subject', resubmitData.subject);
      formData.append('details', resubmitData.details);

      if (resubmitData.document) {
        formData.append('document', {
          uri: resubmitData.document.uri,
          type: resubmitData.document.type,
          name: resubmitData.document.name,
        });
      }

      const response = await fetch(
        `${API_BASE_URL}requests/v1/requests/${requestToResubmit.id}/resubmit`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        showAlert(result.message || 'Failed to resubmit request');
      } else {
        showAlert(
          `Request has been resubmitted successfully! Status is now Pending.`,
          'success',
        );
        setTimeout(() => setRefresh(prev => !prev), 1000);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error resubmitting request:', error);
      showAlert(error.message || 'Failed to resubmit request');
    } finally {
      setIsResubmitting(false);
      setShowResubmitModal(false);
    }
  };

  // Open resubmit modal
  const openResubmitModal = () => {
    setShowResubmitModal(true);
    setResubmitData({
      subject: '',
      details: '',
      document: null,
    });
  };

  // Update resubmit form data
  const updateResubmitData = (field, value) => {
    setResubmitData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Enhanced cancel handler for modal
  const handleModalCancel = () => {
    setShowResubmitModal(false);
    setResubmitData({
      subject: '',
      details: '',
      document: null,
    });
  };

  const statusStyles = {
    approved: {
      backgroundColor: '#34D399',
      color: '#ffffff',
    },
    rejected: {
      backgroundColor: '#F87171',
      color: '#ffffff',
    },
    pending: {
      backgroundColor: '#F5CD47',
      color: '#000000',
    },
    info_requested: {
      backgroundColor: '#F59E0B',
      color: '#000000',
    },
  };

  const currentRequest = expenseData || transaction;
  const normalizedStatus = currentRequest?.status?.toLowerCase() || 'pending';
  const matchedKey = Object.keys(statusStyles).find(
    key => key.toLowerCase() === normalizedStatus,
  );
  const style = statusStyles[matchedKey] || statusStyles.pending;

  const isPending = normalizedStatus === 'pending';
  const isInfoRequested = normalizedStatus === 'info_requested';

  const getDropdownData = () => {
    if (isInfoRequested) {
      return [
        {
          label: t('Resubmit'),
          value: 'resubmit',
        },
      ];
    } else if (isPending) {
      return [
        {
          label: t('Cancel Request'),
          value: 'cancel',
        },
      ];
    }
    return [];
  };

  const dropdownData = getDropdownData();

  const handleDropdownChange = value => {
    if (value === 'cancel') {
      handleCancelRequest();
    } else if (value === 'resubmit') {
      openResubmitModal();
    }
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Text style={styles.statusText}>{t('Loading...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Request Details')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.5),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{paddingVertical: hp(2)}}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={styles.rowViewSB}>
            <Text
              style={[
                styles.statusText,
                {
                  marginTop: isPending || isInfoRequested ? hp(2) : hp(0),
                },
              ]}>
              {t('Status')}
            </Text>
            {isPending || isInfoRequested ? (
              <CustomDropDown
                data={dropdownData}
                selectedValue={showDropdown ? dropdownData[0]?.value : null}
                onValueChange={handleDropdownChange}
                placeholder={currentRequest?.status}
                width={wp(40)}
                checkBox={false}
                containerStyle={styles.dropdownWrapper}
              />
            ) : (
              <StatusBox
                status={currentRequest?.status}
                backgroundColor={style.backgroundColor}
                color={style.color}
                icon={style.icon}
              />
            )}
          </View>
          <View style={styles.rowViewSB}>
            <Text style={styles.detailLabel}>{t('Requested On')}</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(currentRequest?.created_at)}
            </Text>
          </View>

          {currentRequest?.resubmitted_at && (
            <View style={styles.rowViewSB}>
              <Text style={styles.detailLabel}>{t('Resubmitted On')}</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(currentRequest?.resubmitted_at)}
              </Text>
            </View>
          )}
        </View>

        {/* HR Request Details */}
        <View style={styles.sectionContainer}>
          {/* <View
            style={[
              styles.iconCircle,
              {backgroundColor: primaryButtonColors.backgroundColor},
            ]}>
            <Text style={styles.iconText}>HR</Text>
          </View> */}
          <Text style={styles.sectionTitle}>{t('Request Details')}</Text>

          {renderDetailRow('Request ID', `${currentRequest?.id}`)}
          {renderDetailRow('Type', currentRequest?.type)}

          {currentRequest?.subject &&
            renderDetailRow('Subject', currentRequest?.subject)}

          {currentRequest?.details && (
            <View style={{marginTop: hp(0.5)}}>
              <Text style={styles.detailLabel}>{t('Details')}</Text>
              <Text style={styles.longValueText}>
                {currentRequest?.details}
              </Text>
            </View>
          )}

          {currentRequest?.type === 'SCHEDULE_CHANGE' && (
            <View style={{marginTop: hp(1.5)}}>
              <Text style={styles.subSectionTitle}>{t('Schedule')}</Text>
              {!!scheduleDays?.length && (
                <View style={styles.chipsContainer}>
                  {scheduleDays.map((d, idx) => (
                    <View key={`${d}-${idx}`} style={styles.dayChip}>
                      <Text style={styles.chipText}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(currentRequest?.sched_current_start_time ||
                currentRequest?.sched_current_end_time) && (
                <View style={styles.rowViewSB}>
                  <Text style={styles.detailLabel}>{t('Working Hours')}</Text>
                  <Text style={styles.detailValue}>
                    {formatTimeHM(currentRequest?.sched_current_start_time)}
                    {' - '}
                    {formatTimeHM(currentRequest?.sched_current_end_time)}
                  </Text>
                </View>
              )}
              {currentRequest?.sched_effective_from && (
                <View style={styles.rowViewSB}>
                  <Text style={styles.detailLabel}>{t('Effective From')}</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(currentRequest?.sched_effective_from)}
                  </Text>
                </View>
              )}
              {currentRequest?.sched_reason_text && (
                <View style={{marginTop: hp(0.5)}}>
                  <Text style={styles.detailLabel}>{t('Reason')}</Text>
                  <Text
                    numberOfLines={showFullSchedReason ? undefined : 3}
                    style={styles.longValueText}>
                    {currentRequest?.sched_reason_text}
                  </Text>
                  {currentRequest?.sched_reason_text?.length > 120 && (
                    <TouchableOpacity
                      onPress={() => setShowFullSchedReason(p => !p)}
                      style={styles.readMoreBtn}>
                      <Text style={styles.readMoreText}>
                        {showFullSchedReason ? t('Show less') : t('Read more')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {currentRequest?.type === 'LEAVE' && (
            <View style={{marginTop: hp(1.5)}}>
              <Text style={styles.subSectionTitle}>{t('Leave')}</Text>
              {currentRequest?.leave_reason_code && (
                <View style={styles.rowViewSB}>
                  <Text style={styles.detailLabel}>{t('Reason')}</Text>
                  <Text style={styles.detailValue}>
                    {currentRequest?.leave_reason_code}
                  </Text>
                </View>
              )}
              {currentRequest?.leave_reason_text && (
                <View style={{marginTop: hp(0.5)}}>
                  <Text style={styles.detailLabel}>{t('Details')}</Text>
                  <Text
                    numberOfLines={showFullLeaveReason ? undefined : 3}
                    style={styles.longValueText}>
                    {currentRequest?.leave_reason_text}
                  </Text>
                  {currentRequest?.leave_reason_text?.length > 120 && (
                    <TouchableOpacity
                      onPress={() => setShowFullLeaveReason(p => !p)}
                      style={styles.readMoreBtn}>
                      <Text style={styles.readMoreText}>
                        {showFullLeaveReason ? t('Show less') : t('Read more')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {(currentRequest?.leave_start_date ||
                currentRequest?.leave_end_date) && (
                <View style={styles.rowViewSB}>
                  <Text style={styles.detailLabel}>{t('Dates')}</Text>
                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {currentRequest?.leave_start_date
                      ? formatDate(currentRequest?.leave_start_date)
                      : '—'}
                    {' - '}
                    {currentRequest?.leave_end_date
                      ? formatDate(currentRequest?.leave_end_date)
                      : '—'}
                  </Text>
                </View>
              )}
              {currentRequest?.leave_partial !== null && (
                <View style={styles.chipsContainer}>
                  <View
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: currentRequest?.leave_partial
                          ? '#F59E0B33'
                          : '#10B98133',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: currentRequest?.leave_partial
                            ? '#B45309'
                            : '#065F46',
                        },
                      ]}>
                      {currentRequest?.leave_partial
                        ? t('Partial Leave')
                        : t('Full Day Leave')}
                    </Text>
                  </View>
                </View>
              )}
              {currentRequest?.leave_partial &&
                (currentRequest?.leave_partial_start ||
                  currentRequest?.leave_partial_end) && (
                  <View style={styles.rowViewSB}>
                    <Text style={styles.detailLabel}>{t('Partial Hours')}</Text>
                    <Text style={styles.detailValue}>
                      {formatTimeHM(currentRequest?.leave_partial_start)}
                      {' - '}
                      {formatTimeHM(currentRequest?.leave_partial_end)}
                    </Text>
                  </View>
                )}
            </View>
          )}

          {currentRequest?.file_name && (
            <View style={styles.rowViewSB}>
              <Text style={styles.detailLabel}>{t('Attached Document')}</Text>
              <Text style={styles.detailValue}>
                {currentRequest?.file_name}
              </Text>
            </View>
          )}

          {currentRequest?.resubmit_subject &&
            renderDetailRow(
              'Resubmit Subject',
              currentRequest?.resubmit_subject,
            )}

          {currentRequest?.resubmit_details &&
            renderDetailRow(
              'Resubmit Details',
              currentRequest?.resubmit_details,
            )}
        </View>

        {currentRequest?.decided_at && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.iconCircle,
                {backgroundColor: primaryButtonColors.backgroundColor},
              ]}>
              <Text style={styles.iconText}>i</Text>
            </View>
            <Text style={styles.sectionTitle}>{t('Admin Decision')}</Text>
            {renderDetailRow('Decision Status', currentRequest?.status)}
            {renderDetailRow(
              t('Action Date'),
              formatDateTime(currentRequest?.decided_at),
            )}
            {renderDetailRow(
              t('Admin ID'),
              `${currentRequest?.decided_by_user_id || t('N/A')}`,
            )}
            {renderDetailRow(
              'Admin Comment',
              currentRequest?.admin_comment || t('No comment'),
            )}
          </View>
        )}
      </ScrollView>

      {/* Resubmit Modal */}
      <Modal
        visible={showResubmitModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalCancel}>
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t('Resubmit Request Details')}
              </Text>
              <Text style={styles.modalSubtitle}>
                {t('Please provide the additional information requested:')}
              </Text>

              {/* Subject Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {t('Subject')} <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('Enter subject...')}
                  placeholderTextColor="#999"
                  value={resubmitData.subject}
                  onChangeText={text => updateResubmitData('subject', text)}
                />
              </View>

              {/* Details Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {t('Details')} <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, styles.detailsInput]}
                  multiline
                  numberOfLines={4}
                  placeholder={t('Enter details...')}
                  placeholderTextColor="#999"
                  value={resubmitData.details}
                  onChangeText={text => updateResubmitData('details', text)}
                  textAlignVertical="top"
                />
              </View>

              {/* Document Upload */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {t('Document (Optional)')}
                </Text>
                <Text style={styles.inputSubLabel}>
                  {t('Upload PDF File (Max 10MB)')}
                </Text>

                {resubmitData.document ? (
                  <View style={styles.documentPreview}>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {resubmitData.document.name}
                      </Text>
                      <Text style={styles.documentSize}>
                        {resubmitData.document.size
                          ? `${(
                              resubmitData.document.size /
                              (1024 * 1024)
                            ).toFixed(2)} MB`
                          : t('Size unknown')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={handleRemoveDocument}>
                      <Text style={styles.removeButtonText}>{t('Remove')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleDocumentPick}>
                    <Text style={styles.uploadButtonText}>
                      {t('Click to upload document (PDF)')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleModalCancel}
                  disabled={isResubmitting}>
                  <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    {backgroundColor: primaryButtonColors.backgroundColor},
                    (!resubmitData.subject.trim() ||
                      !resubmitData.details.trim()) &&
                      styles.disabledButton,
                  ]}
                  onPress={handleResubmitRequest}
                  disabled={
                    isResubmitting ||
                    !resubmitData.subject.trim() ||
                    !resubmitData.details.trim()
                  }>
                  <Text style={styles.submitButtonText}>
                    {isResubmitting ? t('Submitting...') : t('Resubmit')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(4),
      marginVertical: wp(2),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: FontsSize.size16,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    statusBadge: {
      paddingHorizontal: wp(3),
      paddingVertical: wp(1),
      borderRadius: wp(4),
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusBadgeText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      marginLeft: wp(1),
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: hp(0.5),
    },
    sectionContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(4),
      marginVertical: wp(1),
      borderRadius: wp(2),
    },
    sectionTitle: {
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    subSectionTitle: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
    },
    detailLabel: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    detailValue: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsMedium,
      textAlign: 'right',
      flex: 1,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    longValueText: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      lineHeight: 20,
      textAlign: 'left',
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(1.5),
      marginVertical: hp(0.5),
    },
    dayChip: {
      paddingVertical: hp(0.6),
      paddingHorizontal: wp(2.5),
      borderRadius: wp(2),
      backgroundColor: isDarkMode ? '#2563EB33' : '#3B82F633',
    },
    chipText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: FontsSize.size12,
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    tagChip: {
      paddingVertical: hp(0.6),
      paddingHorizontal: wp(2.5),
      borderRadius: wp(2),
      alignSelf: 'flex-start',
    },
    tagText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: FontsSize.size12,
    },
    readMoreBtn: {
      marginTop: hp(0.5),
      alignSelf: 'flex-start',
    },
    readMoreText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: FontsSize.size12,
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    iconCircle: {
      width: hp(8),
      height: hp(8),
      borderRadius: hp(4),
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: wp(3),
    },
    iconText: {
      color: '#fff',
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsBold,
    },
    dropdownContainer: {
      marginRight: wp(2),
    },
    dropdownWrapper: {
      backgroundColor: '#F5CD47',
      borderRadius: wp(2),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
    },
    modalScrollView: {
      flex: 1,
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: wp(5),
    },
    modalContent: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(5),
      width: '100%',
      maxHeight: hp(80),
    },
    modalTitle: {
      fontSize: FontsSize.size18,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(3),
      textAlign: 'center',
    },
    sectionDivider: {
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#555' : '#ddd',
      paddingBottom: hp(1),
      marginBottom: hp(2),
    },
    sectionDividerText: {
      fontSize: FontsSize.size16,
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    inputContainer: {
      marginBottom: hp(2),
    },
    inputLabel: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
    },
    inputSubLabel: {
      fontSize: FontsSize.size12,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(1),
    },
    requiredStar: {
      color: '#FF0000',
    },
    textInput: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ddd',
      borderRadius: wp(2),
      padding: wp(3),
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    detailsInput: {
      minHeight: hp(12),
      textAlignVertical: 'top',
    },
    uploadButton: {
      borderWidth: 2,
      borderColor: isDarkMode ? '#555' : '#ddd',
      borderStyle: 'dashed',
      borderRadius: wp(2),
      padding: wp(4),
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadButtonText: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    documentPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ddd',
      borderRadius: wp(2),
      padding: wp(3),
      backgroundColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    documentInfo: {
      flex: 1,
      marginRight: wp(2),
    },
    documentName: {
      fontSize: FontsSize.size14,
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
    },
    documentSize: {
      fontSize: FontsSize.size12,
      fontFamily: Fonts.NunitoRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    removeButton: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      color: '#FFFFFF',
      fontSize: FontsSize.size24,
      fontFamily: Fonts.PoppinsBold,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: wp(3),
      marginTop: hp(2),
    },
    modalButton: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ddd',
    },
    submitButton: {},
    disabledButton: {
      backgroundColor: '#ccc',
    },
    cancelButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      fontSize: FontsSize.size14,
    },
    submitButtonText: {
      color: '#fff',
      fontFamily: Fonts.PoppinsMedium,
      fontSize: FontsSize.size14,
    },
  });

export default RequestRequestDetails;
