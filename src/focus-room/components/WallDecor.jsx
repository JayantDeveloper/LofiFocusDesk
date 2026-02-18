import { BoardCss3DObject } from "./Css3DLayer";

const RIGHT_BOOKCASE_X = 0.9;
const SHELF_LEVELS = [0.42, 0.72, 1.02, 1.32, 1.62, 1.92];
const BOOK_X_SLOTS = [-0.49, -0.38, -0.27, -0.16, -0.05, 0.06, 0.17, 0.28, 0.39, 0.49];
const BULLETIN_BOARD_APP_HTML_WIDTH = 728;
const BULLETIN_BOARD_APP_HTML_HEIGHT = 404;
const BULLETIN_BOARD_APP_LOCAL_WIDTH = 1.82;
const BULLETIN_BOARD_APP_LOCAL_HEIGHT =
  (BULLETIN_BOARD_APP_LOCAL_WIDTH * BULLETIN_BOARD_APP_HTML_HEIGHT) / BULLETIN_BOARD_APP_HTML_WIDTH;
const BULLETIN_BOARD_APP_POSITION = [0, 0, 0.055];
const BOOK_COLORS = [
  "#8f4a3e",
  "#3f6d8a",
  "#668a49",
  "#9d7a4b",
  "#6b4f8f",
  "#2f7a6f",
  "#a24f5b",
  "#5d6ca2",
  "#96763f",
  "#4b8857",
  "#7d4c84",
  "#476892",
  "#9f6a4f",
  "#5f874d",
  "#7d4f63",
  "#3f7f8d",
];
const LEFT_WALL_CALENDAR_X = -3.885;
const CALENDAR_CENTER_Y = 2.2;
const CALENDAR_CENTER_Z = -2.55;
const CALENDAR_WIDTH = 0.56;
const CALENDAR_HEIGHT = 0.42;
const CALENDAR_PAGE_WIDTH = 0.48;
const CALENDAR_PAGE_HEIGHT = 0.2;
const CALENDAR_GRID_COLUMNS = 7;
const CALENDAR_GRID_ROWS = 5;
const CALENDAR_PHOTO_1_Z = CALENDAR_CENTER_Z - 0.42;
const CALENDAR_PHOTO_2_Z = CALENDAR_CENTER_Z + 0.34;
const CALENDAR_ASSEMBLY_Y_OFFSET = -0.08;

const BOOKS = SHELF_LEVELS.flatMap((shelf, shelfIndex) =>
  BOOK_X_SLOTS.map((x, slotIndex) => {
    const pattern = shelfIndex * 4 + slotIndex;
    return {
      color: BOOK_COLORS[(shelfIndex * 3 + slotIndex) % BOOK_COLORS.length],
      depth: 0.14 + ((pattern + 2) % 4) * 0.015,
      height: 0.18 + ((pattern + 1) % 6) * 0.015,
      shelf,
      tilt: slotIndex % 5 === 0 ? -0.04 : slotIndex % 4 === 0 ? 0.035 : 0,
      width: 0.065 + (pattern % 3) * 0.012,
      x,
    };
  }),
);

