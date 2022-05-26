import {
  createSlashCommandHandler,
  ApplicationCommand,
  ApplicationCommandOptionType,
  InteractionHandler,
  Interaction,
  InteractionResponse,
  InteractionResponseType,
} from "@code6226/cf-workers-discord-bot";

export { Kudos } from "./Kudos";

const command: ApplicationCommand = {
  name: "kudos",
  description: "Give kudos",
  options: [
    {
      type: ApplicationCommandOptionType.USER,
      name: "user",
      description: "Who are you giving kudos to?",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.STRING,
      name: "reason",
      description: "Why are you giving kudos?",
      required: true,
    },
  ],
};

const commandHandler: (request: Request, env: Env) => InteractionHandler =
  (request, env) =>
  async (interaction: Interaction): Promise<InteractionResponse> => {
    console.log("got interaction", interaction);

    if (interaction.data?.name !== "kudos") {
      console.log("Unexpected interaction", interaction);
      throw new Error("Unexpected interaction");
    }

    const sender = interaction.member.user.id;
    const receiver = interaction.data.options?.find(
      (o) => o.name === "user"
    )?.value;
    const reason = interaction.data.options?.find(
      (o) => o.name === "reason"
    )?.value;

    if (!receiver) {
      throw new Error("No user specified to receive kudos");
    }
    if (!reason) {
      throw new Error("No reason specified for kudos");
    }

    const id = env.kudos.idFromName(interaction.guild_id);
    const obj = env.kudos.get(id);

    const url = new URL(request.url);
    url.pathname = "/kudos";
    url.search = new URLSearchParams({ user: receiver }).toString();
    const resp = await obj.fetch(url.toString());
    const score = await resp.text();

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `Kudos to <@${receiver}> 🙏 (${score} total)\n> ${reason}`,
        allowed_mentions: {
          users: [receiver],
        },
      },
    };
  };

export default {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext
  ): Promise<Response> {
    const slashCommandHandler = createSlashCommandHandler({
      applicationID: env.DISCORD_CLIENT_ID,
      applicationSecret: env.DISCORD_CLIENT_SECRET,
      publicKey: env.DISCORD_PUBLIC_KEY,
      commands: [[command, commandHandler(request, env)]],
    });
    return await slashCommandHandler(request);
  },
};
