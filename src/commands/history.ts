import { Message, MessageEmbed } from 'discord.js';

import { HistoryEntity } from '../entities/History';
import { database } from '../index';
import { Command } from '../utils/commandHandler';
import { resolveMemberWithNameSpaces } from '../utils/resolvers';

export const command = new Command({
    aliases: ['history', 'his'],
    description: 'Gets the reputation history',
    command: async (message: Message): Promise<Message> => {
        let member = message.mentions.members!.first() ? message.mentions.members!.first() : undefined;
        member = !member ? await resolveMemberWithNameSpaces(message) : member; // eslint-disable-line require-atomic-updates
        member = !member ? message.member! : member; // eslint-disable-line require-atomic-updates

        const repository = database.getRepository(HistoryEntity);

        const found = await repository
            .createQueryBuilder('history')
            .where(`history.from = :id`, { id: member.id })
            .orWhere(`history.to = :id`, { id: member.id })
            .orderBy('date', 'DESC')
            .getMany();

        let content = found.length == 0 ? `${member.user.username} has no history` : '';

        found.forEach((history: HistoryEntity) => {
            if (history.from == member!.id) {
                content += `:white_small_square: Gave 1 rep to **<@${history.to}>**`;
            } else {
                content += `:white_small_square: Got 1 rep from **<@${history.from}>**`;
            }

            const date = new Date(history.date);

            content += ` [[Scroll]](${history.messageLink}) \`(${date.getUTCDate()}/${date.getMonth()}/${date
                .getFullYear()
                .toString()
                .replace('20', '')} - ${date.getHours()}:${date.getMinutes()})\`\n`;
        });

        const avatar = member.user.avatarURL() == null ? undefined : member.user.avatarURL()!;

        return message.channel.send(
            new MessageEmbed()
                .setAuthor(member.user.tag, avatar)
                .setColor(`#3178C6`)
                .setDescription(content),
        );
    },
});
