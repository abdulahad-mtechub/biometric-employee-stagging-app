import {useSelector} from 'react-redux';
import {Colors} from '../Constants/themeColors';

export const useButtonColors = () => {
  const themeState = useSelector(store => store.theme);
  const isDarkMode = themeState?.isDarkMode || false;
  const buttonColors = themeState?.buttonColors || null; // This matches your Redux state

  const getButtonColor = (buttonType = 'primary') => {
    // Use buttonColors from Redux (this is your API response data)
    if (buttonColors) {
      if (buttonType === 'primary') {
        return {
          backgroundColor: buttonColors.primary_color, // #000000 from API
          textColor: '#FFFFFF', // White text for primary button
        };
      } else {
        return {
          backgroundColor: 'transparent', // Transparent background for secondary
          textColor: buttonColors.secondary_color, // #cb1a1a from API
          borderColor: buttonColors.secondary_color, // #cb1a1a from API
        };
      }
    }

    // Fallback to local theme colors
    const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
    const btnKey = buttonType === 'primary' ? 'primaryBtn' : 'secondryBtn';

    if (buttonType === 'primary') {
      return {
        backgroundColor: theme[btnKey]?.BtnColor, // #006EC2 from local
        textColor: theme[btnKey]?.TextColor, // #FFFFFF from local
      };
    } else {
      return {
        backgroundColor: 'transparent',
        textColor: theme[btnKey]?.TextColor, // #006EC2 from local
        borderColor: theme[btnKey]?.BtnColor, // #006EC2 from local
      };
    }
  };

  return {
    getButtonColor,
    isDarkMode,
    hasCustomColors: !!buttonColors, // Check if API colors are available
  };
};
