/* eslint-disable @typescript-eslint/no-unsafe-argument */

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
  }

  public warn(functionName: string, ...args: any[]): void {
    console.warn(this.now(), `<${this.getPath()}:${functionName}()>`, ...args);
  }

  public error(functionName: string, ...args: any[]): void {
    console.error(this.now(), `<${this.getPath()}:${functionName}()>`, ...args);
  }
}
