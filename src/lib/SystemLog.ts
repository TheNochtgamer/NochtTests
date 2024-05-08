const _log = console.log;
const _warn = console.warn;
const _error = console.error;

/**
 * Transforma el console.log para que muestre la fecha y hora del log
 */
const loggingDecorators = (): void => {
  const now = (): string =>
    `[${new Date()
      .toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      .replace(/\/[0-9]+,/, '')
      .replace(/[0-9]+(\/| )/g, match => match.padStart(3, '0'))}]`;

  console.log = (...data: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    _log(now(), ...data);
  };
  console.warn = (...data: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    _warn(now(), ...data);
  };
  console.error = (...data: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    _error(now(), ...data);
  };
};
loggingDecorators();
