import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import {useSelector} from 'react-redux';
import {SCREENS} from '../Constants/Screens';
import Attendance from '../Screens/BottomTabs/Attendence/Attendance';
import Home from '../Screens/BottomTabs/Home';
import Menu from '../Screens/BottomTabs/Menu';
import Tasks from '../Screens/BottomTabs/Tasks/Tasks';
import CustomBottomTabBar from '../components/CustomBottomTabBar';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const {isDarkMode} = useSelector(store => store.theme);

  const icons = [
    {family: 'Octicons', name: 'home'},
    {family: 'Octicons', name: 'person'},
    {family: 'MaterialIcons', name: 'assignment'},
    {family: 'Ionicons', name: 'menu-outline'},
  ];

  const FocusedIcons = [
    {family: 'Octicons', name: 'home'},
    {family: 'Octicons', name: 'person'},
    {family: 'MaterialIcons', name: 'assignment'},
    {family: 'Ionicons', name: 'menu'},
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: isDarkMode ? '#FFF' : '#000',
        tabBarInactiveTintColor: isDarkMode ? '#CCC' : '#777',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#000' : '#FFF',
        },
      }}
      tabBar={props => (
        <CustomBottomTabBar
          {...props}
          icons={icons}
          FocusedIcons={FocusedIcons}
        />
      )}>
      <Tab.Screen
        name={SCREENS.HOME}
        component={Home}
        options={{
          headerShown: false,
          title: 'Home',
        }}
      />
      <Tab.Screen
        name={SCREENS.ATTENDANCE}
        component={Attendance}
        options={{
          headerShown: false,
          title: 'Attendance',
        }}
      />
      <Tab.Screen
        name={SCREENS.TASKS}
        component={Tasks}
        options={{
          headerShown: false,
          title: 'Tasks',
        }}
      />
      <Tab.Screen
        name={SCREENS.MENU}
        component={Menu}
        options={{
          headerShown: false,
          title: 'More',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
