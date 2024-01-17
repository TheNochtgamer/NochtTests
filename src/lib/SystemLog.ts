const log = console.log;

/**
 * Transforma el console.log para que muestre la fecha y hora del log
 */
const configureLog = (): void => {
  console.log = (...args: any[]) => {
    const now = `[${new Date()
      .toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      .replace(/\/[0-9]+,/, '')}]`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    log(now, ...args);
  };
};

export default configureLog;
