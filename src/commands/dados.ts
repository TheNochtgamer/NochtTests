import type { MySlashCommand } from '../types';
import { SlashCommandBuilder } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import utils from '../lib/Utils';

const sleep = setTimeout;

export default {
  data: new SlashCommandBuilder()
    .setName('dados')
    .setDescription('Tira los dados, el que tire el numero mas alto gana'),

  async run(interaction) {
    const FrasesDeVictoria = [
      'Sos un capo sabelo',
      'Se te cayo la corona rey',
      'Quiero se como vos cuando sea humano',
      'Sos un grande pa',
      'VIVA CRISTO REY',
    ];
    const FrasesDeDerrota = [
      'Sos un pete',
      '*Se ahoga con su baba y muere*',
      '*Un pajaro te picotea el pito*',
      'Taradini',
      'Se me acabaron los bardeos',
      '*Se cae a un poso por boludo*',
    ];

    let log = '';
    const Dado1 = Math.floor(Math.random() * 6) + 1; // El Dado de la PC
    const Dado2 = Math.floor(Math.random() * 6) + 1; // El Dado de la PC
    const say = async (str = ''): Promise<void> => {
      log += str + '\n';
      if (!(interaction.replied || interaction.deferred)) {
        await interaction.reply(log);
        return;
      }
      await interaction.editReply(log);
    };

    await say('Tirando los dados.');

    await sleep(500);
    await interaction.editReply(`Tirando los dados..`);
    await sleep(500);
    await interaction.editReply(`Tirando los dados...`);

    await interaction.editReply(
      `El dado de | ${interaction.member?.user?.username} | : ${Dado1}`
    );
    await interaction.editReply(`Mi Turno Bro`);

    await interaction.editReply(`Tirando los dados.`);
    await sleep(500);
    await interaction.editReply(`Tirando los dados..`);
    await sleep(500);
    await interaction.editReply(`Tirando los dados...`);

    await interaction.editReply(`El dado de | CHESTER EL BOT | : ${Dado2}`);

    await interaction.editReply(`Resultados Finales`);

    await sleep(500);

    // RESULTADOS FINALES
    if (Dado1 > Dado2) {
      await interaction.editReply(
        'Ganaste' +
          interaction.member?.user?.username +
          ' ' +
          utils.arrayRandom(FrasesDeVictoria)
      );
      await interaction.editReply(
        'Perdiste' + 'CHESTER EL BOT' + ' ' + utils.arrayRandom(FrasesDeDerrota)
      );
    } else if (Dado1 < Dado2) {
      await interaction.editReply(
        'Perdiste' +
          interaction.member?.user?.username +
          ' ' +
          utils.arrayRandom(FrasesDeDerrota)
      );
      await interaction.editReply(
        'Ganaste' + 'CHESTER EL BOT' + ' ' + utils.arrayRandom(FrasesDeVictoria)
      );
    } else {
      await interaction.editReply(
        'Nose como pero ambos perdieron, y ganaron a la vez, deberian revisar este error los programadores :/'
      );
    }
  },
} satisfies MySlashCommand;
