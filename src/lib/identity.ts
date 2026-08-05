import { useCallback, useState } from 'react';

const STORAGE_KEY = 'liveboard:identity';

const ADJECTIVES = [
  'Brave', 'Calm', 'Clever', 'Eager', 'Gentle', 'Happy', 'Jolly', 'Kind',
  'Lively', 'Mighty', 'Nimble', 'Proud', 'Quiet', 'Swift', 'Witty',
];
const ANIMALS = [
  'Falcon', 'Otter', 'Panther', 'Heron', 'Fox', 'Wolf', 'Lynx', 'Raven',
  'Badger', 'Dolphin', 'Hawk', 'Tiger', 'Bear', 'Owl', 'Seal',
];
const COLORS = ['#EF476F', '#06D6A0', '#118AB2', '#7B61FF', '#F3722C', '#577590', '#43AA8B', '#F94144'];

export interface Identity {
  userId: string;
  name: string;
  color: string;
}

function randomFrom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function createIdentity(): Identity {
  return {
    userId: crypto.randomUUID(),
    name: `${randomFrom(ADJECTIVES)} ${randomFrom(ANIMALS)}`,
    color: randomFrom(COLORS),
  };
}

function readIdentity(): Identity {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      if (parsed.userId && parsed.name && parsed.color) return parsed as Identity;
    } catch {
      // fall through to create a fresh identity
    }
  }
  const identity = createIdentity();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity>(() => readIdentity());

  const rename = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIdentity((current) => {
      const next = { ...current, name: trimmed };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { identity, rename };
}
