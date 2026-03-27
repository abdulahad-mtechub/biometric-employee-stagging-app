import {API_BASE_URL} from './Base_URL';
export const createThread = async (receiverId, receiverRole, token) => {
  if (!receiverId || !token)
    throw new Error('receiverId and token are required');
  const body = {receiverId};
  if (receiverRole) body.receiverRole = receiverRole;
  return await postRequest('messages/threads', body, token);
};
export const postFormDataRequest = async (endpoint, formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(
        `❌ JSON parse failed for ${endpoint}. Response was:`,
        text,
      );
      return {
        success: false,
        message: `Invalid response from server (status: ${response.status})`,
      };
    }
  } catch (error) {
    return {success: false, message: error.message || 'Network error occurred'};
  }
};

export const getEligibleUsers = async (role, token) => {
  if (!role || !token) throw new Error('Role and token are required');
  const endpoint = `messages/eligible-users?role=${role}&noPagination=true`;
  return await getRequest(endpoint, token);
};
const postRequest = async (endpoint, body, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return {success: false, message: 'Invalid response from server'};
    }
  } catch (error) {
    return {success: false, message: error.message};
  }
};

export const deleteRequest = async (endpoint, body = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method: 'DELETE',
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return {success: false, message: 'Invalid response from server'};
    }
  } catch (error) {
    return {success: false, message: error.message || 'Network error occurred'};
  }
};
const patchRequest = async (endpoint, body, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return {success: false, message: 'Invalid response from server'};
    }
  } catch (error) {
    return {success: false, message: error.message || 'Network error occurred'};
  }
};
export const getRequest = async (endpoint, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return {success: false, message: 'Invalid response from server'};
    }
  } catch (error) {
    return {success: false, message: error.message || 'Network error occurred'};
  }
};

export const signupWorker = async payload => {
  return await postRequest('public/worker/register-basic', payload);
};
export const registerWorker = async (payload, profile_token) => {
  return await postRequest('public/register-worker', payload, profile_token);
};

export const loginWorker = async credentials => {
  return await postRequest('public/worker/login', credentials);
};

export const verifyEmail = async data => {
  return await postRequest('public/worker/verify-email', data);
};
export const onlyVerifyEmail = async email => {
  return await postRequest('public/worker/resend-verification', email);
};
export const resendVerifyEmail = async email => {
  return await postRequest('public/worker/resend-verification', email);
};

export const verifyOtp = async userData => {
  return await postRequest('public/worker/verify-otp', userData);
};

export const resetPassword = async userData => {
  return await postRequest('public/worker/reset-password', userData);
};

export const attendancePunch = async (attendanceData, token) => {
  return await postRequest('attendance/punch', attendanceData, token);
};

export const postValidateLocation = async (body, token) => {
  return await postRequest('attendance/validate-location', body, token);
};

export const postValidateFace = async (body, token) => {
  return await postRequest('attendance/validate-face', body, token);
};
export const getLastPunchDetails = async (
  token,
  date = null,
  timezone = null,
) => {
  let endpoint = 'attendance/today';

  if (date || timezone) {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (timezone) queryParams.append('tz', timezone);
    endpoint += `?${queryParams.toString()}`;
  }

  return await getRequest(endpoint, token);
};
export const getNotifications = async token => {
  return await getRequest('notifications/worker', token);
};
export const markNotificationsAllAsRead = async token => {
  return await putRequest('notifications/worker/mark-all-read', {}, token);
};
export const changePassword = async (userData, token) => {
  return await postRequest('workers/change-password', userData, token);
};

export const forgotPassword = async userData => {
  return await postRequest('public/worker/forgot-password', userData);
};
export const createDocument = async (payload, token) => {
  return await postRequest('documents/upload', payload, token);
};

export const UpdateFace = async (payload, token) => {
  return await putRequest('attendance/update-face', payload, token);
};

export const updateTicketStatus = async (ticketId, payload, token) => {
  return await patchRequest(`tickets/${ticketId}/status`, payload, token);
};

