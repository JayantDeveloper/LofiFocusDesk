import { Text } from "@react-three/drei";
import { DESK_TOP_Y } from "./constants";

export function DeskPaperSignature() {
  const signatureText = "Made by\nJayant Maheshwari";

  return (
    <group position={[0.54, DESK_TOP_Y + 0.04, 0.16]} rotation={[0, -0.1, 0]}>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#252525"
        fontSize={0.029}
        lineHeight={0.98}
        maxWidth={0.32}
        position={[0.004, -0.0014, 0.003]}
        rotation={[-Math.PI / 2, 0, 0]}
        textAlign="center"
      >
        {signatureText}
      </Text>

      <Text
        anchorX="center"
        anchorY="middle"
        color="#000000"
        fontSize={0.029}
        lineHeight={0.98}
        maxWidth={0.32}
        outlineColor="#000000"
        outlineWidth={0.0018}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        textAlign="center"
      >
        {signatureText}
      </Text>
    </group>
  );
}
