/* eslint-disable @typescript-eslint/naming-convention */
import type { IAgsRewardPageResponse, AgsUserData, Bot } from '@/types';
import {
  AgsPages,
  CachePointers,
  AgsResponseTypes,
  AgsPrizes
} from '@/lib/Enums';
import axios from 'axios';
import SystemLog from '@/lib/structures/SystemLog';
import Utils from '@/lib/Utils';
import DatabaseManager from './DatabaseManager';
import cacheMe from './cacheMe';

const logger = new SystemLog('services', 'AgsService');

class AgsService {
  public bot: Bot | undefined;

  private async fetchReward(token: string, code?: string) {
    const response = await axios.get<IAgsRewardPageResponse>(AgsPages.reward, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'sec-ch-ua':
          '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        Referer: 'https://app.argentinagameshow.com/reward',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        Cookie: `PHPSESSID=${token}`
      },
      timeout: 5000,
      params: code
        ? {
            action: 'code',
            code
          }
        : null
    });

    return response;
  }

  public async testToken(token: string): Promise<0 | 1 | string> {
    try {
      const { data } = await this.fetchReward(token);
      if (data.text === '') return 0;
      if (
        Utils.compareTwoStrings(
          data.text || '',
          AgsResponseTypes.invalidToken
        ) >= 90
      )
        return '<Tu token es invalido>';
      return data.text;
    } catch (error) {
      logger.error('testToken', 'No se obtuvo respuesta de la pagina:', error);
      return 1;
    }
  }

  public async loadCodeForOne(
    user: AgsUserData,
    code: string
  ): Promise<IAgsRewardPageResponse | null> {
    void this.saveCode(code);
    let tries = 0;

    const maxTries = () => Math.floor(5 + user.priority * 0.5);
    const sleepTime = () => Math.max(2, 10 / (tries + 1)) * 1000;

    while (tries < maxTries()) {
      try {
        const { data } = await this.fetchReward(user.token, code);

        logger.log(
          'loadOneCode',
          `user_${user.user_id}:${
            user.ds_id
              ? this.bot?.users.cache.get(user.ds_id)?.displayName ??
                this.bot?.users.cache.get(user.ds_id)?.username ??
                user.ds_id
              : user.reference
          } >\n${JSON.stringify(data, null, 2)}`
        );

        void this.saveExchange(user.user_id, code, data);
        return data;
      } catch (error) {
        logger.error(
          'loadOneCode',
          `user_${user.user_id} > No se obtuvo respuesta de la pagina:`,
          error
        );
        tries++;
        if (tries < maxTries())
          await Utils.getRandomSleep(sleepTime(), sleepTime() + 1000);
      }
    }

    logger.error(
      'loadOneCode',
      `user_${user.user_id} > Demasiados intentos fallidos`
    );

    void this.saveExchange(user.user_id, code, null);
    return null;
  }

  public async loadCodeForAll(
    users: AgsUserData[],
    code: string,
    force: boolean = false,
    cb?: (
      user: AgsUserData,
      response: IAgsRewardPageResponse | null
    ) => void | Promise<void>
  ): Promise<Array<IAgsRewardPageResponse | null>> {
    const responses: Array<IAgsRewardPageResponse | null> = [];
    const firstUser = Utils.arrayRandom(users.filter(u => u.ds_id));

    if (!force && firstUser) {
      const firstResponse = await this.loadCodeForOne(firstUser, code);

      responses.push(firstResponse);
      if (cb) void cb(firstUser, firstResponse);

      if (!firstResponse) return responses;

      if (
        Utils.compareTwoStrings(
          firstResponse.text || '',
          AgsResponseTypes.codeLimit
        ) >= 90
      ) {
        logger.log(
          'loadCodeForAll',
          'Abortando... El codigo llego a su limite...'
        );
        return responses;
      }

      if (
        Utils.compareTwoStrings(
          firstResponse.text || '',
          AgsResponseTypes.invalidCode
        ) >= 90
      ) {
        logger.log('loadCodeForAll', 'Abortando... Codigo invalido...');
        return responses;
      }
    }

    const promises = users
      .filter(user => force || firstUser?.user_id !== user.user_id)
      .sort((a, b) => b.priority - a.priority)
      .map(async user => {
        const response = await this.loadCodeForOne(user, code);
        if (user.hidden) return;
        responses.push(response);
        if (cb) void cb(user, response);
      });

    await Promise.all(promises);

    return responses;
  }

  public parseResponseText(response: IAgsRewardPageResponse | null): string {
    if (!response?.text) return '<La pagina no dio respuesta>';
    let text = response.text || '';
    // const regex = /([<][a-z][^<]*>)|([<][/][a-z]*>)/g;

    try {
      if (
        (typeof response.extra === 'number' && response.extra > 4) ||
        (typeof response.code === 'string' && response.code.length > 8)
      ) {
        // text = text
        //   .replaceAll(/[\w]+agsSuper/g, '')
        //   .replaceAll('\n', '')
        //   .replaceAll('</', ' </')
        //   .replaceAll('<br> ', '\n')
        //   .replaceAll(regex, '')
        //   .replaceAll('  ', ' ')
        //   .replaceAll('\n ', '\n')
        //   .replaceAll('\r', '')
        //   .replaceAll(/^\s*/g, '')
        //   .replaceAll('!', '! ')
        //   .replaceAll(' Continuar', '')
        //   .replaceAll(':', ': ');

        let parsed = false;
        for (const prize in AgsPrizes) {
          const value = AgsPrizes[prize as keyof typeof AgsPrizes];

          if (text.includes(value)) {
            text = 'Codigo canjeado, premio: ' + prize;
            parsed = true;
            break;
          }
        }

        if (!parsed) {
          text = '<Premio desconocido (Revisar en la App)>';
        }
      }
    } catch (error) {
      logger.error(
        'parseResponseText',
        'Error al parsear la respuesta:',
        error
      );
    }

    return text;
  }

  private async saveCode(code: string): Promise<void> {
    if (cacheMe.has(code + CachePointers.agsCode)) return;
    cacheMe.set(code + CachePointers.agsCode, code);

    await DatabaseManager.query(`
      CALL create_ags_code ('${code}');`);
  }

  private async saveExchange(
    user_id: string,
    code: string,
    response: IAgsRewardPageResponse | null
  ): Promise<void> {
    const responseText = response === null ? null : JSON.stringify(response);
    await DatabaseManager.query(`
      CALL create_ags_exchange ('${user_id}', '${code}', '${responseText}');`);
  }
}

export default new AgsService();
