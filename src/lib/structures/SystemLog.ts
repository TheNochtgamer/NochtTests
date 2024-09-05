/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { WebhookClient, type WebhookMessageCreateOptions } from 'discord.js';

const sendOptions: WebhookMessageCreateOptions = {
  username: 'MyLogs',
  avatarURL:
    'https://cdn.discordapp.com/avatars/940033648772648981/a3d656b2e9782aa4a291263af3b26097.png',
};

const webhookLog = new (class {
  private readonly logHook: WebhookClient;
  private readonly toLog: string[] = [];
  private readonly _sendLoopInterval;
  private _logWebhookExist = false;

  constructor() {
    this.logHook = new WebhookClient({
      url: process.env.LOG_WEBHOOK_URL ?? '',
    });
    void this.testWebhook();
    this._sendLoopInterval = setInterval(() => {
      if (this.toLog.length === 0) return;
      void this.sendLog();
    }, 1000 * 3);
  }

  public now(): string {
    return `[${new Date()
      .toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      .replace(/\/[0-9]+,/, '')
      .replace(/[0-9]+(\/| )/g, match => match.padStart(3, '0'))}]`;
  }

  public addToLog(type: 'info' | 'error' | 'warn', content: string): void {
    this.toLog.push(`**[${type.toUpperCase()}]** ${content}`);
  }

  private async testWebhook(): Promise<void> {
    if (!process.env.LOG_WEBHOOK_URL) return;
    try {
      await this.logHook.send({
        content: '```\n' + `${this.now()} Iniciando sistema.` + '```',
      });
      this._logWebhookExist = true;
    } catch (error) {
      console.error(`${this.now()} Error en el webhook de logs: `, error);
      clearInterval(this._sendLoopInterval);
    }
  }

  private async sendLog(): Promise<void> {
    if (!this._logWebhookExist) return;

    const content = '```\n' + this.toLog.join('\n');
    this.toLog.length = 0;
    try {
      await this.logHook.send({
        content:
          content.slice(0, 1995) + (content.length > 1995) ? '++' : '' + '```',
        ...sendOptions,
      });
    } catch (error) {
      console.error(`${this.now()} Error al enviar logs: `, error);
    }
  }
})();

export default class SystemLog {
  public readonly filePath: string;

  constructor(...filePath: string[]) {
    this.filePath = filePath.join('/');
  }

  public now(): string {
    return `[${new Date()
      .toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      .replace(/\/[0-9]+,/, '')
      .replace(/[0-9]+(\/| )/g, match => match.padStart(3, '0'))}]`;
  }

  public getPath(): string {
    return './src/' + this.filePath + '.ts';
  }

  public log(functionName: string, ...args: any[]): void {
    console.log(this.now(), `<${this.getPath()}:${functionName}()>`, ...args);
    webhookLog.addToLog(
      'info',
      `${this.now()} <${this.getPath()}:${functionName}()> ${args.join(' ')}`
    );
  }

  public warn(functionName: string, ...args: any[]): void {
    console.warn(this.now(), `<${this.getPath()}:${functionName}()>`, ...args);
    webhookLog.addToLog(
      'warn',
      `${this.now()} <${this.getPath()}:${functionName}()> ${args.join(' ')}`
    );
  }

  public error(functionName: string, ...args: any[]): void {
    console.error(this.now(), `<${this.getPath()}:${functionName}()>`, ...args);
    webhookLog.addToLog(
      'error',
      `${this.now()} <${this.getPath()}:${functionName}()> ${args.join(' ')}`
    );
  }
}
