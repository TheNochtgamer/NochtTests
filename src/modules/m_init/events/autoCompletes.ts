import type { IMyBotEvent } from '@/types';
import Utils from '@/lib/Utils';
import SystemLog from '@/lib/structures/SystemLog';

const logger = new SystemLog('modules', 'init', 'events', 'autoCompletes');

// EVENTO PARA CUANDO SE EJECUTA UN AUTOCOMPLETE
export default {
  name: 'interactionCreate',

  async run(interaction) {
    if (!interaction.isAutocomplete()) return;
    const client = interaction.client;
    const command = client.commands.get(interaction.commandName);

    // TODO Añadir que revise los permisos del usuario

    if (interaction.responded) return;
    if (!command?.autoComplete) {
      if (Utils.everyXExecutions('autoCompleteSpam', 3))
        logger.warn(
          `Se intento utilizar el autoComplete del comando ${interaction.commandName} pero no se detecto`
        );
      return;
    }

    try {
      const res = await command.autoComplete(interaction);

      await interaction.respond(res);
    } catch (error) {
      logger.error(
        'run',
        `Ocurrio un error al intentar autoCompletar el comando ${interaction.commandName}:`,
        error
      );
    }
  },
} satisfies IMyBotEvent<'interactionCreate'>;