export const faceScanVerification = async data => {
  return await postRequest('public/worker/face-login', data);
};

export const uploadImage = async image => {
  console.log('image', JSON.stringify(image, null, 3));
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: image.path ? image.path : image.uri,
      type: image.mime || 'image/jpeg',
      name: image.name || `upload-${Date.now()}.jpg`,
    });

    return await postFormDataRequest('upload/image', formData);
  } catch (error) {
    return {success: false, message: 'Failed to upload image'};
  }
};
export const uploadDocument = async image => {
  try {
    const formData = new FormData();
    formData.append('pdf', {
      uri: image.path ? image.path : image.uri ? image.uri : image,
      type: image.mime || 'application/pdf',
      name: image.name || `upload-${Date.now()}.pdf`,
    });

    return await postFormDataRequest('upload/pdf', formData);
  } catch (error) {
    return {success: false, message: error.message};
  }
};
export const uploadAudio = async image => {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: image.path ? image.path : image.uri ? image.uri : image,
      type: image.mime || 'file',
      name: image.name || `upload-${Date.now()}.mp3`,
    });
    return await postFormDataRequest('upload/audio', formData);
  } catch (error) {
    return {success: false, message: error.message};
  }
};
export const faceScanRegisteration = async (data, userId, token) => {
  return await postRequest(`worker-executive/${userId}/face-scan`, data, token);
};

export const detectFace = async (imageFile, token) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri || imageFile.path,
      type: 'image/jpeg',
      name: imageFile.name || 'face_image.jpg',
    });

    const result = await postFormDataRequest(
      'face/detect-face',
      formData,
      token,
    );

    if (result.success === false) {
      return {
        error: true,
        message: result.message || 'Failed to detect face',
      };
    }

    if (result.error === true) {
      return {
        error: true,
        message: result.message || 'Failed to detect face',
      };
    }

    return {
      error: false,
      message: result.message || 'Face detected successfully',
      data: result.data || result,
    };
  } catch (error) {
    console.error('❌ Face detection error:', error);
    return {
      error: true,
      message: error.message || 'Failed to detect face',
    };
  }
};

export const uploadPdf = async pdf => {
  try {
    const formData = new FormData();
    formData.append('pdf', {
      uri: pdf.uri,
      type: pdf.type || 'application/pdf',
      name: pdf.name || `upload-${Date.now()}.pdf`,
    });

    return await postFormDataRequest('upload/pdf', formData);
  } catch (error) {
    return {success: false, message: 'Failed to upload pdf'};
  }
};
const putRequest = async (endpoint, body = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method: 'PUT',
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return {success: false, message: 'Invalid response from server'};
    }
  } catch (error) {
    console.log(`Error in PUT ${endpoint}:`, error);
    return {success: false, message: error.message || 'Network error occurred'};
  }
};

