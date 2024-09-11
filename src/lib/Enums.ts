import type { ColorResolvable } from 'discord.js';

export enum CachePointers {
  rateLimit = '-rateLimit',
  user = '-user',
  guild = '-guild',
  executionsCacher = '-executionsCacher',
  agsCode = '-agsCode'
}

export enum CacheTts {
  default = 30 * 60 * 1000,
  executionsCacher = 2 * 60 * 1000
}

export const Errors = Object.freeze({
  NoDataFound: class extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'noDataFound';
    }
  }
});

export const Embeds = {
  notAuthorised(username?: string) {
    return {
      color: 'Red' as ColorResolvable,
      author: { name: '⛔Prohibido' },
      description:
        '```\n \n' +
        `> ${username}\n` +
        'No tienes permisos para usar este comando.\n \n```'
    };
  },

  rateLimit(username?: string, timestamp?: number) {
    return {
      color: 'Yellow' as ColorResolvable,
      author: { name: '🖐️Espera' },
      description:
        '```\n \n' +
        (username ? `> ${username}\n` : '') +
        'Superaste el limite de ejecuciones, ' +
        (timestamp
          ? `prueba de nuevo dentro de <R:${timestamp}>`
          : 'prueba de nuevo mas tarde') +
        '.\n \n```'
    };
  },

  error(error: string) {
    return {
      color: 'Red' as ColorResolvable,
      author: { name: '💔Error' },
      description: '```\n \n' + `${error}` + '\n \n```'
    };
  },

  commandDisabled(username?: string, reason?: string) {
    return {
      color: 'Red' as ColorResolvable,
      author: { name: '📛Deshabilitado' },
      description:
        '```\n \n' +
        `> ${username}\n` +
        'Este comando esta deshabilitado' +
        (reason ? ` por la razon:\n${reason}` : '') +
        '.\n \n```'
    };
  }
};

export const AgsPages = Object.freeze({
  reward: 'https://app.argentinagameshow.com/custom/ags/ajax/rew.php',
  login: 'https://app.argentinagameshow.com/ags/ajax/actions_public.php'
});

export const AgsResponseTypes = Object.freeze({
  alreadyExchange: 'Ya canjeaste este código.',
  exchangeSuccess: '¡Canjeaste tu logro ',
  invalidCode: 'El código no es válido.',
  codeLimit: 'Este código llegó a su límite de usos.',
  noSufficientData: 'Es necesario completar tu DNI y',
  toMuchRequests: 'Por favor, probá de<br>',
  toMuchRequestsRegExp: /nuevo en ([0-9]+) minutos/i,
  invalidToken: 'Tenes que estar logeado para poder canjear un código.'
});

export const AgsPrizes = Object.freeze({
  'x1 Reward': '2be52b9b6d6ecc22e495866aa284c7a7.png',
  'x6 Rewards': '69680b87c442703684e1a4b01aa61d1f.png',
  'Pin PS4': '4ed29b5e14f85131bad7caae470c2c10.png',
  'Remera PS4': '67ed9a9c193f57187f1ba9e24f3fef73.png',
  'Latita Speed': 'dbf5604389e5636ad2001849b1648e94.png',
  "Llavero Assasin's Creed": 'e7c22c0b3f1bb068b2559a2bb93ea6cd.png',
  'Entrada Domingo': '879d5be8a6ad0495b02d6ba95b37cf41.png',
  'Entrada Sabado': '05b9fb0efdee532198a7daacaeb9a497.png',
  'Entrada Viernes': '510b621cfdd59eccc50ee6d6231221bc.png',
  'Gamer Pack': '21f0f0511d22fe57b86f6f504fabc985.png'
});
