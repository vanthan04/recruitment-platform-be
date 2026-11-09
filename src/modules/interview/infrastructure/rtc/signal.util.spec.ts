import {
  MAX_CANDIDATE_LENGTH,
  MAX_SDP_LENGTH,
  parseSignalPayload,
} from './signal.util';
import { WsValidationException } from '@/modules/chat/infrastructure/gateways/ws-validate.util';

describe('parseSignalPayload', () => {
  it('accepts an offer and copies only whitelisted fields', () => {
    const result = parseSignalPayload({
      description: { type: 'offer', sdp: 'v=0', extra: 'x' },
    });
    expect(result).toEqual({ description: { type: 'offer', sdp: 'v=0' } });
  });

  it('accepts a rollback without an sdp', () => {
    expect(parseSignalPayload({ description: { type: 'rollback' } })).toEqual({
      description: { type: 'rollback' },
    });
  });

  it('accepts an ICE candidate, including the empty end-of-candidates one', () => {
    expect(
      parseSignalPayload({
        candidate: {
          candidate: 'candidate:1 1 udp 1 1.2.3.4 5000 typ host',
          sdpMid: '0',
          sdpMLineIndex: 0,
          usernameFragment: 'abcd',
        },
      }),
    ).toEqual({
      candidate: {
        candidate: 'candidate:1 1 udp 1 1.2.3.4 5000 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
        usernameFragment: 'abcd',
      },
    });
    expect(() =>
      parseSignalPayload({ candidate: { candidate: '' } }),
    ).not.toThrow();
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'offer'],
    ['an empty object', {}],
    [
      'both description and candidate',
      {
        description: { type: 'offer', sdp: 'x' },
        candidate: { candidate: 'c' },
      },
    ],
    [
      'an unknown key',
      { description: { type: 'offer', sdp: 'x' }, to: 'someone' },
    ],
    [
      'an unknown description type',
      { description: { type: 'weird', sdp: 'x' } },
    ],
    ['an offer without sdp', { description: { type: 'offer' } }],
    ['a non-string sdp', { description: { type: 'offer', sdp: 5 } }],
    ['a non-string candidate', { candidate: { candidate: 5 } }],
    [
      'a fractional sdpMLineIndex',
      { candidate: { candidate: 'c', sdpMLineIndex: 1.5 } },
    ],
    [
      'a huge sdpMLineIndex',
      { candidate: { candidate: 'c', sdpMLineIndex: 1000 } },
    ],
    ['an object sdpMid', { candidate: { candidate: 'c', sdpMid: {} } }],
  ])('rejects %s', (_label, input) => {
    expect(() => parseSignalPayload(input)).toThrow(WsValidationException);
  });

  it('rejects an oversized sdp or candidate', () => {
    expect(() =>
      parseSignalPayload({
        description: { type: 'offer', sdp: 'x'.repeat(MAX_SDP_LENGTH + 1) },
      }),
    ).toThrow(WsValidationException);
    expect(() =>
      parseSignalPayload({
        candidate: { candidate: 'x'.repeat(MAX_CANDIDATE_LENGTH + 1) },
      }),
    ).toThrow(WsValidationException);
  });
});
