import SystemLog from '@/lib/structures/SystemLog';
import { WebSocket, type RawData } from 'ws';
import AgsService from './AgsService';
import cacheMe from './cacheMe';
import { CachePointers } from '@/lib/Enums';
import type { IMessageResponse } from '@/types.d';

const logger = new SystemLog('services', 'KickChatService');

// <Hardcoded configs>
const hardChatRoomId = '3175624';
const pingEvery = 5 * 60 * 1000;
const cacheCodeTtl = 3 * 60 * 1000;
// </Hardcoded configs>

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

    this.ws?.close();
    this.ws?.removeListener('message', this.onMessage);
    this.ws?.removeListener('error', this.onError);
    this.ws = null;

    if (this._loopInterval) clearInterval(this._loopInterval);
    this._status = false;
  }

  public start(): boolean {
    if (this._status) return false;
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
    logger.log('onceOpen', 'WebSocket conectado, enviando subscripcions');
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

    switch (parsedData.event) {
      case 'App\\Events\\ChatMessageEvent':
        {
          const code = AgsService.matchCode(parsedData.data?.content);

          if (!code) return;

          logger.log(
            'onMessage',
            `Posible codigo encontrado en el chat:\n${parsedData.data.sender.username}: ${code}`
          );

          const alreadyExchange = cacheMe.has(
            code + CachePointers.agsPosibleCode
          );
          cacheMe.set(code + CachePointers.agsPosibleCode, 0, {
            ttl: cacheCodeTtl
          });
          if (alreadyExchange) return;

          AgsService.sendCode({
            code,
            force: false,
            hideUntilWorks: true
          });
        }
        break;
      case 'pusher_internal:subscription_succeeded':
        {
          logger.log(
            'init',
            `Conectado al chatroom de kick [${
              parsedData.channel.split('.')[1]
            }]`
          );
        }
        break;
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
