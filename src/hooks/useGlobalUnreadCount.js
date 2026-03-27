import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {getRequest} from '../Constants/api';
import SimpleSocketService from '../utils/SimpleSocketService';
import {setUnreadCounts} from '../redux/Slices/MessageCountSlice';

/**
 * Hook: useGlobalUnreadCount
 * - Fetches unread counts (total + per-thread) from API on mount and on interval
 * - Subscribes to socket events to keep counts in sync in real-time
 * - Writes results to Redux via `setCount` and `updateMultipleThreadCounts`
 */
const POLL_INTERVAL_MS = 60000; // 60s

export default function useGlobalUnreadCount() {
  const dispatch = useDispatch();
  const token = useSelector(state => state?.auth?.user?.token);
  const messageCountState = useSelector(state => state?.messageCount);
  const isMounted = useRef(false);
  const pollRef = useRef(null);

  const buildThreadCountsObj = threadCountsArray => {
    // API returns [{ threadId, unreadCount, role, timestamp? }]
    const obj = {};
    if (!Array.isArray(threadCountsArray)) return obj;

    threadCountsArray.forEach(tc => {
      const id = tc.threadId != null ? String(tc.threadId) : null;
      if (!id) return;
      obj[id] = {
        count: tc.unreadCount || 0,
        timestamp: tc.timestamp || new Date().toISOString(),
      };
    });

    return obj;
  };

  const fetchAndDispatch = async () => {
    if (!token) return;
    try {
      // Use the same endpoint as task counters for consistency
      const res = await getRequest('task-management/worker/tasks/counters', token);
      if (!res) return;

      // Some APIs use `error` key, some `success`.
      const data = res.data || res;

      // Extract message count from task counters API
      const totalUnread = data?.counters?.no_read_received_messages_until_today || 0;

      // Also fetch per-thread breakdown from messages API for Messages screen
      let threadCountsArray = [];
      try {
        const threadsRes = await getRequest('messages/threads', token);
        const threadsData = threadsRes.data || threadsRes;
        if (threadsData?.threads && Array.isArray(threadsData.threads)) {
          threadCountsArray = threadsData.threads.map(t => ({
            threadId: t.id,
            unreadCount: t.unread_count || 0,
          }));
        }
      } catch (e) {
        console.log('⚠️ Failed to fetch thread breakdown, continuing with total only');
      }

      // Dispatch full unread payload (total + per-thread)
      console.log('🔔 useGlobalUnreadCount fetched totalUnread:', totalUnread);
      console.log(
        '🔔 useGlobalUnreadCount threadCountsArray length:',
        Array.isArray(threadCountsArray) ? threadCountsArray.length : 0,
      );
      console.log('🔔 useGlobalUnreadCount threadCountsArray:', threadCountsArray);

      // Calculate what the total should be based on threads
      if (Array.isArray(threadCountsArray)) {
        const calculatedTotal = threadCountsArray.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        console.log('🔔 Calculated total from threads:', calculatedTotal);
        console.log('🔔 API totalUnread:', totalUnread);
        console.log('🔔 Difference:', totalUnread - calculatedTotal);
      }

      // Check for discrepancies
      const localCount = messageCountState?.totalUnreadCount || messageCountState?.totalCount || 0;

      console.log('🔍 useGlobalUnreadCount: State comparison:');
      console.log('  messageCountState:', messageCountState);
      console.log('  localCount:', localCount);
      console.log('  API totalUnread:', totalUnread);
      console.log('  initialized:', messageCountState?.initialized);

      // ⚠️ CRITICAL: Only trust persisted data over API when:
      // 1. Persisted count is 0 (user explicitly read messages)
      // 2. API shows > 0 (stale server data)
      // 3. AND there's a reasonable explanation (e.g., user was in a chat recently)
      // This prevents API stale data from overwriting what user actually saw

      // TEMPORARY FIX: For large discrepancies, always trust API
      // If API says 9 but local says 0, user probably doesn't have 9 messages read
      // This is likely a sync issue, not user action
      if (totalUnread >= 5 && localCount === 0) {
        console.log('🚨 LARGE DISCREPANCY DETECTED: API=' + totalUnread + ', Local=' + localCount);
        console.log('🚨 This is likely a sync issue, not user action. Using API count.');
        // Don't return - let it update to API
      } else if (messageCountState?.initialized && localCount === 0 && totalUnread > 0 && totalUnread < 5) {
        console.log('⚠️ useGlobalUnreadCount: Persisted shows 0 (user read messages), API shows', totalUnread, '- using persisted');
        console.log('⚠️ This indicates user read messages - trusting local state over API');
        return; // Don't overwrite with stale API data
      }

      // If there's any other mismatch (e.g., persisted=2, API=3), UPDATE to API
      // This means user got new messages since last persistence
      if (localCount !== totalUnread && !(localCount === 0 && totalUnread > 0)) {
        console.log('📊 COUNT MISMATCH DETECTED:');
        console.log('  Local count (persisted):', localCount);
        console.log('  API count (current):', totalUnread);
        console.log('  Updating to API count (user has new messages)...');
      } else {
        console.log('✅ Counts match or updating to API:', totalUnread);
      }

      dispatch(
        setUnreadCounts({
          total: totalUnread || 0,
          threads: threadCountsArray || [],
        }),
      );

      console.log('✅ Dispatched setUnreadCounts with:', {
        total: totalUnread || 0,
        threadsCount: threadCountsArray?.length || 0,
      });
    } catch (error) {
      console.error('❌ useGlobalUnreadCount fetch error:', error);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    if (!token) return () => {};

    // Initial fetch
    fetchAndDispatch();

    // Polling
    pollRef.current = setInterval(fetchAndDispatch, POLL_INTERVAL_MS);

    // Socket handlers
    const socket = SimpleSocketService;

    const delayedRefetch = () => {
      // small delay to allow server to stabilize
      setTimeout(() => {
        fetchAndDispatch();
      }, 500);
    };

    const totalUnreadHandler = data => {
      try {
        const total =
          data?.totalUnread ?? data?.total_unread_count ?? data?.count;

        // If server sent a full payload (total + threadCounts), dispatch it directly
        if (Array.isArray(data?.threadCounts) || data?.threads) {
          const threads = data.threadCounts || data.threads || [];
          dispatch(setUnreadCounts({total: total || 0, threads}));
          return;
        }

        // Otherwise, only total arrived — update via setUnreadCounts with empty threads
        if (typeof total === 'number') {
          dispatch(setUnreadCounts({total: total || 0, threads: []}));
        }
      } catch (e) {
        console.error('❌ totalUnreadHandler error:', e);
      }
    };

    // Subscribe to relevant events
    socket.on('total_unread_count_updated', totalUnreadHandler);
    socket.on('unread_count_updated', delayedRefetch);
    socket.on('new_message', delayedRefetch);
    socket.on('messages_read', delayedRefetch);

    // Fallback: ask server for current total when socket connects
    const askServerForTotal = async () => {
      try {
        // Some servers support an emit to request counts (safe to call)
        if (socket && typeof socket.emit === 'function') {
          socket.emit('get_total_unread_count', {role: null});
        }
      } catch (e) {
        // ignore
      }
    };

    socket.on('connect', askServerForTotal);

    return () => {
      isMounted.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      try {
        socket.off('total_unread_count_updated', totalUnreadHandler);
        socket.off('unread_count_updated', delayedRefetch);
        socket.off('new_message', delayedRefetch);
        socket.off('messages_read', delayedRefetch);
        socket.off('connect', askServerForTotal);
      } catch (e) {
        // ignore
      }
    };
  }, [token]);
}
