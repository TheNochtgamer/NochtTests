import SystemLog from '@/lib/structures/SystemLog';
import { WebSocket, type RawData } from 'ws';
import AgsService from './AgsService';
import cacheMe from './cacheMe';
import { CachePointers } from '@/lib/Enums';

const logger = new SystemLog('services', 'KickChatService');

// <Hardcoded configs>
const hardChatRoomId = '3175624';
const pingEvery = 5 * 60 * 1000;
const cacheCodeTtl = 3 * 60 * 1000;
// </Hardcoded configs>

interface IErrorResponse {
  event: 'pusher:error';
  data: {
    error: {
      code: number;
      message: string;
    };
  };
}
interface IPongResponse {
  event: 'pusher:pong';
  data: object;
}
interface ISubscriptionResponse {
  event: 'pusher_internal:subscription_succeeded';
  data: object;
  channel: string;
}
interface IChatMessageResponse {
  event: 'App\\Events\\ChatMessageEvent';
  data: {
    message: {
      id: string;
      chatroom_id: number;
      content: string;
      type: 'message';
      created_at: string;
      sender: {
        id: number;
        username: string;
        slug: string;
        identity: {
          color: string;
          badges: string[];
        };
      };
    };
  };
}
interface IChatMessageResponseReply {
  event: 'App\\Events\\ChatMessageEvent';
  data: {
    message: {
      id: string;
      chatroom_id: number;
      content: string;
      type: 'reply';
      created_at: string;
      sender: {
        id: number;
        username: string;
        slug: string;
        identity: {
          color: string;
          badges: string[];
        };
      };
      metadata: {
        original_sender: {
          id: number;
          username: string;
        };
        original_message: {
          id: string;
          content: string;
        };
      };
    };
  };
}

type IMessageResponse =
  | IErrorResponse
  | IPongResponse
  | ISubscriptionResponse
  | IChatMessageResponse
  | IChatMessageResponseReply;

class KickChatService {
  private connectionString =
    'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false';
  private chatRoomId = '';
  private ws: WebSocket | null = null;
  private _status = false;
  private _loopInterval: NodeJS.Timeout | null = null;

  constructor(chatRoomId = hardChatRoomId) {
    this.chatRoomId = chatRoomId;
  }

  get status() {
    return this._status;
  }

  public safeParse(obj: string): unknown | null {
    try {
      const parsedObj = JSON.parse(obj);
      if (parsedObj.data) {
        parsedObj.data = JSON.parse(parsedObj.data);
      }
      return parsedObj;
    } catch (error) {
      logger.error(
        'safeParse',
        'Error during parse a message from kick: ',
        error
      );
      return null;
    }
  }

  public stop() {
    logger.log(
      'stop',
      this._status
        ? 'Apagando servicio de vigilancia'
        : 'El servicio de vigilancia ya estaba apagado'
    );
    if (this._loopInterval) clearInterval(this._loopInterval);
    this._status = false;
  }

  public start(): boolean {
    if (!this._status) return false;
    logger.log('start', 'Iniciando servicio de vigilancia');

    this.init();
    return true;
  }

  private aliveLoop() {
    if (!this.ws?.OPEN) return;

    this.ws.send(
      JSON.stringify({
        event: 'pusher:ping',
        data: {}
      })
    );
  }

  private onceOpen() {
    logger.log('init', 'Conectado a KickChat');
    this._status = true;
    this.ws?.send(
      JSON.stringify({
        event: 'pusher:subscribe',
        data: { auth: '', channel: `chatrooms.${this.chatRoomId}.v2` }
      })
    );
    this._loopInterval = setInterval(this.aliveLoop.bind(this), pingEvery);
  }

  private onMessage(data: RawData) {
    const parsedData = this.safeParse(
      data.toString()
    ) as IMessageResponse | null;

    if (!parsedData) return;

    if (parsedData.event === 'App\\Events\\ChatMessageEvent') {
      const code = AgsService.matchCode(parsedData.data.message.content);

      if (!code) return;

      let codeFinds =
        (cacheMe.get(code + CachePointers.agsPosibleCode) as number | null) ||
        0;

      cacheMe.set(code + CachePointers.agsPosibleCode, ++codeFinds, {
        ttl: cacheCodeTtl
      });

      if (codeFinds > 1) {
        AgsService.sendCode(code);
      }
    }
  }

  private onError(err: Error) {
    logger.error(
      'onError',
      'Error durante la vigilancia del chat de kick:',
      err
    );

    this.stop();
  }

  private init() {
    if (this.ws) return;

    this.ws = new WebSocket(this.connectionString);
    this.ws.once('open', this.onceOpen.bind(this));
    this.ws.on('message', this.onMessage.bind(this));
    this.ws.on('error', this.onError.bind(this));
  }
}

export default new KickChatService();
