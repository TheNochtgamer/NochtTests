import type { ColorResolvable } from 'discord.js';

export enum CachePointers {
  rateLimit = '-rateLimit',
  user = '-user',
  guild = '-guild',
  iterationsCacher = '-iterationsCacher',
}

export const Errors = Object.freeze({
  NoDataFound: class extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'noDataFound';
    }
  },
});

export const Embeds = {
  notAuthorised(username?: string) {
    return {
      color: 'Red' as ColorResolvable,
      author: { name: '⛔Prohibido' },
      description:
        '```\n \n' +
        `> ${username}\n` +
        'No tienes permisos para usar este comando.\n \n```',
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
        '.\n \n```',
    };
  },

  error(error: string) {
    return {
      color: 'Red' as ColorResolvable,
      author: { name: '💔Error' },
      description: '```\n \n' + `${error}` + '\n \n```',
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
        '.\n \n```',
    };
  },
};
