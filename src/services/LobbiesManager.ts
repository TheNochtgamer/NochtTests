import { type ChatInputCommandInteraction } from 'discord.js';
import Lobby from '../lib/structures/Lobby';
import cacheMe from './cacheMe';

export default class LobbiesManager {
  private static readonly activeLobbies = new Map<string, Lobby>();

  private static makeLobbyId(): string {
    const gen = (): string =>
      (Math.random() + this.activeLobbies.size).toString(36).substring(2, 8);

    let id = gen();
    while (this.activeLobbies.has(id)) {
      id = gen();
    }

    return id;
  }

  private static userIsOnLobby(userId: string): boolean {
    for (const lobby of this.activeLobbies.values()) {
      if (lobby.userIsHere(userId)) return true;
    }

    return false;
  }
  // TODO convertir los reply en una forma mas elegante de ejecutarlos

  public static async handleLobbyCreation(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (this.userIsOnLobby(interaction.user.id)) {
      await interaction.reply({
        content: 'Ya estas en una sala',
        ephemeral: false,
      });
      return;
    }
    await interaction.deferReply({
      ephemeral: false,
    });

    const game = interaction.options.get('game', true).value as string;
    const lobbyId = this.makeLobbyId();
    const lobby = new Lobby(game, lobbyId);

    this.activeLobbies.set(lobbyId, lobby);
    lobby.addUser(interaction);
    // await interaction.reply({
    //   content: `Se ha creado la sala\nInternal ID:${lobbyId}`,
    //   ephemeral: false,
    // });
  }

  public static async handleLobbyJoining(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (this.userIsOnLobby(interaction.user.id)) {
      await interaction.reply({
        content: 'Ya estas en una sala',
        ephemeral: false,
      });
      return;
    }

    const lobbyId = interaction.options.get('lobby', true).value as string;
    const lobby = this.activeLobbies.get(lobbyId);

    if (!lobby) {
      await interaction.reply({
        content: 'No se encontro la sala',
        ephemeral: false,
      });
      return;
    }

    lobby.addUser(interaction);
    await interaction.reply({
      content: `Te has unido a la sala`,
      ephemeral: false,
    });
  }
}
