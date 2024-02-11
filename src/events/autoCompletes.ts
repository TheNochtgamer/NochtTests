import type { MyBotEvent } from '../types';

const _pref = '(autoCompletes())';

export default {
  name: 'interactionCreate',

  async run(interaction) {
    if (!interaction.isAutocomplete()) return;
    const client = interaction.client;
    const command = client.commands.get(interaction.commandName);

    if (interaction.responded || !command?.autoComplete) return;

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
} satisfies MyBotEvent<'interactionCreate'>;
