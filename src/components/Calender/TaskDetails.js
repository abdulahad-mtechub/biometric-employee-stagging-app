import {CommonActions} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as ImagePicker from 'react-native-image-picker';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {
  addTaskComment,
  taskDetails,
  taskStatus,
  uploadImage,
} from '../../Constants/api';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {getCurrentLocation} from '../../utils/LocationHelpers';
import CustomDropDown from '../DropDown/CustomDropDown';
import TaskComments from './TaskComments';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

export default function TaskDetail({route, navigation}) {
  const {task, taskId, previousScreen} = route?.params || {};
  const [taskData, setTaskData] = useState(task);
  const [comments, setComments] = useState([]);
  const {language} = useSelector(store => store?.auth);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(task?.status || null);
  const {isDarkMode} = useSelector(store => store?.theme);
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const {showAlert} = useAlert();
  const {t} = useTranslation();
  const localizedAlert = useLocalizedAlert();
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);
  const [selectedEvidenceImages, setSelectedEvidenceImages] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await taskDetails(task?.id ? task?.id : taskId, token);
      console.log(
        'Fetched task details response:',
        JSON.stringify(response, null, 3),
      );
      if (response.data?.task) {
        setTaskData(response.data.task);
        setComments(response.data.comments || []);
        setCurrentStatus(
          response.data.task?.status || response.data.task?.my_status,
        );
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, []);

  const handleAddComment = async commentData => {
    const body =
      typeof commentData === 'string' ? {body: commentData} : commentData;

    try {
      const response = await addTaskComment(
        task?.id ? task?.id : taskId,
        body,
        token,
      );
      console.log('Add comment response:', JSON.stringify(response, null, 3));
      if (response.data && !response.error) {
        const refreshResponse = await taskDetails(task?.id, token);
        if (refreshResponse.data?.comments) {
          setComments(refreshResponse.data.comments);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const getStatusOptions = () => {
    if (currentStatus === 'completed') {
      return [];
    }

    if (currentStatus === 'assigned') {
      return [{label: t('Start'), value: 'start', color: '#FF8C00'}];
    }

    if (currentStatus === 'in_progress') {
      return [{label: t('Completed'), value: 'completed', color: '#32CD32'}];
    }

    return [];
  };

  const getStatusDisplay = () => {
    if (!currentStatus) return t('Not Assigned');
    switch (currentStatus) {
      case 'assigned':
        return t('Assigned');
      case 'start':
        return t('Start');
      case 'completed':
        return t('Completed');
      default:
        return currentStatus;
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'assigned':
        return '#999';
      case 'start':
        return '#FF8C00';
      case 'complete':
        return '#32CD32';
      default:
        return '#999';
    }
  };

  const handleStatusChange = async newStatus => {
    if (!newStatus || newStatus === currentStatus) {
      return;
    }

    setPendingStatusChange(newStatus);

    if (taskData?.evidence_required && newStatus === 'completed') {
      setEvidenceModalVisible(true);
      return;
    }

    navigation.navigate(SCREENS.ATTENDANCEFACESCANNING, {
      onVerificationSuccess: imageUrl => {
        navigation.navigate(SCREENS.MAPSCREENATTENDANCE, {
          actionType: 'taskUpdation',
          taskId: taskId ? taskId : task?.id,
          selfieUrl: imageUrl,
          onTaskSuccess: selfie => {
            handleStatusUpdateWithLocationAndFace(
              newStatus,
              imageUrl,
              selfie,
              [],
            );
          },
        });
      },
    });
  };

  // Handle evidence image selection
  const selectEvidenceImages = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 0, // 0 means unlimited
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
      } else if (response.error) {
        showAlert(t('Error'), t('Failed to select images'));
      } else if (response.assets && response.assets.length > 0) {
        const newImages = response.assets.map(asset => ({
          uri: asset.uri,
          fileName: asset.fileName || `evidence_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        setSelectedEvidenceImages([...selectedEvidenceImages, ...newImages]);
      }
    });
  };

  // Remove an evidence image
  const removeEvidenceImage = index => {
    const updatedImages = [...selectedEvidenceImages];
    updatedImages.splice(index, 1);
    setSelectedEvidenceImages(updatedImages);
  };

  const uploadEvidenceAndUpdateStatus = async () => {
    // Check if evidence is required and no images selected
    if (taskData?.evidence_required && selectedEvidenceImages.length === 0) {
      showAlert(
        t('Evidence Required'),
        t('This task requires evidence files. Please add at least one image.'),
        'warning',
      );
      return;
    }

    setUploadingEvidence(true);

    try {
      const evidenceUrls = [];

      // Upload each evidence image only if there are any
      if (selectedEvidenceImages.length > 0) {
        for (const image of selectedEvidenceImages) {
          try {
            const response = await uploadImage(image, token);

            if (response?.data?.url) {
              evidenceUrls.push(response.data.url);
            }
          } catch (error) {
            showAlert(
              t('Upload Error'),
              t('Failed to upload some evidence images'),
              'error',
            );
          }
        }
      }

      setEvidenceModalVisible(false);
      setSelectedEvidenceImages([]);

      navigation.navigate(SCREENS.ATTENDANCEFACESCANNING, {
        onVerificationSuccess: imageUrl => {
          navigation.navigate(SCREENS.MAPSCREENATTENDANCE, {
            actionType: 'taskUpdation',
            taskId: taskId ? taskId : task?.id,
            selfieUrl: imageUrl,
            onTaskSuccess: selfie => {
              handleStatusUpdateWithLocationAndFace(
                pendingStatusChange,
                imageUrl,
                selfie,
                evidenceUrls,
              );
            },
          });
        },
      });
    } catch (error) {
      console.error('Error uploading evidence:', error);
      showAlert(t('Error'), t('Failed to upload evidence'));
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleStatusUpdateWithLocationAndFace = async (
    newStatus,
    faceFileId,
    selfie,
    evidenceUrls = [], // Ensure default empty array
  ) => {
    try {
      setLoading(true);

      let location = {latitude: 40.7128, longitude: -74.006};
      try {
        const locationResult = await getCurrentLocation();
        if (locationResult?.latitude && locationResult?.longitude) {
          location = {
            latitude: locationResult.latitude,
            longitude: locationResult.longitude,
          };
        }
      } catch (error) {
        console.log('Using default location due to error:', error);
      }

      const deviceId = await DeviceInfo.getUniqueId();
      const currentTimestamp = new Date().toISOString();

      const finalEvidenceUrls = Array.isArray(evidenceUrls) ? evidenceUrls : [];

      let body = {
        face_file_id: selfie,
        geo: {
          lat: location.latitude,
          lng: location.longitude,
          accuracy_m: 5,
        },
        local_timestamp: currentTimestamp,
        notes: t(
          'Task status changed to {{status}} successfully with all deliverables',
          {status: newStatus},
        ),
        evidence: finalEvidenceUrls,
      };
      console.log({body});

      const response = await taskStatus(
        task?.id ? task?.id : taskId,
        newStatus === 'completed' ? 'complete' : 'start',
        body,
        token,
      );

      if (response && response.data && !response.error) {
        setCurrentStatus(newStatus);
        localizedAlert(response, 'success');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: SCREENS.TASKS}],
          }),
        );
        setTaskData(prev => ({
          ...prev,
          status: response.data.task_status || newStatus,
          my_status: response.data.assignment_status || newStatus,
        }));

        const refreshResponse = await taskDetails(task?.id, token);
        if (refreshResponse?.data?.task) {
          setTaskData(refreshResponse.data.task);
          setComments(refreshResponse.data.comments || []);
          setCurrentStatus(
            refreshResponse.data.task?.my_status ||
              refreshResponse.data.task?.status,
          );
        }
      } else {
        localizedAlert(response, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Handle evidence requirement error specifically
      if (
        error.response?.data?.message?.includes('Evidence files are required')
      ) {
        showAlert(
          t('Evidence Required'),
          t(
            'This task requires evidence files for completion. Please add evidence and try again.',
          ),
          'error',
        );
      } else {
        const errorMsg =
          language === 'Español'
            ? error.response?.data?.message_es || t('Error occurred')
            : error.response?.data?.message_en || t('Error occurred');

        showAlert(errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (
    dateString /*, timeZone (ignored to use device locale) */,
  ) => {
    // Format date as DD-MM-YYYY using device locale/timezone to match web
    if (!dateString) return t('Not specified');
    try {
      const date = new Date(dateString);
      // Use device/local timezone by not passing a timeZone option
      const day = date.toLocaleDateString(undefined, {day: '2-digit'});
      const month = date.toLocaleDateString(undefined, {month: '2-digit'});
      const year = date.toLocaleDateString(undefined, {year: 'numeric'});
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (
    dateString /*, timeZone (ignored to use device locale) */,
  ) => {
    // Format date/time as "DD MMM YYYY, H:MM AM/PM" using device locale/timezone
    if (!dateString) return t('Not specified');
    try {
      const date = new Date(dateString);
      // Use device/local timezone by not specifying timeZone
      const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      // toLocaleString with undefined locale uses the device locale/timezone
      const formatted = date.toLocaleString(undefined, options);
      // Ensure a comma between date and time for consistency like earlier format
      return formatted.replace(',', ',');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#006EC2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Navigate back to the appropriate screen based on where we came from
            if (previousScreen === 'Home') {
              navigation.navigate(SCREENS.DASHBOARD, {
                screen: SCREENS.HOME,
              });
            } else {
              navigation.navigate(SCREENS.DASHBOARD, {
                screen: SCREENS.TASKS,
              });
            }
          }}>
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={styles.taskNumber}>
          T-{taskData?.id?.toString().padStart(3, '0')}
        </Text>
        {/* <View style={styles.statusContainer}>
          <Text style={[styles.statusText, {color: getStatusColor()}]}>
            {getStatusDisplay()}
          </Text>
        </View> */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              borderTopRightRadius: 1,
              borderTopLeftRadius: 1,
            },
          ]}>
          <Text style={styles.title} numberOfLines={2}>
            {taskData?.title}
          </Text>
          <CustomDropDown
            data={getStatusOptions()}
            placeholder={getStatusDisplay()}
            onValueChange={handleStatusChange}
            defaultButtonText={t('Select New Status')}
            width={130}
            multiSelect={false}
          />
        </View>

        <View
          style={[
            styles.card,
            {
              marginTop: -hp(3),
            },
          ]}>
          <Text style={styles.sectionTitle}>{t('Task Details')}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Assigned On')}</Text>
            <Text style={styles.detailValue}>
              {formatDate(taskData?.assigned_on)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Start Date & Time')}</Text>
            <Text style={styles.detailValue}>
              {formatTime(taskData?.start_at)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('End Date & Time')}</Text>
            <Text style={styles.detailValue}>
              {formatTime(taskData?.end_at)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Assigned By')}</Text>
            <View style={styles.assignedByContainer}>
              <View style={styles.nameContainer}>
                <Text style={styles.detailValue}>
                  {taskData?.assigned_by_name}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Priority')}</Text>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    taskData?.priority === 'high'
                      ? '#DC143C'
                      : taskData?.priority === 'medium'
                      ? '#FF8C00'
                      : '#32CD32',
                },
              ]}>
              <Text style={styles.priorityText}>
                {taskData?.priority?.toUpperCase() === 'HIGH'
                  ? t('High')
                  : taskData?.priority === 'MEDIUM'
                  ? t('Medium')
                  : t('Low')}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('Location')}</Text>
            <Text style={styles.detailValue}>
              {taskData?.location_address || t('Not specified')}
            </Text>
          </View>

          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>{t('Requirements')}:</Text>
            <View style={styles.requirementsRow}>
              <View
                style={[
                  styles.requirement,
                  {
                    backgroundColor: taskData?.face_required
                      ? '#E8F5E8'
                      : '#FFF3E0',
                  },
                ]}>
                <Text
                  style={[
                    styles.requirementText,
                    {color: taskData?.face_required ? '#2E7D32' : '#E65100'},
                  ]}>
                  {taskData?.face_required ? '✓' : '✗'} {t('Face Verification')}
                </Text>
              </View>
              <View
                style={[
                  styles.requirement,
                  {
                    backgroundColor: taskData?.location_required
                      ? '#E8F5E8'
                      : '#FFF3E0',
                  },
                ]}>
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: taskData?.location_required
                        ? '#2E7D32'
                        : '#E65100',
                    },
                  ]}>
                  {taskData?.location_required ? '✓' : '✗'}{' '}
                  {t('Location Check')}
                </Text>
              </View>
              <View
                style={[
                  styles.requirement,
                  {
                    backgroundColor: taskData?.evidence_required
                      ? '#E8F5E8'
                      : '#FFF3E0',
                  },
                ]}>
                <Text
                  style={[
                    styles.requirementText,
                    {
                      color: taskData?.evidence_required
                        ? '#2E7D32'
                        : '#E65100',
                    },
                  ]}>
                  {taskData?.evidence_required ? '✓' : '✗'}{' '}
                  {t('Evidence Required')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Description')}</Text>
          <Text style={styles.description}>{taskData?.description}</Text>
          {taskData?.productivity_rating && (
            <View style={{marginTop: 10}}>
              <Text style={{fontWeight: 'bold'}}>
                {t('Productivity Rating') + ':'}
              </Text>
              <Text style={styles.description}>
                {taskData.productivity_rating}
              </Text>
            </View>
          )}
          {taskData?.productivity_notes && (
            <View style={{marginTop: 5}}>
              <Text style={{fontWeight: 'bold'}}>
                {t('Productivity Notes') + ':'}
              </Text>
              <Text style={styles.description}>
                {taskData.productivity_notes}
              </Text>
            </View>
          )}
        </View>

        {comments.length > 0 && (
          <TaskComments
            comments={comments}
            taskId={task?.id}
            onAddComment={handleAddComment}
            loading={loading}
          />
        )}

        {comments.length === 0 && (
          <TaskComments
            comments={[]}
            taskId={task?.id}
            onAddComment={handleAddComment}
            loading={loading}
          />
        )}
      </ScrollView>

      {/* Evidence Upload Modal */}
      <Modal
        visible={evidenceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEvidenceModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Add Evidence')}</Text>
              <TouchableOpacity
                onPress={() => setEvidenceModalVisible(false)}
                style={styles.closeButton}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {t(
                'This task requires evidence. Please add at least one image as proof of completion.',
              )}
            </Text>

            <ScrollView style={styles.evidenceScrollView}>
              <View style={styles.evidenceImagesContainer}>
                {selectedEvidenceImages.map((image, index) => (
                  <View key={index} style={styles.evidenceImageWrapper}>
                    <Image
                      source={{uri: image.uri}}
                      style={styles.evidenceImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeEvidenceImage(index)}>
                      <MaterialIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addEvidenceButton}
                  onPress={selectEvidenceImages}>
                  <MaterialIcons name="add" size={24} color="#006EC2" />
                  <Text style={styles.addEvidenceText}>{t('Add Image')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEvidenceModalVisible(false);
                  setSelectedEvidenceImages([]);
                }}>
                <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={uploadEvidenceAndUpdateStatus}
                disabled={
                  uploadingEvidence ||
                  (taskData?.evidence_required &&
                    selectedEvidenceImages.length === 0)
                }>
                {uploadingEvidence ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('Continue')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      // paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      width: '60%',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: wp(2),
      paddingVertical: hp(2),
    },
    backButtonText: {
      fontSize: RFPercentage(2),
      color: '#006EC2',
      fontWeight: '600',
      marginLeft: wp(1),
    },
    taskNumber: {
      fontSize: RFPercentage(2.2),
      fontWeight: 'bold',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: wp(2),
    },
    statusText: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: wp(4),
    },
    title: {
      fontSize: RFPercentage(2.4),
      fontWeight: 'bold',
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      width: wp(40),
    },
    card: {
      backgroundColor: isDarkMode ? Colors.darkTheme.cardBackground : '#fff',
      borderRadius: 12,
      paddingVertical: wp(3),
      marginBottom: hp(2),
    },
    sectionTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: 'bold',
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.5),
      minHeight: hp(4),
    },
    detailLabel: {
      fontSize: RFPercentage(2),
      color: '#666',
      flex: 1,
    },
    detailValue: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      flex: 1,
      textAlign: 'right',
    },
    assignedByContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#006EC2',
      justifyContent: 'center',
      alignItems: 'center',
    },
    nameContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: wp(30),
    },
    avatarText: {
      color: '#fff',
      fontSize: RFPercentage(1.5),
      fontWeight: 'bold',
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    progressBar: {
      width: wp(20),
      height: 6,
      backgroundColor: '#e0e0e0',
      borderRadius: 3,
      marginRight: wp(2),
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
    },
    progressText: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    description: {
      fontSize: RFPercentage(2),
      lineHeight: RFPercentage(3),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: hp(2),
      fontSize: RFPercentage(2),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#666',
    },
    requirementsContainer: {
      marginTop: hp(2),
      paddingTop: hp(1.5),
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    requirementsTitle: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      marginBottom: hp(1),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
    },
    requirementsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(2),
    },
    requirement: {
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      borderRadius: 12,
    },
    requirementText: {
      fontSize: RFPercentage(1.4),
      fontWeight: '500',
    },
    eventItem: {
      flexDirection: 'row',
      marginBottom: hp(2),
      paddingBottom: hp(1.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.1)',
    },
    eventIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: hp(0.5),
      marginRight: wp(3),
    },
    eventContent: {
      flex: 1,
    },
    eventType: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
      marginBottom: hp(0.5),
    },
    eventTime: {
      fontSize: RFPercentage(1.5),
      color: '#666',
      marginBottom: hp(0.5),
    },
    eventNotes: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? Colors.darkTheme.secondaryTextColor : '#555',
      marginBottom: hp(0.5),
    },
    validationRow: {
      flexDirection: 'row',
      gap: wp(4),
    },
    validation: {
      fontSize: RFPercentage(1.4),
      fontWeight: '500',
    },
    priorityBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(1),
      borderRadius: 12,
      minWidth: wp(16),
      alignItems: 'center',
    },
    priorityText: {
      fontSize: RFPercentage(1.2),
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    statusChangeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    currentStatusLabel: {
      fontSize: RFPercentage(2),
      color: '#666',
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: wp(90),
      backgroundColor: isDarkMode ? Colors.darkTheme.cardBackground : '#fff',
      borderRadius: 12,
      padding: wp(4),
      maxHeight: hp(80),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    modalTitle: {
      fontSize: RFPercentage(2.2),
      fontWeight: 'bold',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    closeButton: {
      padding: wp(1),
    },
    modalDescription: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#666',
      marginBottom: hp(2),
    },
    evidenceScrollView: {
      maxHeight: hp(30),
      marginBottom: hp(2),
    },
    evidenceImagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(2),
    },
    evidenceImageWrapper: {
      position: 'relative',
      marginBottom: hp(1),
    },
    evidenceImage: {
      width: wp(25),
      height: wp(25),
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: 1,
      right: 1,
      backgroundColor: '#DC143C',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addEvidenceButton: {
      width: wp(25),
      height: wp(25),
      borderWidth: 1,
      borderColor: '#006EC2',
      borderStyle: 'dashed',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addEvidenceText: {
      fontSize: RFPercentage(1.6),
      color: '#006EC2',
      marginTop: hp(0.5),
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(2),
    },
    modalButton: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#444' : '#f0f0f0',
    },
    submitButton: {
      backgroundColor: '#006EC2',
    },
    cancelButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontWeight: '600',
    },
    submitButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });
