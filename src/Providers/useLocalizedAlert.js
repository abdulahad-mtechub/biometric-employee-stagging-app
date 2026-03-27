import {useAlert} from '../Providers/AlertContext';
import {showLocalizedAlert} from './AlertService';

export const useLocalizedAlert = () => {
  const {showAlert} = useAlert();

  const alert = (response, type = 'success', defaultMsg) => {
    showLocalizedAlert(response, showAlert, type, defaultMsg);
  };

  return alert;
};
