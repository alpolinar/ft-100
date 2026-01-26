import { Game } from "../../components/game/game";

export default async function GamePage(props: PageProps<"/game/[gameId]">) {
  const { gameId } = await props.params;

  return (
    <div>
      <Game gameId={gameId} />
    </div>
  );
}
