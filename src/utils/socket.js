import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {io} from 'socket.io-client';
import {ENV} from './env';

export const useSocket = (url = ENV.photo_url) => {
  const token = useSelector(state => state.auth.token);
  const [socket, setSocket] = useState(null);
  const [_] = useState('');
  React.useEffect(() => {
    if (token) {
      const newSocket = io(url, {
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSocket(newSocket);
      console.log('admin newSocket.connected', newSocket.connected);
      newSocket.on('connect_error', err => {
        console.log(`connect_error due to `, err.message);
      });
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, url]);
  return socket;
};
