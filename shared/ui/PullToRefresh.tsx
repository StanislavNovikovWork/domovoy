'use client';

import { useEffect, useRef, useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
import { Box, Loader } from '@mantine/core';

const THRESHOLD = 70;
const MAX_PULL = 110;

// есть ли у элемента или его предков прокрутка, уже сдвинутая вниз: тогда тянуть страницу рано
function scrolledAncestor(el: EventTarget | null) {
  let node = el as HTMLElement | null;
  while (node && node !== document.body) {
    if (node.scrollHeight > node.clientHeight && node.scrollTop > 0) return true;
    node = node.parentElement;
  }
  return false;
}

// «потяни для обновления»: тянем вниз от верха страницы, по отпусканию страница перезагружается (как F5)
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  const current = useRef(0);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      // не при открытых окнах (Mantine блокирует прокрутку body) и не на прокрученном содержимом
      const locked = document.body.hasAttribute('data-scroll-locked');
      start.current =
        !locked && window.scrollY <= 0 && !scrolledAncestor(e.target) ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0) {
        current.current = 0;
        setPull(0);
        return;
      }
      current.current = Math.min(dy * 0.5, MAX_PULL);
      setPull(current.current);
    };
    const onEnd = () => {
      if (start.current === null) return;
      start.current = null;
      if (current.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        window.location.reload();
      } else {
        current.current = 0;
        setPull(0);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  if (pull === 0 && !refreshing) return null;

  return (
    <Box
      hiddenFrom="sm"
      pos="fixed"
      top={0}
      left="50%"
      style={{
        zIndex: 400,
        transform: `translate(-50%, ${pull - 44}px)`,
        pointerEvents: 'none',
      }}
    >
      <Box
        w={36}
        h={36}
        bg="var(--mantine-color-body)"
        style={{
          borderRadius: '50%',
          boxShadow: 'var(--mantine-shadow-md)',
          display: 'grid',
          placeItems: 'center',
          opacity: Math.min(pull / THRESHOLD, 1),
        }}
      >
        {refreshing ? (
          <Loader size={18} />
        ) : (
          <IconRefresh
            size={18}
            style={{ transform: `rotate(${(pull / THRESHOLD) * 270}deg)` }}
          />
        )}
      </Box>
    </Box>
  );
}
