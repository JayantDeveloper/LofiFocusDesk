import { DeskFrame } from "./desk-assets/DeskFrame";
import { DeskLamp } from "./desk-assets/DeskLamp";
import { DeskRadio } from "./desk-assets/DeskRadio";
import { AlarmClock } from "./desk-assets/AlarmClock";
import { DESK_TOP_Y } from "./desk-assets/constants";
import { Notebook } from "./desk-assets/Notebook";
import { PenCup } from "./desk-assets/PenCup";
import { Plant } from "./desk-assets/Plant";
import { StickyNoteStack } from "./desk-assets/StickyNoteStack";

export function DeskSetup({
  clockAmpm,
  clockTime,
  isRadioOn,
  worldHourRef,
}) {
  return (
    <group position={[-2.05, 0, -2.1]}>
      <DeskFrame />
      <Notebook />
      <Plant />
      <DeskRadio isOn={isRadioOn} />
      <PenCup />
      <DeskLamp worldHourRef={worldHourRef} />
      <AlarmClock ampm={clockAmpm} time={clockTime} />
      <StickyNoteStack position={[-0.62, DESK_TOP_Y + 0.04, -0.36]} rotation={[0, 0.24, 0]} />

      <mesh receiveShadow position={[-0.02, 0.02, -0.02]}>
        <boxGeometry args={[2.4, 0.02, 1.2]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
    </group>
  );
}
