/* eslint-disable @typescript-eslint/naming-convention */
import type { IAgsRewardPageResponse, AgsUserData, Bot } from '@/types';
import {
  AgsPages,
  CachePointers,
  AgsResponseTypes,
  AgsPrizes
} from '@/lib/Enums';
import axios, { Axios, AxiosError } from 'axios';
import SystemLog from '@/lib/structures/SystemLog';
import Utils from '@/lib/Utils';
import DatabaseManager from './DatabaseManager';
import cacheMe from './cacheMe';
import {
  DMChannel,
  EmbedBuilder,
  NewsChannel,
  PartialDMChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  StageChannel,
  TextBasedChannel,
  TextChannel,
  VoiceChannel
} from 'discord.js';
import AgsUsersManager from './AgsUsersManager';

const logger = new SystemLog('services', 'AgsService');

// <Hardcoded configs>
const publicCodesChannelId = '1119392838862503976';
// </Hardcoded configs>

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

  public matchCode(message: string): string | null {
    const matches = message.match(/\b[A-Za-z0-9!#$%^&*()-_]{5,}\b/);

    if (!matches) return null;
    const [match] = matches;

    if (!/[A-Za-z]/.test(match) || !/[0-9]/.test(match) || !/(!|-)/.test(match))
      return null;

    return match;
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

  /**
   * Envia un codigo para que el servicio se encargue de canjearlo y enviar el resultado
   */
  public async sendCode({
    code,
    force = false,
    hideUntilWorks = false
  }: {
    code: string;
    force?: boolean;
    hideUntilWorks?: boolean;
  }): Promise<0 | 1 | 2> {
    const resultsEmbed = new EmbedBuilder()
      .setTitle(`Cargando codigo...${force ? ' (Forzado)' : ''}`)
      .setAuthor({ name: code })
      .setFooter({ text: 'NochtTests' })
      .setColor('DarkRed')
      .setTimestamp();

    const formatThis = (
      agsUserData: AgsUserData,
      response: IAgsRewardPageResponse | null
    ) => `- ${agsUserData.me()} ⇢ ${this.parseResponseText(response)}`;

    let codesChannel: TextBasedChannel | undefined;
    try {
      const fetchedChannel = await this.bot?.channels.fetch(
        publicCodesChannelId
      );

      if (fetchedChannel?.isTextBased()) {
        codesChannel = fetchedChannel;
      } else {
        throw new Error('Invalid channel type');
      }
    } catch (error) {
      logger.error(
        'sendCode',
        'Can not get publicCodesChannelId channel, is config invalid?:',
        error
      );
    }

    const allUsersData = await AgsUsersManager.getUsersTokens();
    const allResults: string[] = [];

    if (!allUsersData || allUsersData.length === 0) {
      return 1;
    }

    let resultsMessage = hideUntilWorks
      ? undefined
      : await codesChannel?.send({
          embeds: [resultsEmbed]
        });

    async function updateEmbed(isEnd = false): Promise<void> {
      if (!resultsMessage) return;

      try {
        const theResult = allResults.join('\n');
        resultsEmbed.setDescription(
          theResult.slice(0, 4090) + (theResult.length > 4090 ? '...' : '')
        );

        if (isEnd) {
          resultsEmbed.setTitle(
            `Codigo cargado correctamente${force ? ' (Forzado)' : ''}`
          );
          resultsEmbed.setColor('Green');
        }
        await resultsMessage.edit({
          embeds: [resultsEmbed]
        });
      } catch (error) {
        logger.error('sendCode', 'Error al editar el mensaje', error);
      }
    }

    const updateEmbedInterval = setInterval(updateEmbed, 3000);

    logger.log(
      'sendCode',
      `Cargando codigo "${code}" para todos los usuarios ${
        force ? '(Forzado)' : ''
      }`
    );

    await this.redeemCodeForUsers(
      allUsersData,
      code,
      force,
      async (agsUserData, response, aborted): Promise<void> => {
        if (!aborted && hideUntilWorks) {
          resultsMessage = await codesChannel?.send({
            embeds: [resultsEmbed]
          });
        }

        allResults.push(formatThis(agsUserData, response));
      }
    );

    await Utils.getRandomSleep(2000);
    clearInterval(updateEmbedInterval);
    await Utils.getRandomSleep(3000);

    await updateEmbed(true);

    return 0;
  }

  public async redeemCodeForOne(
    user: AgsUserData,
    code: string
  ): Promise<IAgsRewardPageResponse | null> {
    void this.saveCode(code);
    let tries = 0;

    const maxTries = () => Math.floor(5 + user.priority * 0.5);
    const retryTime = () => 13 * 1000;

    while (tries < maxTries()) {
      try {
        const { data } = await this.fetchReward(user.token, code);

        logger.log(
          'loadOneCode',
          `user_${user.user_id}:${
            user.ds_id ?? user.reference
          } >\n${JSON.stringify(data, null, 2)}`
        );

        void this.saveExchange(user.user_id, code, data);
        return data;
      } catch (error) {
        if (
          error instanceof AxiosError &&
          (error.code === AxiosError.ETIMEDOUT ||
            error.code === AxiosError.ECONNABORTED)
        ) {
          logger.error(
            'loadOneCode',
            `user_${user.user_id} > No se obtuvo respuesta de la pagina`
          );
        } else {
          logger.error(
            'loadOneCode',
            `user_${user.user_id} > Hubo un error al intentar canjear un codigo:`,
            error
          );
        }
        tries++;
        if (tries < maxTries())
          await Utils.getRandomSleep(retryTime(), retryTime() + 1000);
      }
    }

    logger.error(
      'loadOneCode',
      `user_${user.user_id} > Demasiados intentos fallidos`
    );

    void this.saveExchange(user.user_id, code, null);
    return null;
  }

  public async redeemCodeForUsers(
    users: AgsUserData[],
    code: string,
    force: boolean = false,
    cb?: (
      user: AgsUserData,
      response: IAgsRewardPageResponse | null,
      aborted: boolean
    ) => void | Promise<void>
  ): Promise<Array<IAgsRewardPageResponse | null>> {
    const responses: Array<IAgsRewardPageResponse | null> = [];
    const firstUser = Utils.arrayRandom(users.filter(u => u.ds_id));

    if (!force && firstUser) {
      const firstResponse = await this.redeemCodeForOne(firstUser, code);

      responses.push(firstResponse);

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
        if (cb) void cb(firstUser, firstResponse, true);
        return responses;
      }

      if (
        Utils.compareTwoStrings(
          firstResponse.text || '',
          AgsResponseTypes.invalidCode
        ) >= 90
      ) {
        logger.log('loadCodeForAll', 'Abortando... Codigo invalido...');
        if (cb) void cb(firstUser, firstResponse, true);
        return responses;
      }

      if (
        Utils.compareTwoStrings(
          firstResponse.text || '',
          AgsResponseTypes.noCodeAvaliable
        ) >= 90
      ) {
        logger.log('loadCodeForAll', 'Abortando... Pagina caida...');
        if (cb) void cb(firstUser, firstResponse, true);
        return responses;
      }
      if (cb) void cb(firstUser, firstResponse, false);
    }

    const promises = users
      .filter(user => force || firstUser?.user_id !== user.user_id)
      .sort((a, b) => b.priority - a.priority)
      .map(async user => {
        const response = await this.redeemCodeForOne(user, code);
        if (user.hidden) return;
        responses.push(response);
        if (cb) void cb(user, response, false);
      });

    await Promise.all(promises);

    return responses;
  }

  public parseResponseText(response: IAgsRewardPageResponse | null): string {
    if (!response?.text) return '<La pagina no dio respuesta>';
    let text = response.text || '';
    // const regex = /([<][a-z][^<]*>)|([<][/][a-z]*>)/g;

    // @ts-ignore
    if (response.extra2 == 88) {
      text = 'YA PUEDES CANJEAR ENTRADA';
      return text;
    }

    if (Utils.compareTwoStrings(text, AgsResponseTypes.noCodeAvaliable) >= 90) {
      text = '<La pagina está apagada>';
    }

    try {
      if (typeof response.code === 'string' && response.code.length > 8) {
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
