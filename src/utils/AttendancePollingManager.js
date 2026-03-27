import {getLastPunchDetails} from '../Constants/api';

class AttendancePollingManager {
  constructor() {
    this.pollingInterval = null;
    this.subscribers = new Set();
    this.lastFetchTime = 0;
    this.currentState = null;
    this.isPolling = false;
    this.token = null;
    this.managerId = Math.random().toString(36).substr(2, 9);
    this.consecutiveErrors = 0;
    this.maxRetries = 3;

    console.log(`🏗️ AttendancePollingManager [${this.managerId}] created`);
  }

  subscribe(callback, componentId) {
    this.subscribers.add({callback, componentId});

    // If we have current state, immediately notify the new subscriber
    if (this.currentState) {
      callback(this.currentState);
    }

    return () => {
      this.subscribers = new Set(
        [...this.subscribers].filter(sub => sub.componentId !== componentId),
      );

      // If no more subscribers, stop polling
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  notifySubscribers(state) {
    this.subscribers.forEach(({callback, componentId}) => {
      try {
        callback(state);
      } catch (error) {
        console.error(
          `❌ [${this.managerId}] Error notifying subscriber ${componentId}:`,
          error,
        );
      }
    });
  }

  async fetchAttendanceData() {
    const now = Date.now();

    this.lastFetchTime = now;

    try {
      const response = await getLastPunchDetails(this.token);

      if (!response) {
        this.consecutiveErrors++;
        return;
      }

      if (response.error) {
        this.consecutiveErrors++;
        return;
      }

      this.consecutiveErrors = 0;

      const newState = this.processResponse(response);

      if (
        !this.currentState ||
        this.currentState.actionType !== newState.actionType
      ) {
        this.currentState = newState;
        this.notifySubscribers(newState);
      } else {
      }
    } catch (error) {
      console.error(`❌ [${this.managerId}] Fetch error:`, error);
      this.consecutiveErrors++;
    }
  }

  processResponse(response) {
    if (
      !response.data ||
      !response.data.records ||
      response.data.records.length === 0
    ) {
      return {
        actionType: '',
        data: null,
        timestamp: Date.now(),
      };
    }

    const records = response.data.records;

    // Validate records array
    const validRecords = records.filter(
      record => record && record.action_type && record.occurred_at,
    );

    if (validRecords.length === 0) {
      return {
        actionType: '',
        data: null,
        timestamp: Date.now(),
      };
    }

    const sortedRecords = validRecords.sort(
      (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
    );
    const latestRecord = sortedRecords[0];

    // Additional safety check
    if (!latestRecord || !latestRecord.action_type) {
      return {
        actionType: '',
        data: null,
        timestamp: Date.now(),
      };
    }

    const mappedState = this.mapActionTypeToState(latestRecord.action_type);

    return {
      actionType: mappedState,
      data: {
        latestRecord,
        sortedRecords,
        rawResponse: response,
      },
      timestamp: Date.now(),
    };
  }

  mapActionTypeToState(actionType) {
    switch (actionType) {
      case 'CLOCK_IN':
        return 'CLOCKED_IN';
      case 'CLOCK_OUT':
        return 'CLOCKED_OUT';
      case 'BREAK_START':
        return 'ON_BREAK';
      case 'BREAK_END':
        return 'CLOCKED_IN';
      default:
        return '';
    }
  }

  startPolling(token) {
    if (this.isPolling && this.token === token) {
      return;
    }

    this.stopPolling(); // Stop any existing polling
    this.token = token;
    this.isPolling = true;
    this.consecutiveErrors = 0;

    // Initial fetch
    this.fetchAttendanceData();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      if (this.subscribers.size > 0) {
        // Adjust interval based on error count
        const shouldFetch =
          this.consecutiveErrors < this.maxRetries ||
          Date.now() - this.lastFetchTime > 60000;

        if (shouldFetch) {
          this.fetchAttendanceData();
        } else {
        }
      } else {
        this.stopPolling();
      }
    }, 30000); // 30 seconds
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
    }
  }

  updateState(newState) {
    console.log(
      `🔄 [${this.managerId}] Manually updating state to: ${newState.actionType}`,
    );
    this.currentState = newState;
    this.notifySubscribers(newState);
  }

  forceRefresh() {
    console.log(`🔄 [${this.managerId}] Force refresh requested`);
    if (this.token) {
      this.fetchAttendanceData();
    }
  }

  getCurrentState() {
    return this.currentState;
  }

  getStatus() {
    return {
      isPolling: this.isPolling,
      subscriberCount: this.subscribers.size,
      lastFetchTime: this.lastFetchTime,
      currentState: this.currentState?.actionType || 'none',
      managerId: this.managerId,
      consecutiveErrors: this.consecutiveErrors,
    };
  }
}

// Export singleton instance
export const attendancePollingManager = new AttendancePollingManager();
