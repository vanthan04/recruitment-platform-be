import {
  validateWsPayload,
  getSafeErrorMessage,
  WsValidationException,
} from './ws-validate.util';
import { ConversationIdWsDto } from '@/modules/chat/presentation/dtos/ws-payloads.dto';
import { ConversationNotFoundException } from '@/modules/chat/domain/exceptions/chat.exceptions';

describe('validateWsPayload', () => {
  it('returns a populated DTO instance for a valid payload', async () => {
    const result = await validateWsPayload(ConversationIdWsDto, {
      conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    expect(result).toBeInstanceOf(ConversationIdWsDto);
    expect(result.conversationId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('throws WsValidationException for a missing required field', async () => {
    await expect(validateWsPayload(ConversationIdWsDto, {})).rejects.toThrow(
      WsValidationException,
    );
  });

  it('throws WsValidationException for a non-UUID conversationId', async () => {
    await expect(
      validateWsPayload(ConversationIdWsDto, { conversationId: 'not-a-uuid' }),
    ).rejects.toThrow(WsValidationException);
  });

  it('throws WsValidationException for an unexpected extra field (whitelist)', async () => {
    await expect(
      validateWsPayload(ConversationIdWsDto, {
        conversationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        __proto__: { polluted: true },
        extraField: 'nope',
      }),
    ).rejects.toThrow(WsValidationException);
  });

  it('throws WsValidationException for null/undefined payloads instead of a raw TypeError', async () => {
    await expect(validateWsPayload(ConversationIdWsDto, undefined)).rejects.toThrow(
      WsValidationException,
    );
  });
});

describe('getSafeErrorMessage', () => {
  it('forwards a DomainException message verbatim', () => {
    expect(getSafeErrorMessage(new ConversationNotFoundException('conv-1'))).toBe(
      new ConversationNotFoundException('conv-1').message,
    );
  });

  it('forwards a WsValidationException message verbatim', () => {
    expect(getSafeErrorMessage(new WsValidationException('bad field'))).toBe(
      'bad field',
    );
  });

  it('replaces a raw Error with a generic message', () => {
    expect(
      getSafeErrorMessage(
        new Error('Unique constraint failed on the fields: (`conversationId`)'),
      ),
    ).toBe('Something went wrong, please try again');
  });

  it('replaces a non-Error thrown value with a generic message', () => {
    expect(getSafeErrorMessage('a raw string throw')).toBe(
      'Something went wrong, please try again',
    );
  });
});
