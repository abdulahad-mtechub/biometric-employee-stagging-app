import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {navigationRef} from '../utils/navigationRef';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

const Router = () => {
  const isLoggedIn = useSelector(state => state?.auth.isLoggedIn);
  return (
    <NavigationContainer ref={navigationRef}>
      {isLoggedIn ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default Router;
