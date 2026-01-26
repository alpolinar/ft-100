import { GameContainer } from "../../../game/container/game-container";

export default async function GamePage(props: PageProps<"/game/[gameId]">) {
  const { gameId } = await props.params;

  return (
    <div>
      <GameContainer gameId={gameId} />
    </div>
  );
}
