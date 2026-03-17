"use client";

import GameplayCombatPanel from "../../GameplayCombatPanel";
import { anchorId } from "../../demoUtils";
import SceneFrame, { StageTabs } from "../ViewportSceneFrame";

type Props = {
  demo: any;
  hasPuzzleRoom: boolean;
  onSelectPressure: () => void;
  onSelectChamber: () => void;
  onSelectPuzzle: () => void;
  onSelectAction: () => void;
};

export default function CombatScenePanel({
  demo,
  hasPuzzleRoom,
  onSelectPressure,
  onSelectChamber,
  onSelectPuzzle,
  onSelectAction,
}: Props) {
  return (
    <div
      id={anchorId("combat")}
      style={{
        scrollMarginTop: 90,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: "fit-content",
        overflow: "visible",
        alignSelf: "start",
      }}
    >
      <SceneFrame
        eyebrow="Combat"
        title="Battle Intent"
        description="The battlefield and the command surface now live inside one combat shell. Read the clash, issue the move, and resolve the next decisive action."
        headerExtra={
          <StageTabs
            activeScene="combat"
            hasPuzzleRoom={hasPuzzleRoom}
            onSelectPressure={onSelectPressure}
            onSelectChamber={onSelectChamber}
            onSelectPuzzle={onSelectPuzzle}
            onSelectAction={onSelectAction}
          />
        }
      >
        <div
          style={{
            display: "grid",
            gap: 0,
            borderRadius: 22,
            border: "1px solid rgba(214,188,120,0.14)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
            boxShadow:
              "0 18px 44px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
            overflow: "visible",
            minHeight: "fit-content",
          }}
        >
          <GameplayCombatPanel demo={demo} />
        </div>
      </SceneFrame>
    </div>
  );
}
