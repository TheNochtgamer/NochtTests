import type { IMyBotEvent } from '../types';
import Utils from '../lib/Utils';

const _pref = '(autoCompletes())';

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
      console.log(_pref, 'executed');
      if (Utils.everyXExecutions('autoCompleteSpam', 3))
        console.log(
          _pref,
          `Se intento utilizar el autoComplete del comando ${interaction.commandName} pero no se detecto`
        );
      return;
    }

    try {
      const res = await command.autoComplete(interaction);

      await interaction.respond(res);
    } catch (error) {
      console.log(
        _pref,
        `Ocurrio un error al intentar autoCompletar el comando ${interaction.commandName}:`,
        error
      );
    }
  },
} satisfies IMyBotEvent<'interactionCreate'>;
