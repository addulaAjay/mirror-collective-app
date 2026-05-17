/**
 * React hook: returns the utteranceId of the message currently being
 * spoken (or null). Re-renders subscribers when the active id changes.
 *
 * MessageBubble uses this to render the right speaker glyph — play when
 * idle or speaking someone else, stop when *this* bubble is the one
 * speaking.
 */

import { useEffect, useState } from 'react';

import { ttsService } from './ttsService';

export function useTtsActiveId(): string | null {
  const [activeId, setActiveId] = useState<string | null>(
    ttsService.getActiveUtteranceId(),
  );

  useEffect(() => {
    const unsubscribe = ttsService.subscribe((event) => {
      // started → mark active; finished/cancelled → clear.
      setActiveId(event.type === 'started' ? event.utteranceId : null);
    });
    return unsubscribe;
  }, []);

  return activeId;
}
