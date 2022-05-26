export class Kudos implements DurableObject {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const query = new URLSearchParams(url.search);

    if (url.pathname === "/kudos") {
      const user = query.get("user");
      if (!user) {
        return new Response("No user provided", { status: 400 });
      }
      const key = `user:${user}:score`;
      const score = (await this.state.storage.get<number>(key)) ?? 0;
      const nextScore = score + 1;
      await this.state.storage.put(key, nextScore);
      return new Response(nextScore.toString());
    }

    return new Response("Not found", { status: 404 });
  }
}
