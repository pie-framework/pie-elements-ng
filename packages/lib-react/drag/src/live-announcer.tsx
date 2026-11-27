import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * How long a message stays in a live region once it is there. A screen reader takes the message as it
 * lands; left in place, it sits in the reading order where a user who reads the page finds it later,
 * no longer true (PIE-1547).
 */
export const ANNOUNCEMENT_CLEAR_MS = 100;

/** One message for a live region. A new `id` each time, so the same words twice are said twice. */
export interface Announcement {
  id: number;
  text: string;
}

// Counted here rather than from the owner's last message: an owner that sets its announcement back to
// nothing (as drag-in-the-blank does when a drag starts or is cancelled) would otherwise start again at 1,
// an id its region has already said and emptied, and every message after it would go unsaid (PIE-1547).
let lastAnnouncementId = 0;

/** A new announcement saying `text`, with an id no announcement has had before. */
export const nextAnnouncement = (text: string): Announcement => {
  lastAnnouncementId += 1;

  return { id: lastAnnouncementId, text };
};

// The visually hidden style of dnd-kit's own live region, so the region takes no room wherever it sits.
const visuallyHidden: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: 1,
  height: 1,
  margin: -1,
  border: 0,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(100%)',
  whiteSpace: 'nowrap',
};

// MathJax's default `ignoreHtmlClass`, which the math adapter keeps: a message is words, with any math in
// it already spoken, so a typeset of the page around the region must not turn it into unnamed math.
const MATHJAX_IGNORE = 'mathjax_ignore';

export interface LiveAnnouncerProps {
  /**
   * What to say, made by `nextAnnouncement`. A change of `id` says its text, which is then cleared after
   * `ANNOUNCEMENT_CLEAR_MS`; `undefined` empties the region at once.
   */
  announcement?: Announcement;
  politeness?: 'polite' | 'assertive';
  id?: string;
}

/**
 * A visually hidden live region that says each announcement it is given and empties itself
 * `ANNOUNCEMENT_CLEAR_MS` later. The clock starts when the message reaches the region, so a message an
 * element holds back (until focus settles, say) is still said in full. Each message is a new node, which
 * a screen reader reads again even when the words repeat.
 */
export function LiveAnnouncer({ announcement, politeness = 'assertive', id }: LiveAnnouncerProps) {
  const [clearedId, setClearedId] = useState<number | undefined>();
  const messageId = announcement?.id;
  const text = announcement?.text;

  useEffect(() => {
    if (!text) {
      return undefined;
    }

    const timer = setTimeout(() => setClearedId(messageId), ANNOUNCEMENT_CLEAR_MS);

    return () => clearTimeout(timer);
  }, [messageId, text]);

  const shown = text && messageId !== clearedId ? text : '';

  return (
    <div id={id} className={MATHJAX_IGNORE} style={visuallyHidden} role="status" aria-live={politeness} aria-atomic="true">
      {shown ? <span key={messageId}>{shown}</span> : null}
    </div>
  );
}

export default LiveAnnouncer;
