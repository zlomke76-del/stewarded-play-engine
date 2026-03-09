import type { DungeonRoom } from "@/lib/dungeon/FloorState";

export function resolveRoomImage(room: DungeonRoom | null): string | null {
  if (!room) return null;

  const type = room.roomType;

  switch (type) {
    case "entrance":
      return "/assets/V3/Dungeon/Dungeon_Entrance_Main_01.png";

    case "guard_post":
      return "/assets/V3/Dungeon/Dungeon_Entrance_Guard_Post_01.png";

    case "corridor":
      return "/assets/V3/Dungeon/Dungeon_Entry_01.png";

    default:
      return "/assets/V3/Dungeon/Dungeon_Entry_01.png";
  }
}
