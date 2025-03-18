import { mockClient } from 'aws-sdk-client-mock';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { EventBridgeEvent, Context, Callback } from 'aws-lambda';
import { handler } from '../../amplify/functions/publish-weekly-reflection/handler';

const eventBridgeMock = mockClient(EventBridgeClient);

jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn().mockReturnValue({
    models: {
      Summary: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              userId: 'user1',
              summaryId: 'W#2025#11',
              startDate: '2025-03-10',
              endDate: '2025-03-16',
              review: null,
            },
            {
              userId: 'user2',
              summaryId: 'W#2025#11',
              startDate: '2025-03-10',
              endDate: '2025-03-16',
              review: null,
            },
          ],
          errors: null,
        }),
      },
    },
  }),
}));

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('@aws-amplify/backend');
jest.mock(
  '@aws-amplify/backend/function/runtime',
  () => ({
    getAmplifyDataClientConfig: jest.fn().mockResolvedValue({
      resourceConfig: {},
      libraryOptions: {},
    }),
  }),
  { virtual: true }
);

jest.mock('$amplify/env/publish-weekly-reflection', () => ({
  env: {},
}));

// 환경 변수 설정
process.env.EVENT_BUS_NAME = 'test-event-bus';
process.env.REGION = 'ap-northeast-2';

describe('publish-weekly-reflection Lambda 통합 테스트', () => {
  beforeEach(() => {
    // 모든 모킹 초기화
    jest.clearAllMocks();
    eventBridgeMock.reset();

    // EventBridge 응답 모킹
    eventBridgeMock.on(PutEventsCommand).resolves({
      FailedEntryCount: 0,
      Entries: [{ EventId: 'event1' }, { EventId: 'event2' }],
    });
  });

  test('전체 워크플로우가 올바르게 실행되어야 함', async () => {
    // Lambda 이벤트
    const event: EventBridgeEvent<'Scheduled Event', null> = {
      id: 'event-id',
      'detail-type': 'Scheduled Event',
      source: 'aws.events',
      account: '123456789012',
      time: '2025-03-17T00:00:00Z',
      region: 'ap-northeast-2',
      resources: [
        'arn:aws:events:ap-northeast-2:123456789012:rule/publish-weekly-reflection',
      ],
      detail: null,
      version: '0',
    };
    const context = {} as Context;
    const callback = (() => {}) as Callback<void>;

    // 핸들러 호출
    await handler(event, context, callback);

    // EventBridge에 이벤트가 발행되었는지 검증
    const calls = eventBridgeMock.calls();
    expect(calls).toHaveLength(1);

    // 타입 단언을 사용하여 TypeScript 오류 해결
    const putEventsCall = calls[0].args[0] as PutEventsCommand;
    const entries = putEventsCall.input.Entries || [];

    expect(entries.length).toBe(2);
    expect(entries[0].EventBusName).toBe('default');
    expect(entries[0].Source).toBe('kr.co.daylog.services.weeklysummary');
    expect(entries[0].DetailType).toBe('WeeklySummaryRequested');

    // 이벤트 상세 내용 검증
    if (entries[0].Detail) {
      const detail1 = JSON.parse(entries[0].Detail);
      expect(detail1.userId).toBe('user1');
      expect(detail1.summaryId).toBe('W#2025#11');
      expect(detail1.startDate).toBe('2025-03-10');
      expect(detail1.endDate).toBe('2025-03-16');
    }

    if (entries[1].Detail) {
      const detail2 = JSON.parse(entries[1].Detail);
      expect(detail2.userId).toBe('user2');
    }
  });

  test('오류가 발생하면 적절히 처리해야 함', async () => {
    // EventBridge 오류 모킹
    eventBridgeMock
      .on(PutEventsCommand)
      .rejects(new Error('EventBridge error'));

    // Lambda 이벤트
    const event: EventBridgeEvent<'Scheduled Event', null> = {
      id: 'event-id',
      'detail-type': 'Scheduled Event',
      source: 'aws.events',
      account: '123456789012',
      time: '2025-03-17T00:00:00Z',
      region: 'ap-northeast-2',
      resources: [],
      detail: null,
      version: '0',
    };

    const context = {} as Context;
    const callback = (() => {}) as Callback<void>;

    // 핸들러 호출 및 오류 검증
    await expect(handler(event, context, callback)).rejects.toThrow(
      'EventBridge error'
    );
  });
});