export const selectRole = async (userData, token) => {
  return await putRequest('account-worker/profile/role', userData, token);
};
export const editProfile = async (userData, token) => {
  return await putRequest('workers/profile', userData, token);
};
export const getDepartmentsByCompId = async companyId => {
  return await getRequest(`public/departmentsByCompId/${companyId}`);
};
export const getAbsences = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.absence_type) {
      queryParams.append('absence_type', filters.absence_type);
    }
    if (filters.start_date) {
      queryParams.append('start_date', filters.start_date);
    }
    if (filters.end_date) {
      queryParams.append('end_date', filters.end_date);
    }
    // Add pagination support
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append('page_size', filters.page_size.toString());
    }

    const queryString = queryParams.toString();
    const fullUrl = `absences/worker/absences${
      queryString ? `?${queryString}` : ''
    }`;

    return await getRequest(fullUrl, token);
  } catch (error) {
    console.error('Error fetching absences:', error);
    throw error;
  }
};
export const getAbsenceCalendar = async (startDate, endDate, token) => {
  return await getRequest(
    `absences/worker/absences/calendar?start_date=${startDate}&end_date=${endDate}`,
    token,
  );
};
export const getCompanies = async () => {
  return await getRequest(`public/companies`);
};
export const getRequestDetails = async (requestId, token) => {
  return await getRequest(`requests/v1/requests/${requestId}`, token);
};
export const getBranding = async ({company_id, token}) => {
  return await getRequest(
    `company-admins/get-admin-theme-setting/${company_id}`,
    token,
  );
};
export const getMyDocuments = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.dateFrom) {
      queryParams.append('date_from', filters.dateFrom);
    }
    if (filters.dateTo) {
      queryParams.append('date_to', filters.dateTo);
    }
    if (filters.fileType) {
      queryParams.append('file_type', filters.fileType);
    }
    if (filters.category) {
      queryParams.append('category', filters.category);
    }
    // Add pagination support
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append('page_size', filters.page_size.toString());
    }
    const queryString = queryParams.toString();
    const fullUrl = `documents/me/uploaded${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await getRequest(fullUrl, token);
    return response;
  } catch (error) {
    console.error('❌ Error fetching my documents:', error);
    throw error;
  }
};
export const getCompaniesDocument = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.dateFrom) {
      queryParams.append('date_from', filters.dateFrom);
    }
    if (filters.dateTo) {
      queryParams.append('date_to', filters.dateTo);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    if (filters.category) {
      queryParams.append('category', filters.category);
    }
    // Add pagination support
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append('page_size', filters.page_size.toString());
    }

    const queryString = queryParams.toString();

    return await getRequest(
      `documents/company${queryString ? `?${queryString}` : ''}`,
      token,
    );
  } catch (error) {
    console.error('Error fetching my documents:', error);
    throw error;
  }
};

export const getRemunerations = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.dateFrom) {
      queryParams.append('from', filters.dateFrom);
    }
    if (filters.dateTo) {
      queryParams.append('to', filters.dateTo);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    // Add pagination support
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append('page_size', filters.page_size.toString());
    }

    const queryString = queryParams.toString();

    return await getRequest(
      `worker/remuneration${queryString ? `?${queryString}` : ''}`,
      token,
    );
  } catch (error) {
    console.error('Error fetching my documents:', error);
    throw error;
  }
};

export const getExpenses = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.dateFrom) {
      queryParams.append('from', filters.dateFrom);
    }
    if (filters.dateTo) {
      queryParams.append('to', filters.dateTo);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    // Add pagination support
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append('page_size', filters.page_size.toString());
    }

    const queryString = queryParams.toString();

    return await getRequest(
      `worker/expenses${queryString ? `?${queryString}` : ''}`,
      token,
    );
  } catch (error) {
    console.error('Error fetching my documents:', error);
    throw error;
  }
};
export const getRequests = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.start_date) {
      queryParams.append('start_date', filters.start_date);
    }
    if (filters.end_date) {
      queryParams.append('end_date', filters.end_date);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    // Add pagination support
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append('page_size', filters.page_size.toString());
    }
    const queryString = queryParams.toString();

    return await getRequest(
      `requests/v1/requests/my${queryString ? `?${queryString}` : ''}`,
      token,
    );
  } catch (error) {
    console.error('Error fetching my documents:', error);
    throw error;
  }
};
export const yearlyTaskList = async (from, to, token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Handle pagination - use page_size or default to 100
    if (filters.limit) {
      queryParams.append('page_size', filters.limit.toString());
    } else {
      queryParams.append('page_size', '100');
    }
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }

    if (from) {
      queryParams.append('from', from);
    }
    if (to) {
      queryParams.append('to', to);
    }
    if (filters.status) {
      queryParams.append('status', filters.status);
    }

    const queryString = queryParams.toString();

    return await getRequest(
      `task-management/worker/tasks${queryString ? `?${queryString}` : ''}`,
      token,
    );
  } catch (error) {
    console.error('Error fetching my documents:', error);
    throw error;
  }
};

export const attendanceMonthly = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Handle month filter - convert from dateFrom/dateTo or use direct month
    if (filters.month) {
      queryParams.append('month', filters.month);
    } else if (filters.dateFrom) {
      // Extract month from dateFrom in YYYY-MM format
      const date = new Date(filters.dateFrom);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        queryParams.append('month', `${year}-${month}`);
      }
    } else if (filters.dateTo) {
      // Extract month from dateTo in YYYY-MM format
      const date = new Date(filters.dateTo);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        queryParams.append('month', `${year}-${month}`);
      }
    }

    // Handle pagination
    if (filters.page) {
      queryParams.append('page', filters.page);
    } else {
      queryParams.append('page', '1');
    }

    if (filters.pageSize) {
      queryParams.append('pageSize', filters.pageSize);
    } else {
      queryParams.append('pageSize', '100');
    }

    // Always use UTC for monthly attendance (mobile handles conversion)
    queryParams.append('tz', 'UTC');

    const queryString = queryParams.toString();
    console.log(
      'queryString',
      `attendance/monthly${queryString ? `?${queryString}` : ''}`,
    );
    return await getRequest(
      `attendance/monthly${queryString ? `?${queryString}` : ''}`,
      token,
    );
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    throw error;
  }
};

export const workerTaskList = async (from, to, token, pagination = {}) => {
  let url = 'task-management/worker/tasks/calendar';
  const params = [];
  if (from && to) {
    params.push(`from=${from}`);
    params.push(`to=${to}`);
  }
  if (pagination.page) {
    params.push(`page=${pagination.page}`);
  }
  if (pagination.limit) {
    params.push(`page_size=${pagination.limit}`);
  } else {
    // Default to 100 to get all tasks
    params.push(`page_size=100`);
  }
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  return await getRequest(url, token);
};

export const taskDetails = async (taskId, token) => {
  return await getRequest(`task-management/worker/tasks/${taskId}`, token);
};
export const taskStatus = async (taskId, status, body, token) => {
  return await postRequest(
    `task-management/worker/tasks/${taskId}/${status}`,
    body,
    token,
  );
};
export const addTaskComment = async (taskId, body, token) => {
  return await postRequest(
    `task-management/worker/tasks/${taskId}/comments`,
    body,
    token,
  );
};

export const createTask = async (requestBody, token) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(
      `${API_BASE_URL}task-management/worker/tasks`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      },
    );
    const data = await response.json();
    if (response.ok) {
      return {success: true, data};
    } else {
      return {success: false, message: data.message || 'Failed to create task'};
    }
  } catch (error) {
    return {success: false, message: error.message || 'Network error occurred'};
  }
};

export const taskStats = async token => {
  return await getRequest(`task-management/worker/tasks/counters`, token);
};

export const getExpensesById = async (expenseId, token) => {
  return await getRequest(`worker/expenses/${expenseId}`, token);
};
export const createExpenses = async (body, token) => {
  return await postRequest(`worker/expenses`, body, token);
};

export const cancelRequest = async (id, token) => {
  return await postRequest(`requests/v1/requests/${id}/cancel`, token);
};

export const getWorkerTasks = async (token, filters = {}) => {
  const params = new URLSearchParams();
  params.append('show_history', 'true');
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  // Add pagination support
  if (filters.page) {
    params.append('page', filters.page.toString());
  }
  if (filters.limit) {
    params.append('page_size', filters.limit.toString());
  } else {
    params.append('page_size', '100');
  }
  const endpoint = `task-management/worker/tasks?${params.toString()}`;
  const requestUrl = `${API_BASE_URL}${endpoint}`;
  console.log('[getWorkerTasks][REQ URL]', requestUrl);
  console.log('[getWorkerTasks][REQ FILTERS]', filters);

  const response = await getRequest(endpoint, token);
  console.log('[getWorkerTasks][RES]', response);
  console.log(
    '[getWorkerTasks][RES JSON]',
    JSON.stringify(response, null, 2),
  );
  console.log(
    '[getWorkerTasks][RES SUMMARY]',
    JSON.stringify(
      {
        success: response?.success,
        tasksCount: response?.data?.tasks?.length || 0,
        pagination: response?.data?.pagination || null,
      },
      null,
      2,
    ),
  );
  return response;
};
export const resubmitRequest = async (
  requestId,
  token,
  additionalData = {},
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}requests/v1/requests/${requestId}/resubmit`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(additionalData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error resubmitting request:', error);
    throw error;
  }
};
export const createRequest = async (requestData, token) => {
  try {
    // Validate request type
    if (
      !requestData.type ||
      !['LEAVE', 'SCHEDULE_CHANGE', 'GENERIC_HR'].includes(requestData.type)
    ) {
      throw new Error('Invalid request type');
    }
    const body = {
      ...requestData,
      created_at: new Date().toISOString(),
      status: 'PENDING',
    };

    // Use the correct endpoint
    const result = await postRequest('requests/v1/requests', body, token);

    if (result.error === true) {
      throw new Error(result.message || 'Failed to submit request');
    }

    return {
      success: true,
      request_id: result.data?.id || `REQ_${Date.now()}`,
      message: result.message,
      message_en: result.message_en,
      message_es: result.message_es,
      data: result.data,
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const mockCreateRequest = async (requestData, token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mockResponse = {
        success: true,
        request_id: `REQ_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        message: 'Request submitted successfully',
        data: {
          ...requestData,
          id: `REQ_${Date.now()}`,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      resolve(mockResponse);
    }, 1000);
  });
};

export const getMessageList = async token => {
  return await getRequest(`messages/threads`, token);
};
export const getMessagebyThread = async (
  thread_id,
  token,
  limit = null,
  page = null,
) => {
  let endpoint = `messages/threads/${thread_id}/messages`;

  // Add pagination parameters if provided
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (page) params.append('page', page);

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  return await getRequest(endpoint, token);
};
export const markAllAsRead = async (thread_id, token) => {
  return await putRequest(`messages/threads/${thread_id}/read`, {}, token);
};
export const markAllMessagesAsRead = async token => {
  return await putRequest(`messages/mark-all-read`, {}, token);
};
export const deleteMyAccountApi = async (body, token) => {
  return await deleteRequest(`workers/delete-account`, body, token);
};

export const sendMessage = async (token, threadId, messageData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}messages/threads/${threadId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          mimeType: messageData.mimeType,
        }),
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return {error: true, message: error.message};
  }
};
export const editMessage = async (token, messageId, newContent) => {
  try {
    const response = await fetch(`${API_BASE_URL}messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: newContent,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error editing message:', error);
    return {error: true, message: error.message};
  }
};
export const deleteMessage = async (token, messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting message:', error);
    return {error: true, message: error.message};
  }
};

export const getMySchedule = async token => {
  return await getRequest('attendance/my-schedule', token);
};

export const getTermsAndConditions = async () => {
  return await getRequest('terms');
};

export const getPrivacyPolicy = async () => {
  return await getRequest('privacy-policy');
};

export const getTaskAttendanceHistory = async token => {
  return await getRequest(
    'task-management/worker/tasks/attendance-history',
    token,
  );
};

// ================================
// Document APIs
// ================================

/**
 * Preview employment certificate
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - API response with certificate preview data
 */
export const previewEmploymentCertificate = async token => {
  return await postRequest(
    'documents/worker/preview/employment-certificate',
    {},
    token,
  );
};

/**
 * Preview payslip for a specific period
 * @param {string} period - Pay period in YYYY-MM format
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - API response with payslip preview data
 */
export const previewPayslip = async (period, token) => {
  return await postRequest('documents/worker/preview/payslip', {period}, token);
};

/**
 * Get available payslip periods
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - API response with periods array
 */
export const getPayslipPeriods = async token => {
  return await getRequest('documents/worker/payslips/periods', token);
};

/**
 * Get company profile for document generation
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - API response with company data
 */
export const getCompanyProfile = async token => {
  return await getRequest('workers/profile/company-admin', token);
};
