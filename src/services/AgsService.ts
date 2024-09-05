import type { IAgsRewardPageResponse } from '@/types';
import { AgsPages, ResponseTypes } from '@/lib/Enums';
import AgsUserData from '@/lib/structures/AGS/AgsUserData';
import axios from 'axios';
import SystemLog from '@/lib/structures/SystemLog';
import Utils from '@/lib/Utils';

const logger = new SystemLog('services', 'AgsCodesService');

class AgsCodesService {
  private async fetchReward(
    token: string,
    code?: string
  ): Promise<IAgsRewardPageResponse> {
    const { data } = await axios.get<IAgsRewardPageResponse>(AgsPages.reward, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'sec-ch-ua':
          '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        Referer: 'https://app.argentinagameshow.com/reward',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        Cookie: `PHPSESSID=${token}`,
      },
      params: code
        ? {
            action: 'code',
            code,
          }
        : null,
    });

    return data;
  }

  public async loadCodeForOne(
    user: AgsUserData,
    code: string
  ): Promise<IAgsRewardPageResponse | null> {
    let tries = 0;
    while (tries < 3) {
      try {
        return await this.fetchReward(user.token, code);
      } catch (error) {
        logger.error(
          'loadOneCode',
          `user_${user.user_id} > No se obtuvo respuesta de la pagina:`,
          error
        );
        tries++;
        if (tries < 3) await Utils.getRandomSleep(2000, 7000);
      }
    }

    logger.error(
      'loadOneCode',
      `user_${user.user_id} > Demasiados intentos fallidos`
    );
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
    const firstUser = Utils.arrayRandom(users);

    if (!force && firstUser) {
      const firstResponse = await this.loadCodeForOne(firstUser, code);

      responses.push(firstResponse);
      if (cb) void cb(firstUser, firstResponse);

      if (
        !firstResponse ||
        // (firstResponse.text.includes(ResponseTypes.invalidCode) &&
        //   firstResponse.text.includes(ResponseTypes.alreadyExchange))
        (Utils.compareTwoStrings(
          firstResponse.text || '',
          ResponseTypes.invalidCode
        ) >= 90 &&
          Utils.compareTwoStrings(
            firstResponse.text || '',
            ResponseTypes.alreadyExchange
          ) >= 90)
      ) {
        logger.log(
          'loadCodeForAll',
          'Abortando... Codigo invalido o ya canjeado...'
        );
        return responses;
      }
    }

    const promises = users.map(async user => {
      if (!force && firstUser?.user_id === user.user_id) return;
      const response = await this.loadCodeForOne(user, code);
      responses.push(response);
      if (cb) void cb(user, response);
    });

    await Promise.all(promises);

    return responses;
  }
}

export default new AgsCodesService();
