import { WsValidationException } from '@/modules/chat/infrastructure/gateways/ws-validate.util';

export type SessionDescriptionType =
  'offer' | 'answer' | 'pranswer' | 'rollback';

export interface SignalDescription {
  type: SessionDescriptionType;
  sdp?: string;
}

export interface SignalCandidate {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

/** Exactly one of the two, as in the WebRTC "perfect negotiation" pattern. */
export type SignalPayload =
  | { description: SignalDescription; candidate?: undefined }
  | { candidate: SignalCandidate; description?: undefined };

// Real SDPs are a few KB; this is generous while still bounding what one
// message can make the server relay.
export const MAX_SDP_LENGTH = 20_000;
export const MAX_CANDIDATE_LENGTH = 2_000;
const MAX_ID_LENGTH = 100;
const DESCRIPTION_TYPES: SessionDescriptionType[] = [
  'offer',
  'answer',
  'pranswer',
  'rollback',
];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function optionalString(
  value: unknown,
  field: string,
  max: number,
): string | null | undefined {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string' || value.length > max) {
    throw new WsValidationException(`Invalid ${field}`);
  }
  return value;
}

/**
 * Validates and re-builds a signaling message from untrusted input. Only
 * whitelisted fields are copied, so nothing extra can ride along to the other
 * participant. The server never interprets the SDP/candidate — it only checks
 * shape and size and relays it.
 */
export function parseSignalPayload(raw: unknown): SignalPayload {
  if (!isObject(raw)) throw new WsValidationException('Invalid signal');

  const keys = Object.keys(raw);
  if (keys.some((k) => k !== 'description' && k !== 'candidate')) {
    throw new WsValidationException('Invalid signal');
  }
  const hasDescription = raw.description !== undefined;
  const hasCandidate = raw.candidate !== undefined;
  if (hasDescription === hasCandidate) {
    throw new WsValidationException(
      'Signal must contain exactly one of description or candidate',
    );
  }

  if (hasDescription) {
    const d = raw.description;
    if (
      !isObject(d) ||
      typeof d.type !== 'string' ||
      !DESCRIPTION_TYPES.includes(d.type as SessionDescriptionType)
    ) {
      throw new WsValidationException('Invalid description');
    }
    const type = d.type as SessionDescriptionType;
    if (d.sdp !== undefined && typeof d.sdp !== 'string') {
      throw new WsValidationException('Invalid description');
    }
    if (typeof d.sdp === 'string' && d.sdp.length > MAX_SDP_LENGTH) {
      throw new WsValidationException('Description too large');
    }
    // Everything except a rollback carries an SDP.
    if (type !== 'rollback' && !d.sdp) {
      throw new WsValidationException('Invalid description');
    }
    return {
      description: { type, ...(d.sdp ? { sdp: d.sdp } : {}) },
    };
  }

  const c = raw.candidate;
  if (!isObject(c) || typeof c.candidate !== 'string') {
    throw new WsValidationException('Invalid candidate');
  }
  if (c.candidate.length > MAX_CANDIDATE_LENGTH) {
    throw new WsValidationException('Candidate too large');
  }
  const sdpMLineIndex = c.sdpMLineIndex;
  if (
    sdpMLineIndex !== undefined &&
    sdpMLineIndex !== null &&
    (typeof sdpMLineIndex !== 'number' ||
      !Number.isInteger(sdpMLineIndex) ||
      sdpMLineIndex < 0 ||
      sdpMLineIndex > 255)
  ) {
    throw new WsValidationException('Invalid candidate');
  }
  return {
    candidate: {
      candidate: c.candidate,
      sdpMid: optionalString(c.sdpMid, 'candidate', MAX_ID_LENGTH),
      sdpMLineIndex: sdpMLineIndex,
      usernameFragment: optionalString(
        c.usernameFragment,
        'candidate',
        MAX_ID_LENGTH,
      ),
    },
  };
}
