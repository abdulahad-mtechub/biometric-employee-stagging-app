// AlertContext.js
import React, {createContext, useState, useContext} from 'react';

const AlertContext = createContext();

export const useAlert = () => {
  return useContext(AlertContext);
};

export const AlertProvider = ({children}) => {
  const [alert, setAlert] = useState({
    visible: false,
    message: '',
    type: 'success',
    description: '',
  });

  const showAlert = (message, type = 'success', description) => {
    setAlert({visible: true, message, type, description});
    // Auto-hide alert after 3 seconds
    setTimeout(() => {
      setAlert(prev => ({...prev, visible: false}));
    }, 3000);
  };

  const hideAlert = () => {
    setAlert(prev => ({...prev, visible: false}));
  };

  return (
    <AlertContext.Provider value={{alert, showAlert, hideAlert}}>
      {children}
    </AlertContext.Provider>
  );
};
