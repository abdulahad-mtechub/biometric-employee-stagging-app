import {Dimensions, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const {height: screenHeight} = Dimensions.get('screen');

const baseWidth = 375; // Base width of design
const baseHeight = 812; // Base height of design

const scaleWidth = size => (SCREEN_WIDTH / baseWidth) * size;
const scaleHeight = size => (SCREEN_HEIGHT / baseHeight) * size;

const normalizeFontSize = size => {
  const newSize = scaleWidth(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export {scaleWidth, scaleHeight, normalizeFontSize};
export const pxToPercentage = px => (px / screenHeight) * 100;
