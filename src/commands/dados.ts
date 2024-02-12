import type { MySlashCommand } from '../types';
import { SlashCommandBuilder } from 'discord.js';
import { setTimeout } from 'node:timers/promises';
import utils from '../lib/Utils';

const sleep = setTimeout;

export default {
  data: new SlashCommandBuilder()
    .setName('dados')
    .setDescription('Tira los dados, el que tire el numero mas alto gana')
    .addStringOption(option =>
      option
        .setName('apuesta')
        .setDescription('Apuesta de dinero')
        .setRequired(false)
        .setAutocomplete(true)
    ),

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
    const log: string[] = [];
    const say = async (str = '', replaceLine = -1): Promise<void> => {
      if (replaceLine > -1 && replaceLine < log.length) {
        log[replaceLine] = str;
      } else {
        log.push(str);
      }

      if (!(interaction.replied || interaction.deferred)) {
        await interaction.reply(log.join('\n'));
        return;
      }
      await interaction.editReply(log.join('\n'));
    };

    const Dado1 = Math.floor(Math.random() * 6) + 1; // El Dado del usuario
    const Dado2 = Math.floor(Math.random() * 6) + 1; // El Dado de la PC

    await say('Tirando los dados.');
    await sleep(500);
    await say('Tirando los dados..', 0);
    await sleep(500);
    await say('Tirando los dados...', 0);
    await sleep(500);

    await say(
      `El dado de | ${interaction.member?.user?.username} | : ${Dado1}\nMi Turno Bro`,
      0
    );

    await say('Tirando los dados.', 1);
    await sleep(500);
    await say('Tirando los dados..', 1);
    await sleep(500);
    await say('Tirando los dados...', 1);
    await sleep(500);

    await say(
      `El dado de | CHESTER EL BOT | : ${Dado2}\nResultados Finales`,
      1
    );
    await sleep(500);

    // RESULTADOS FINALES
    if (Dado1 > Dado2) {
      await say(
        'Ganaste' +
          interaction.member?.user?.username +
          ' ' +
          utils.arrayRandom(FrasesDeVictoria)
      );
      await say(
        'Perdiste' + 'CHESTER EL BOT' + ' ' + utils.arrayRandom(FrasesDeDerrota)
      );
    } else if (Dado1 < Dado2) {
      await say(
        'Perdiste' +
          interaction.member?.user?.username +
          ' ' +
          utils.arrayRandom(FrasesDeDerrota)
      );
      await say(
        'Ganaste' + 'CHESTER EL BOT' + ' ' + utils.arrayRandom(FrasesDeVictoria)
      );
    } else {
      await say(
        'Nose como pero ambos perdieron, y ganaron a la vez, deberian revisar este error los programadores :/'
      );
    }
  },
} satisfies MySlashCommand;
