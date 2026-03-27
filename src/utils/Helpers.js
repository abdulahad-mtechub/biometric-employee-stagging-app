// Convert FormData to plain object for SQLite
export const formDataToObject = formData => {
  const obj = {};
  formData._parts.forEach(([key, value]) => {
    if (typeof value === 'object' && value?.uri) {
      obj[key] = {
        uri: value.uri,
        name: value.name,
        type: value.type,
      };
    } else {
      obj[key] = value;
    }
  });
  return obj;
};

// Rebuild FormData from plain object when syncing
export const rebuildFormData = data => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value?.uri && value?.name && value?.type) {
      formData.append(key, {
        uri: value.uri,
        name: value.name,
        type: value.type,
      });
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

export const capitalize = str =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

export const formatSecondsToHourMin = totalSeconds => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const hourPart = hours > 0 ? `${hours} Hour${hours > 1 ? 's' : ''}` : '';
  const minPart =
    minutes > 0 ? `${minutes} Min${minutes > 1 ? 's' : ''}` : '0 Mins';

  return [hourPart, minPart].filter(Boolean).join(' ');
};

export const formatTime = totalSeconds => {
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');

  return `${hrs}:${mins}:${secs}`;
};
