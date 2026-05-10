/**
 * Tests for JourneyContext — verifies that welcome-seen state syncs from
 * AsyncStorage and that session/snapshot mutations update the context.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import {
  JourneyProvider,
  useJourney,
} from '../state/JourneyContext';
import type { MotifPayload, SnapshotResponse } from '../api/types';

const mockMotif: MotifPayload = {
  motif_id: 'spiral',
  motif_name: 'Spiral',
  icon: '🌀',
  element: 'Fire',
  tone_tag: 'Evolution / Integration',
  why_text: 'Test why',
  room_skin: 'Spiral Room',
  scores: { evolution: 4 },
  explanation: ['Q3=spiral'],
  override_allowed: false,
};

const mockSnapshot: SnapshotResponse = {
  session_id: 'sess-1',
  motif_context: { motif_id: 'spiral', room_skin: 'Spiral Room' },
  loops: [],
  updated_at: '2026-05-03T00:00:00Z',
};

describe('JourneyContext', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <JourneyProvider>{children}</JourneyProvider>;
  }

  it('starts unchecked and resolves welcomeSeen=false when storage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useJourney(), { wrapper });

    expect(result.current.welcomeChecked).toBe(false);
    expect(result.current.welcomeSeen).toBe(false);

    await waitFor(() => expect(result.current.welcomeChecked).toBe(true));
    expect(result.current.welcomeSeen).toBe(false);
  });

  it('resolves welcomeSeen=true when stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    const { result } = renderHook(() => useJourney(), { wrapper });

    await waitFor(() => expect(result.current.welcomeChecked).toBe(true));
    expect(result.current.welcomeSeen).toBe(true);
  });

  it('setWelcomeSeen updates state and writes AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useJourney(), { wrapper });
    await waitFor(() => expect(result.current.welcomeChecked).toBe(true));

    await act(async () => {
      await result.current.setWelcomeSeen();
    });

    expect(result.current.welcomeSeen).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'RR_WELCOME_SEEN',
      'true',
    );
  });

  it('setSession updates sessionId + motif', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useJourney(), { wrapper });
    await waitFor(() => expect(result.current.welcomeChecked).toBe(true));

    act(() => {
      result.current.setSession({ sessionId: 'sess-1', motif: mockMotif });
    });

    expect(result.current.sessionId).toBe('sess-1');
    expect(result.current.motif).toEqual(mockMotif);
  });

  it('setSnapshot updates the cached snapshot', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useJourney(), { wrapper });
    await waitFor(() => expect(result.current.welcomeChecked).toBe(true));

    act(() => {
      result.current.setSnapshot(mockSnapshot);
    });

    expect(result.current.snapshot).toEqual(mockSnapshot);
  });

  it('reset clears session, motif, and snapshot but preserves welcome flag', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    const { result } = renderHook(() => useJourney(), { wrapper });
    await waitFor(() => expect(result.current.welcomeChecked).toBe(true));

    act(() => {
      result.current.setSession({ sessionId: 'sess-1', motif: mockMotif });
      result.current.setSnapshot(mockSnapshot);
    });
    expect(result.current.sessionId).toBe('sess-1');

    act(() => {
      result.current.reset();
    });

    expect(result.current.sessionId).toBeNull();
    expect(result.current.motif).toBeNull();
    expect(result.current.snapshot).toBeNull();
    expect(result.current.welcomeSeen).toBe(true);
  });

  it('useJourney throws when used outside the provider', () => {
    const { result } = renderHook(() => {
      try {
        return useJourney();
      } catch (e) {
        return e;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/JourneyProvider/);
  });
});
