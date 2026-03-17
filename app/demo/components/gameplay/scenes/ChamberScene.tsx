"use client";

import RoomTopologyPanel from "../../RoomTopologyPanel";
import SceneFrame, { SceneAdvanceBar } from "../ViewportSceneFrame";
import { anchorId } from "../../../demoUtils";

type Props = {
  demo: any;
  hasPuzzleRoom: boolean;
  onAdvanceToPuzzleOrAction: () => void;
};

export default function ChamberScene({
  demo,
  hasPuzzleRoom,
  onAdvanceToPuzzleOrAction,
}: Props) {
  return (
    <div id={anchorId("map")} style={{ scrollMarginTop: 90 }}>
      <SceneFrame
        eyebrow="Current Chamber"
        title={demo.currentRoomTitle ?? "The Descent"}
        description={
          hasPuzzleRoom
            ? "See the chamber, choose the route that matters, then confront the room’s immediate trial."
            : "See the chamber, choose the route that matters, then issue a decisive command."
        }
        footer={
          <SceneAdvanceBar
            label={hasPuzzleRoom ? "Continue to Trial" : "Continue to Command"}
            hint={
              hasPuzzleRoom
                ? "The chamber is understood. The room’s obstacle comes next."
                : "The chamber is understood. The next decisive act belongs to the hero."
            }
            onClick={onAdvanceToPuzzleOrAction}
          />
        }
      >
        {demo.gameplayAllowsMap ? (
          <RoomTopologyPanel
            currentRoomVisualKey={demo.currentRoomVisualKey}
            currentRoomTitle={demo.currentRoomTitle}
            roomImage={demo.roomImage}
            roomNarrative={demo.roomNarrative}
            roomFeatureNarrative={demo.roomFeatureNarrative}
            roomExitNarrative={demo.roomExitNarrative}
            roomConnectionsView={demo.roomConnectionsView}
            currentFeatures={demo.currentFeatures}
            selectedRouteId={demo.selectedTraversalTargetId}
            onSelectRoute={demo.setSelectedTraversalTargetId}
          />
        ) : null}
      </SceneFrame>
    </div>
  );
}
