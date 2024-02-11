import { type ChatInputCommandInteraction } from 'discord.js';
import Lobby from '../lib/structures/Lobby';
import cacheMe from './cacheMe';

export default class LobbiesManager {
  private static readonly activeLobbies = new Map<string, Lobby>();

  private static makeLobbyId(): string {
    return (Math.random() + this.activeLobbies.size)
      .toString(36)
      .substring(2, 8);
  }

  public static async handleCreateLobby(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const game = interaction.options.get('game')?.value as string;
    const lobbyId = this.makeLobbyId();
    const lobby = new Lobby(game, lobbyId);

    this.activeLobbies.set(lobbyId, lobby);
    await interaction.reply({
      content: `Se ha creado la sala ${lobbyId}`,
      ephemeral: false,
    });
  }

  public static async handleJoinLobby(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const lobbyId = interaction.options.get('lobby')?.value as string;
    const lobby = this.activeLobbies.get(lobbyId);

    if (!lobby) {
      await interaction.reply({
        content: 'No se encontro la sala',
        ephemeral: false,
      });
      return;
    }

    lobby.addUser(interaction.user.id);
    await interaction.reply({
      content: `Te has unido a la sala`,
      ephemeral: false,
    });
  }
}
