import React, {useEffect} from 'react';
import NotificationService from './NotificationService';
import {useAlert} from '../Providers/AlertContext';

const NotificationInitializer = () => {
  const {showAlert} = useAlert();

  useEffect(() => {
    // Set the showAlert function for NotificationService
    NotificationService.setShowAlertFunction(showAlert);
    // Initialize notification service
    NotificationService.initialize();

    return () => {
      // Clean up if needed
    };
  }, [showAlert]);

  return null; // This component doesn't render anything
};

export default NotificationInitializer;
