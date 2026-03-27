import {pick} from '@react-native-documents/picker';
import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageView from 'react-native-image-viewing';
import {WebView} from 'react-native-webview';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {uploadImage, uploadPdf} from '../../Constants/api';
import {Colors} from '../../Constants/themeColors';
import ReusableBottomSheet from '../BottomSheets/ReusableBottomSheet';

export default function TaskComments({
  comments,
  taskId,
  onAddComment,
  loading = false,
}) {
  const {t} = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const {isDarkMode} = useSelector(store => store?.theme);
  const user = useSelector(state => state?.auth?.user?.worker);
  const token = useSelector(state => state?.auth?.user?.token);
  const styles = dynamicStyles(isDarkMode);
  const attachmentSheetRef = useRef();
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesForViewing, setImagesForViewing] = useState([]);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [currentPdfName, setCurrentPdfName] = useState('');
  const [userImageError, setUserImageError] = useState(false);
  const [commentImageErrors, setCommentImageErrors] = useState({});
  const handleImagePreview = (imageUrl, imageIndex = 0, allImages = []) => {
    const images =
      allImages.length > 0
        ? allImages.map(img => ({uri: img}))
        : [{uri: imageUrl}];

    setImagesForViewing(images);
    setCurrentImageIndex(imageIndex);
    setImageViewerVisible(true);
  };

  const handlePdfPreview = (pdfUrl, pdfName = 'Document') => {
    setCurrentPdfUrl(pdfUrl);
    setCurrentPdfName(pdfName);
    setPdfViewerVisible(true);
  };

  const formatDate = dateString => {
    if (!dateString) return t('Not specified');
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} - ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const getUserInitials = (name = '') => {
    return (
      name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'NA'
    );
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: t('Camera Permission'),
          message: t('App needs camera permission to take photos'),
          buttonNeutral: t('Ask Me Later'),
          buttonNegative: t('Cancel'),
          buttonPositive: t('OK'),
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleImageFromCamera = async () => {
    attachmentSheetRef.current?.close();
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, response => {
      if (response.assets && response.assets[0]) {
        handleFileUpload([response.assets[0]], 'image');
      }
    });
  };

  const handleImageFromGallery = async () => {
    attachmentSheetRef.current?.close();
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, response => {
      if (response.assets && response.assets.length > 0) {
        handleFileUpload(response.assets, 'image');
      }
    });
  };

  const handlePdfSelection = async () => {
    attachmentSheetRef.current?.close();
    console.log('📄 Document picker...');

    try {
      const result = await pick({
        mode: 'open',
        type: ['application/pdf'],
        allowMultiSelection: true,
      });

      console.log('📄 PDF files selected:', result);

      // Handle different response structures
      let selectedDocs = [];
      if (Array.isArray(result)) {
        selectedDocs = result;
      } else if (result && result.uri) {
        selectedDocs = [result];
      } else {
        console.log('📄 No PDF files selected');
        return;
      }

      if (selectedDocs.length > 0) {
        handleFileUpload(selectedDocs, 'pdf');
      } else {
        console.log('📄 No PDF files selected');
      }
    } catch (err) {
      console.log('📄 PDF selection error:', err);
      if (err.code === 'DOCUMENT_PICKER_CANCELED' || err.code === 'cancel') {
        console.log('📄 User cancelled PDF selection');
      } else {
        console.error('PDF selection error:', err);
      }
    }
  };

  const handleFileUpload = async (files, type) => {
    setUploadingFiles(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        let response;
        if (type === 'image') {
          const imageData = {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.fileName || `image_${Date.now()}.jpg`,
          };
          response = await uploadImage(imageData);
        } else if (type === 'pdf') {
          response = await uploadPdf(file, token);
        }

        if (response?.data?.url) {
          uploadedFiles.push({
            id: response.data.url,
            url: response.data.url,
            name: file.fileName || file.name || `${type}_${Date.now()}`,
            type: type,
            size: file.fileSize || file.size,
          });
        }
      }

      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = index => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && attachments.length === 0) {
      return;
    }

    try {
      setSubmitting(true);
      const commentData = {
        body: newComment.trim() || t('Shared files'),
        attachments: attachments.map(att => att.id),
      };
      await onAddComment(commentData);
      setNewComment('');
      setAttachments([]);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttachment = (attachment, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.attachmentItem}
        onPress={() => {
          if (attachment.type === 'image') {
            // Get all image attachments for the viewer
            const imageAttachments = attachments.filter(
              att => att.type === 'image',
            );
            const imageIndex = imageAttachments.findIndex(
              att => att.url === attachment.url,
            );

            if (imageIndex !== -1) {
              handleImagePreview(
                attachment.url,
                imageIndex,
                imageAttachments.map(img => img.url),
              );
            }
          } else if (attachment.type === 'pdf') {
            handlePdfPreview(attachment.url, attachment.name);
          }
        }}>
        <View style={styles.attachmentContent}>
          {attachment.type === 'image' ? (
            <Image
              source={{uri: attachment.url}}
              style={styles.attachmentImage}
            />
          ) : (
            <View style={styles.pdfIcon}>
              <MaterialIcons
                name="picture-as-pdf"
                size={hp(5)}
                color="#F44336"
              />
            </View>
          )}
          <Text style={styles.attachmentName} numberOfLines={1}>
            {attachment.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={e => {
            e.stopPropagation(); // Prevent triggering the image preview
            removeAttachment(index);
          }}>
          <MaterialIcons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCommentAttachments = commentAttachments => {
    // Add safety check for undefined or null
    if (
      !commentAttachments ||
      !Array.isArray(commentAttachments) ||
      commentAttachments.length === 0
    ) {
      return null;
    }

    // Filter only image attachments for preview
    const imageAttachments = commentAttachments.filter(attachment => {
      const attachmentUrl =
        typeof attachment === 'string' ? attachment : attachment.url;
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
    });

    return (
      <View style={styles.commentAttachments}>
        {commentAttachments.map((attachment, index) => {
          const attachmentUrl =
            typeof attachment === 'string' ? attachment : attachment.url;
          const attachmentName =
            typeof attachment === 'string'
              ? attachmentUrl.split('/').pop() || `attachment_${index + 1}`
              : attachment.name;

          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
          const attachmentType =
            typeof attachment === 'string'
              ? isImage
                ? 'image'
                : 'pdf'
              : attachment.type;

          return (
            <TouchableOpacity
              key={index}
              style={styles.commentAttachmentItem}
              onPress={() => {
                if (isImage) {
                  // Find the index of this image in the filtered image attachments
                  const imageIndex = imageAttachments.findIndex(img => {
                    const imgUrl = typeof img === 'string' ? img : img.url;
                    return imgUrl === attachmentUrl;
                  });

                  if (imageIndex !== -1) {
                    handleImagePreview(
                      attachmentUrl,
                      imageIndex,
                      imageAttachments.map(img => {
                        const imgUrl = typeof img === 'string' ? img : img.url;
                        return imgUrl;
                      }),
                    );
                  }
                } else {
                  // Handle PDF preview
                  handlePdfPreview(attachmentUrl, attachmentName);
                }
              }}>
              {attachmentType === 'image' ? (
                <Image
                  source={{uri: attachmentUrl}}
                  style={styles.commentAttachmentImage}
                />
              ) : (
                <View style={styles.commentPdfItem}>
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={hp(8)}
                    color="#F44336"
                  />
                  <Text style={styles.commentPdfName} numberOfLines={1}>
                    {attachmentName}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const attachmentOptions = [
    {
      icon: <MaterialIcons name="camera-alt" size={24} color="#4CAF50" />,
      title: t('Take Photo'),
      description: t('Capture a photo with camera'),
      onPress: handleImageFromCamera,
    },
    {
      icon: <MaterialIcons name="photo-library" size={24} color="#2196F3" />,
      title: t('Choose Images'),
      description: t('Select images from gallery'),
      onPress: handleImageFromGallery,
    },
    {
      icon: <MaterialIcons name="picture-as-pdf" size={24} color="#F44336" />,
      title: t('Upload PDF'),
      description: t('Select PDF documents'),
      onPress: handlePdfSelection,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#006EC2" />
        <Text style={styles.loadingText}>{t('Loading comments...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('Comments & Updates')}</Text>

      {/* Add Comment Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.addCommentContainer}>
        <View style={styles.addCommentSection}>
          <View style={styles.inputContainer}>
            {/* <View style={styles.userAvatar}>
              {user?.profile_image && !userImageError ? (
                <Image
                  source={{uri: user.profile_image}}
                  style={styles.userAvatarImage}
                  onError={() => setUserImageError(true)}
                />
              ) : (
                <Text style={styles.userAvatarText}>
                  {getUserInitials(
                    user?.first_name
                      ? `${user.first_name} ${user.last_name || ''}`.trim()
                      : '',
                  )}
                </Text>
              )}
            </View> */}
            <TextInput
              style={styles.commentInput}
              placeholder={t('Add a comment...')}
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              multiline
              numberOfLines={3}
              value={newComment}
              onChangeText={setNewComment}
              maxLength={500}
            />
          </View>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsPreview}>
              {attachments.map(renderAttachment)}
            </View>
          )}

          {uploadingFiles && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color="#006EC2" />
              <Text style={styles.uploadingText}>
                {t('Uploading files...')}
              </Text>
            </View>
          )}

          <View style={styles.commentActions}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => attachmentSheetRef.current?.open()}>
                <MaterialIcons name="attach-file" size={20} color="#006EC2" />
              </TouchableOpacity>
              <Text style={styles.characterCount}>{newComment.length}/500</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor:
                    newComment.trim() || attachments.length > 0
                      ? '#006EC2'
                      : '#ccc',
                },
              ]}
              onPress={handleAddComment}
              disabled={
                (!newComment.trim() && attachments.length === 0) ||
                submitting ||
                uploadingFiles
              }>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>{t('Post')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Comments List */}
      <View style={styles.commentsContainer}>
        {comments.length === 0 ? (
          <View style={styles.noCommentsContainer}>
            <MaterialIcons
              name="comment"
              size={48}
              color={isDarkMode ? '#444' : '#ccc'}
            />
            <Text style={styles.noCommentsText}>
              {t('No comments yet. Be the first to add one!')}
            </Text>
          </View>
        ) : (
          comments?.reverse()?.map((comment, index) => (
            <View key={comment.id || index} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                {/* <View style={styles.commentAvatar}>
                  {comment.author?.profile_image &&
                  !commentImageErrors[comment.id] ? (
                    <Image
                      source={{uri: comment.author.profile_image}}
                      style={styles.commentAvatarImage}
                      onError={() =>
                        setCommentImageErrors(prev => ({
                          ...prev,
                          [comment.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <Text style={styles.commentAvatarText}>
                      {getUserInitials(
                        comment.author_name ||
                          (comment.author?.first_name
                            ? `${comment.author.first_name} ${
                                comment.author.last_name || ''
                              }`.trim()
                            : ''),
                      )}
                    </Text>
                  )}
                </View> */}
                <View style={styles.commentInfo}>
                  <Text style={styles.commentAuthor}>
                    {comment.author_name ||
                      (comment.author?.first_name
                        ? `${comment.author.first_name} ${
                            comment.author.last_name || ''
                          }`.trim()
                        : t('Unknown User'))}
                  </Text>
                  <Text style={styles.commentTime}>
                    {formatDate(comment.created_at)}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentBody}>{comment.body}</Text>
              {renderCommentAttachments(comment?.attachments || [])}
            </View>
          ))
        )}
      </View>

      <ReusableBottomSheet
        height={hp('30%')}
        refRBSheet={attachmentSheetRef}
        sheetTitle={t('Add Attachment')}
        options={attachmentOptions}
      />

      {/* PDF Viewer Modal */}
      <Modal
        visible={pdfViewerVisible}
        animationType="slide"
        onRequestClose={() => setPdfViewerVisible(false)}>
        <View style={styles.pdfModalContainer}>
          <View style={styles.pdfToolbar}>
            <TouchableOpacity
              onPress={() => setPdfViewerVisible(false)}
              style={styles.pdfToolbarButton}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pdfToolbarTitle} numberOfLines={1}>
              {currentPdfName || t('Document Viewer')}
            </Text>
            <View style={styles.pdfToolbarSpacer} />
          </View>
          {currentPdfUrl && (
            <WebView
              source={{
                uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                  currentPdfUrl,
                )}`,
              }}
              style={styles.pdfViewer}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              renderLoading={() => (
                <View style={styles.webViewLoader}>
                  <ActivityIndicator size="large" color="#006EC2" />
                  <Text style={styles.webViewLoadingText}>
                    {t('Loading document...')}
                  </Text>
                </View>
              )}
              onError={syntheticEvent => {
                const {nativeEvent} = syntheticEvent;
                console.error('WebView error: ', nativeEvent);
                Alert.alert(
                  t('Error'),
                  t('Failed to load document. Please try again.'),
                );
              }}
            />
          )}
        </View>
      </Modal>

      <ImageView
        images={imagesForViewing}
        imageIndex={currentImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        FooterComponent={({imageIndex}) => (
          <View style={styles.imageViewerFooter}>
            <Text style={styles.imageViewerText}>
              {imageIndex + 1} / {imagesForViewing.length}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? Colors.darkTheme.cardBackground : '#fff',
      borderRadius: 12,
      paddingVertical: wp(4),
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
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: wp(4),
    },
    loadingText: {
      marginLeft: wp(2),
      fontSize: RFPercentage(1.8),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#666',
    },
    addCommentContainer: {
      marginBottom: hp(2),
    },
    addCommentSection: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8f8f8',
    },
    inputContainer: {
      flexDirection: 'row',
      padding: wp(3),
    },
    userAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#006EC2',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(3),
    },
    userAvatarText: {
      color: '#fff',
      fontSize: RFPercentage(1.6),
      fontWeight: 'bold',
    },
    userAvatarImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    commentInput: {
      flex: 1,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlignVertical: 'top',
      minHeight: hp(8),
      maxHeight: hp(15),
    },
    commentActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(3),
      paddingBottom: wp(3),
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
      paddingTop: wp(2),
    },
    characterCount: {
      fontSize: RFPercentage(1.4),
      color: '#999',
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: 20,
      gap: wp(1),
    },
    submitButtonText: {
      fontSize: RFPercentage(1.8),
      fontWeight: '600',
      color: '#fff',
    },
    commentsContainer: {
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
      paddingTop: hp(2),
    },
    noCommentsContainer: {
      alignItems: 'center',
      paddingVertical: hp(4),
    },
    noCommentsText: {
      fontSize: RFPercentage(1.8),
      color: '#999',
      textAlign: 'center',
      marginTop: hp(1),
      fontStyle: 'italic',
    },
    commentItem: {
      marginBottom: hp(2),
      paddingBottom: hp(1.5),
      paddingHorizontal: wp(3),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.1)',
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#006EC2',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: wp(3),
    },
    commentAvatarText: {
      color: '#fff',
      fontSize: RFPercentage(1.6),
      fontWeight: 'bold',
    },
    commentAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInfo: {
      flex: 1,
    },
    commentAuthor: {
      fontSize: RFPercentage(1.7),
      fontWeight: '600',
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
    },
    commentTime: {
      fontSize: RFPercentage(1.4),
      color: '#666',
    },
    commentBody: {
      fontSize: RFPercentage(1.7),
      lineHeight: RFPercentage(2.4),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
    },
    attachmentButton: {
      padding: wp(2),
      borderRadius: 20,
    },
    attachmentsPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: wp(3),
      gap: wp(2),
    },
    attachmentItem: {
      position: 'relative',
      marginBottom: hp(1),
    },
    attachmentContent: {
      flexDirection: 'row',
      alignItems: 'center',
      // backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
      borderRadius: 8,
      padding: wp(1),
      maxWidth: wp(40),
    },
    attachmentImage: {
      width: 45,
      height: 45,
      borderRadius: 4,
      marginRight: wp(2),
    },
    pdfIcon: {
      marginRight: wp(2),
    },
    attachmentName: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
      flex: 1,
    },
    removeButton: {
      position: 'absolute',
      top: -hp(0.5),
      right: wp(1),
      backgroundColor: '#F44336',
      borderRadius: 10,
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
    },
    uploadingText: {
      marginLeft: wp(2),
      fontSize: RFPercentage(1.6),
      color: '#006EC2',
    },
    commentAttachments: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: hp(1),
      marginLeft: wp(11),
      gap: wp(2),
    },
    commentAttachmentItem: {
      marginBottom: hp(0.5),
    },
    commentAttachmentImage: {
      width: wp(20),
      height: wp(20),
      borderRadius: 8,
    },
    commentPdfItem: {
      flexDirection: 'row',
      alignItems: 'center',
      // backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
      borderRadius: 8,
      padding: wp(2),
      maxWidth: wp(30),
    },
    commentPdfName: {
      marginLeft: wp(1),
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : '#333',
      flex: 1,
    },
    imageViewerFooter: {
      height: 60,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageViewerText: {
      fontSize: 16,
      color: 'white',
    },
    // PDF Viewer Modal Styles
    pdfModalContainer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    pdfToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#006EC2',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      paddingTop: Platform.OS === 'ios' ? hp(6) : hp(1.5),
    },
    pdfToolbarButton: {
      padding: wp(2),
      width: 40,
    },
    pdfToolbarTitle: {
      flex: 1,
      fontSize: RFPercentage(2.2),
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
      marginHorizontal: wp(2),
    },
    pdfToolbarSpacer: {
      width: 40,
    },
    pdfViewer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    webViewLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    webViewLoadingText: {
      marginTop: hp(2),
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
