import { Interaction, InteractionTypes, UserToggles } from "discord";

export function buildMockInteraction(data: Interaction["data"]): Interaction {
  return {
    id: BigInt(1),
    applicationId: BigInt(1),
    token: "1",
    type: InteractionTypes.ApplicationCommand,
    user: {
      id: BigInt(1),
      username: "TestUser",
      discriminator: "#123456",
      toggles: new UserToggles({
        id: "1",
        avatar: "1",
        discriminator: "#123456",
        username: "TestUser",
      }),
    },
    version: 1,
    data,
  };
}
