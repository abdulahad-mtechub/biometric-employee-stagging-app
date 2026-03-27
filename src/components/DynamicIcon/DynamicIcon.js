import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

const iconSets = {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Octicons,
  SimpleLineIcons,
};

const DynamicIcon = ({
  family = 'Ionicons',
  name,
  size = 24,
  color = '#000',
  ...props
}) => {
  try {
    const IconComponent = iconSets[family];

    if (!IconComponent) {
      console.warn(`Icon family '${family}' not found`);
      return <Ionicons name="alert-circle-outline" size={size} color="red" />;
    }

    return <IconComponent name={name} size={size} color={color} {...props} />;
  } catch (error) {
    console.error('Error rendering icon:', error);
    return <Ionicons name="alert-circle-outline" size={size} color="red" />;
  }
};

export default DynamicIcon;