function Shelf({ textures }) {
  return (
    <group position={[RIGHT_BOOKCASE_X, 0, -3.22]}>
      <mesh castShadow receiveShadow position={[0, 1.1, -0.11]}>
        <boxGeometry args={[1.12, 2.2, 0.05]} />
        <meshStandardMaterial color="#6f4d37" map={textures.wood} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.56, 1.1, 0]}>
        <boxGeometry args={[0.08, 2.2, 0.34]} />
        <meshStandardMaterial color="#6f4d37" map={textures.wood} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.56, 1.1, 0]}>
        <boxGeometry args={[0.08, 2.2, 0.34]} />
        <meshStandardMaterial color="#6f4d37" map={textures.wood} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 2.18, 0]}>
        <boxGeometry args={[1.12, 0.08, 0.34]} />
        <meshStandardMaterial color="#6f4d37" map={textures.wood} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[1.12, 0.08, 0.34]} />
        <meshStandardMaterial color="#6f4d37" map={textures.wood} roughness={0.72} />
      </mesh>

      {SHELF_LEVELS.map((shelfY) => (
        <mesh key={`shelf-${shelfY}`} castShadow receiveShadow position={[0, shelfY, 0.01]}>
          <boxGeometry args={[1.04, 0.05, 0.28]} />
          <meshStandardMaterial color="#7f5a3f" map={textures.wood} roughness={0.68} />
        </mesh>
      ))}

      {BOOKS.map((book) => (
        <mesh
          key={`${book.shelf}-${book.x}-${book.height}`}
          castShadow
          receiveShadow
          position={[book.x, book.shelf + 0.03 + book.height * 0.5, 0.03]}
          rotation={[0, 0, book.tilt ?? 0]}
        >
          <boxGeometry args={[book.width, book.height, book.depth]} />
          <meshStandardMaterial color={book.color} roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function CalendarAndPhotos() {
  const verticalLineOffsets = Array.from({ length: CALENDAR_GRID_COLUMNS - 1 }, (_, index) => {
    return (
      -CALENDAR_PAGE_WIDTH * 0.5 +
      ((index + 1) * CALENDAR_PAGE_WIDTH) / CALENDAR_GRID_COLUMNS
    );
  });
  const horizontalLineOffsets = Array.from({ length: CALENDAR_GRID_ROWS - 1 }, (_, index) => {
    return (
      CALENDAR_PAGE_HEIGHT * 0.5 -
      ((index + 1) * CALENDAR_PAGE_HEIGHT) / CALENDAR_GRID_ROWS
    );
  });

  return (
    <group position={[0, CALENDAR_ASSEMBLY_Y_OFFSET, 0]}>
      <mesh
        name="wall-calendar-hitbox"
        castShadow
        receiveShadow
        position={[LEFT_WALL_CALENDAR_X, CALENDAR_CENTER_Y, CALENDAR_CENTER_Z]}
      >
        <boxGeometry args={[0.03, CALENDAR_HEIGHT, CALENDAR_WIDTH]} />
        <meshStandardMaterial color="#f0ebe2" roughness={0.9} />
      </mesh>

      <mesh castShadow receiveShadow position={[LEFT_WALL_CALENDAR_X + 0.012, CALENDAR_CENTER_Y + 0.16, CALENDAR_CENTER_Z]}>
        <boxGeometry args={[0.01, 0.08, CALENDAR_WIDTH]} />
        <meshStandardMaterial color="#c45549" roughness={0.82} />
      </mesh>

      <group position={[LEFT_WALL_CALENDAR_X + 0.018, CALENDAR_CENTER_Y - 0.04, CALENDAR_CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[CALENDAR_PAGE_WIDTH, CALENDAR_PAGE_HEIGHT]} />
          <meshStandardMaterial color="#f3f1ea" roughness={0.95} />
        </mesh>

        {verticalLineOffsets.map((offset, index) => (
          <mesh key={`calendar-v-${index}`} position={[offset, 0, 0.0015]}>
            <planeGeometry args={[0.004, CALENDAR_PAGE_HEIGHT]} />
            <meshStandardMaterial color="#b8b7b3" roughness={0.9} />
          </mesh>
        ))}

        {horizontalLineOffsets.map((offset, index) => (
          <mesh key={`calendar-h-${index}`} position={[0, offset, 0.0015]}>
            <planeGeometry args={[CALENDAR_PAGE_WIDTH, 0.004]} />
            <meshStandardMaterial color="#b8b7b3" roughness={0.9} />
          </mesh>
        ))}
      </group>

      <mesh position={[LEFT_WALL_CALENDAR_X + 0.006, CALENDAR_CENTER_Y - 0.03, CALENDAR_CENTER_Z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[CALENDAR_PAGE_WIDTH, CALENDAR_PAGE_HEIGHT]} />
        <meshStandardMaterial color="#d8d7d4" roughness={0.96} />
      </mesh>

      <mesh castShadow receiveShadow position={[LEFT_WALL_CALENDAR_X, 1.94, CALENDAR_PHOTO_1_Z]}>
        <boxGeometry args={[0.04, 0.25, 0.34]} />
        <meshStandardMaterial color="#53372d" roughness={0.7} />
      </mesh>

      <mesh
        position={[LEFT_WALL_CALENDAR_X + 0.022, 1.94, CALENDAR_PHOTO_1_Z]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[0.26, 0.17]} />
        <meshStandardMaterial color="#9bb9c7" roughness={0.88} />
      </mesh>

      <mesh castShadow receiveShadow position={[LEFT_WALL_CALENDAR_X, 1.83, CALENDAR_PHOTO_2_Z]}>
        <boxGeometry args={[0.04, 0.25, 0.34]} />
        <meshStandardMaterial color="#53372d" roughness={0.7} />
      </mesh>

      <mesh
        position={[LEFT_WALL_CALENDAR_X + 0.022, 1.83, CALENDAR_PHOTO_2_Z]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[0.26, 0.17]} />
        <meshStandardMaterial color="#b0c59a" roughness={0.88} />
      </mesh>
    </group>
  );
}

function TodoBoardPlaceholder({ boardPomodoro, boardTodo, onOpenBoardPopup, textures }) {
  return (
    <group name="todo-app-placeholder" position={[0.18, 1.95, -3.47]} scale={[1.3, 1.3, 1.3]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.95, 1.14, 0.04]} />
        <meshStandardMaterial color="#b88959" map={textures.cork} roughness={0.94} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0, 0.02]}>
        <boxGeometry args={[1.82, 1.01, 0.01]} />
        <meshStandardMaterial
          color="#d6c7a8"
          roughness={0.93}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.58, -0.02]}>
        <boxGeometry args={[2.07, 0.1, 0.07]} />
        <meshStandardMaterial color="#6f4d38" map={textures.wood} roughness={0.7} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -0.58, -0.02]}>
        <boxGeometry args={[2.07, 0.1, 0.07]} />
        <meshStandardMaterial color="#6f4d38" map={textures.wood} roughness={0.7} />
      </mesh>

      <mesh castShadow receiveShadow position={[-1.04, 0, -0.02]}>
        <boxGeometry args={[0.1, 1.14, 0.07]} />
        <meshStandardMaterial color="#6f4d38" map={textures.wood} roughness={0.7} />
      </mesh>

      <mesh castShadow receiveShadow position={[1.04, 0, -0.02]}>
        <boxGeometry args={[0.1, 1.14, 0.07]} />
        <meshStandardMaterial color="#6f4d38" map={textures.wood} roughness={0.7} />
      </mesh>

      <BoardCss3DObject
        boardPomodoro={boardPomodoro}
        boardTodo={boardTodo}
        className="focus-board-screen-shell bulletin-board-screen focus-board-preview-screen"
        heightPx={BULLETIN_BOARD_APP_HTML_HEIGHT}
        onOpen={onOpenBoardPopup}
        position={BULLETIN_BOARD_APP_POSITION}
        worldHeight={BULLETIN_BOARD_APP_LOCAL_HEIGHT}
        worldWidth={BULLETIN_BOARD_APP_LOCAL_WIDTH}
        widthPx={BULLETIN_BOARD_APP_HTML_WIDTH}
      />
    </group>
  );
}

export function WallDecor({ boardPomodoro, boardTodo, onOpenBoardPopup, textures }) {
  return (
    <group>
      <group position={[-2.23, -0.16, 0]}>
        <TodoBoardPlaceholder
          boardPomodoro={boardPomodoro}
          boardTodo={boardTodo}
          onOpenBoardPopup={onOpenBoardPopup}
          textures={textures}
        />
      </group>
      <CalendarAndPhotos />
      <Shelf textures={textures} />
    </group>
  );
}
