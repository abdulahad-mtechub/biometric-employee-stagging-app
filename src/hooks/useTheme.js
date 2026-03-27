// hooks/useTheme.js
import {useSelector} from 'react-redux';
import {Colors} from '../Constants/themeColors';

export const useTheme = () => {
  const {isDarkMode} = useSelector(state => state.theme || {});

  const colors = isDarkMode ? Colors.darkTheme : Colors.lightTheme;

  return {
    isDarkMode,
    colors,
    // Additional theme helpers
    getColor: (lightColor, darkColor) => (isDarkMode ? darkColor : lightColor),
    getBackground: (lightBg, darkBg) => (isDarkMode ? darkBg : lightBg),
  };
};
