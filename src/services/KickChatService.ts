import SystemLog from '@/lib/structures/SystemLog';
import { WebSocket, type RawData } from 'ws';

const logger = new SystemLog('services', 'KickChatService');

// <Hardcoded configs>
const hardChatRoomId = '3175624';
// </Hardcoded configs>

interface IMessageResponse {
  event: string;
  data: string;
  channel?: string;
}

class KickChatService {
  private connectionString =
    'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false';
  private chatRoomId = '';
  private ws: WebSocket | null = null;
  public status = false;

  constructor(chatRoomId = hardChatRoomId) {
    this.chatRoomId = chatRoomId;
  }

  public safeParse(obj: string): unknown | null {
    try {
      return JSON.parse(obj);
    } catch (error) {
      return null;
    }
  }

  public stop() {}

  public start() {}

  private aliveLoop() {
    if (!this.ws?.OPEN) return;
  }

  private onMessage(data: RawData) {
    const parsedData = this.safeParse(data.toString());

    // AgsService.testCode() => boolean - Usar regExp para estó
  }

  public init() {
    if (this.ws) return;

    this.ws = new WebSocket(this.connectionString);
    this.ws.on('open', () => {
      logger.log('init', 'Conectado a KickChat');
      this.ws?.send(
        JSON.stringify({
          event: 'pusher:subscribe',
          data: { auth: '', channel: `chatrooms.${this.chatRoomId}.v2` }
        })
      );
    });
    this.ws.on('message', this.onMessage.bind(this));
  }
}

export default new KickChatService();
