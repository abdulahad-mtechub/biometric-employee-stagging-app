// src/utils/dateFormatter.js

import moment from 'moment';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return moment(dateString).format('DD MMM, YYYY'); // Example: 12 May, 2025
};
