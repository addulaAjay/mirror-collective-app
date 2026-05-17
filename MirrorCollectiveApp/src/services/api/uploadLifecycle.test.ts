/**
 * Tests for the AppState-driven upload lifecycle helper.
 */

import { AppState, AppStateStatus } from 'react-native';

import {
  startUploadLifecycleMonitor,
  withUploadLifecycle,
} from './uploadLifecycle';

describe('startUploadLifecycleMonitor', () => {
  let listeners: Array<(state: AppStateStatus) => void> = [];
  let removeCalls: number;

  beforeEach(() => {
    listeners = [];
    removeCalls = 0;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_event, cb): { remove: () => void } => {
        listeners.push(cb as (state: AppStateStatus) => void);
        return {
          remove: () => {
            removeCalls++;
          },
        };
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function emit(state: AppStateStatus) {
    listeners.forEach(l => l(state));
  }

  it('sets isBackgroundedSinceStart on background transition', () => {
    const m = startUploadLifecycleMonitor();
    expect(m.isBackgroundedSinceStart).toBe(false);
    emit('background');
    expect(m.isBackgroundedSinceStart).toBe(true);
  });

  it('also flips on the iOS "inactive" intermediate state', () => {
    const m = startUploadLifecycleMonitor();
    emit('inactive');
    expect(m.isBackgroundedSinceStart).toBe(true);
  });

  it('fires onBackground exactly once even on multiple transitions', () => {
    const onBackground = jest.fn();
    startUploadLifecycleMonitor({ onBackground });
    emit('background');
    emit('active');
    emit('background');
    emit('inactive');
    expect(onBackground).toHaveBeenCalledTimes(1);
  });

  it('ignores active-only transitions', () => {
    const onBackground = jest.fn();
    const m = startUploadLifecycleMonitor({ onBackground });
    emit('active');
    emit('active');
    expect(onBackground).not.toHaveBeenCalled();
    expect(m.isBackgroundedSinceStart).toBe(false);
  });

  it('stop() removes the AppState listener', () => {
    const m = startUploadLifecycleMonitor();
    expect(removeCalls).toBe(0);
    m.stop();
    expect(removeCalls).toBe(1);
  });

  it('does not crash if onBackground callback throws', () => {
    const onBackground = jest.fn(() => {
      throw new Error('boom');
    });
    const m = startUploadLifecycleMonitor({ onBackground });
    expect(() => emit('background')).not.toThrow();
    expect(m.isBackgroundedSinceStart).toBe(true);
  });
});

describe('withUploadLifecycle', () => {
  let listeners: Array<(state: AppStateStatus) => void> = [];
  let removeCalls: number;

  beforeEach(() => {
    listeners = [];
    removeCalls = 0;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_event, cb): { remove: () => void } => {
        listeners.push(cb as (state: AppStateStatus) => void);
        return {
          remove: () => {
            removeCalls++;
          },
        };
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tears down the listener on success', async () => {
    const result = await withUploadLifecycle({}, async monitor => {
      expect(monitor.isBackgroundedSinceStart).toBe(false);
      return 42;
    });
    expect(result).toBe(42);
    expect(removeCalls).toBe(1);
  });

  it('tears down the listener even on rejection', async () => {
    await expect(
      withUploadLifecycle({}, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(removeCalls).toBe(1);
  });

  it('passes the monitor with up-to-date state to the inner fn', async () => {
    await withUploadLifecycle({}, async monitor => {
      // Simulate a backgrounding mid-flight.
      listeners.forEach(l => l('background'));
      expect(monitor.isBackgroundedSinceStart).toBe(true);
    });
  });
});
