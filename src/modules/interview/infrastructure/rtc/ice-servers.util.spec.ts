import { createHmac } from 'crypto';
import { buildIceServers, parseUrlList } from './ice-servers.util';

describe('parseUrlList', () => {
  it('splits, trims and drops blanks', () => {
    expect(parseUrlList(' stun:a:3478, ,turn:b:3478 ,')).toEqual([
      'stun:a:3478',
      'turn:b:3478',
    ]);
  });

  it.each([undefined, null, '', '   '])('returns [] for %p', (value) => {
    expect(parseUrlList(value)).toEqual([]);
  });
});

describe('buildIceServers', () => {
  const NOW = Date.UTC(2026, 10, 9, 10, 0, 0);

  it('offers only STUN when no TURN is configured', () => {
    expect(
      buildIceServers(
        { stunUrls: ['stun:s:3478'], turnUrls: [], ttlSeconds: 3600 },
        'user-1',
        NOW,
      ),
    ).toEqual([{ urls: ['stun:s:3478'] }]);
  });

  it('does not offer TURN without a secret, even with URLs set', () => {
    const servers = buildIceServers(
      { stunUrls: [], turnUrls: ['turn:t:3478'], ttlSeconds: 3600 },
      'user-1',
      NOW,
    );
    expect(servers).toEqual([]);
  });

  it('issues time-limited TURN credentials per the TURN REST scheme', () => {
    const servers = buildIceServers(
      {
        stunUrls: ['stun:s:3478'],
        turnUrls: ['turn:t:3478?transport=udp', 'turns:t:5349'],
        turnSecret: 'shared-secret',
        ttlSeconds: 600,
      },
      'user-1',
      NOW,
    );

    const expiry = Math.floor(NOW / 1000) + 600;
    const username = `${expiry}:user-1`;
    expect(servers).toHaveLength(2);
    expect(servers[1]).toEqual({
      urls: ['turn:t:3478?transport=udp', 'turns:t:5349'],
      username,
      credential: createHmac('sha1', 'shared-secret')
        .update(username)
        .digest('base64'),
    });
  });

  it('never leaks the shared secret', () => {
    const servers = buildIceServers(
      {
        stunUrls: [],
        turnUrls: ['turn:t:3478'],
        turnSecret: 'shared-secret',
        ttlSeconds: 600,
      },
      'user-1',
      NOW,
    );
    expect(JSON.stringify(servers)).not.toContain('shared-secret');
  });

  it('gives each user and each time a different credential', () => {
    const cfg = {
      stunUrls: [],
      turnUrls: ['turn:t:3478'],
      turnSecret: 's',
      ttlSeconds: 600,
    };
    const a = buildIceServers(cfg, 'user-1', NOW)[0].credential;
    const b = buildIceServers(cfg, 'user-2', NOW)[0].credential;
    const later = buildIceServers(cfg, 'user-1', NOW + 5000)[0].credential;
    expect(a).not.toBe(b);
    expect(a).not.toBe(later);
  });
});
