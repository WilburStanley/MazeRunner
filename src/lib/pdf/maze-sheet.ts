import { LineCapStyle, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import { describeSpec } from "@/lib/maze/describe";
import { getEndPosition, getStartPosition, type Maze, type Position } from "@/lib/maze/grid";
import { encodeId, type MazeSpec } from "@/lib/maze/id";
import { findShortestPath } from "@/lib/maze/solve";
import type { ChallengeContent } from "./challenge-options";
import { buildRoutePath, buildWallsPath } from "./maze-paths";
import {
  PAGE_HEIGHT_POINTS,
  PAGE_MARGIN_POINTS,
  PAGE_WIDTH_POINTS,
  cellCenterPoint,
  computeSheetLayout,
  type SheetLayout,
} from "./sheet-layout";

const INK = rgb(0.06, 0.06, 0.07);
const MUTED = rgb(0.42, 0.42, 0.45);
const ROUTE = rgb(0.9, 0.52, 0);

// A fixed date keeps the bytes identical for the same input, which is what makes the
// "cache this forever" header on the PDF routes honest.
const FIXED_DATE = new Date(Date.UTC(2026, 0, 1));

const CONTENT_WIDTH_POINTS = PAGE_WIDTH_POINTS - PAGE_MARGIN_POINTS * 2;
const HEADLINE_MAX_SIZE = 26;
const HEADER_BASE_HEIGHT = 58;
const HEADER_STATS_HEIGHT = 58;
const FOOTER_BASE_HEIGHT = 66;
const FOOTER_LINK_HEIGHT = 16;
const BLANK_FOOTER_HEIGHT = 30;

const START_DOT_RATIO = 0.2;
const EXIT_RING_RATIO = 0.3;
const ROUTE_WIDTH_RATIO = 0.22;

type SheetFonts = { regular: PDFFont; bold: PDFFont; mono: PDFFont; monoBold: PDFFont };

const createDocument = async (spec: MazeSpec): Promise<{ document: PDFDocument; fonts: SheetFonts }> => {
  const document = await PDFDocument.create();
  document.setTitle(`Maze ${encodeId(spec)}`);
  document.setAuthor("Maze Runner");
  document.setCreator("Maze Runner");
  document.setProducer("Maze Runner");
  document.setCreationDate(FIXED_DATE);
  document.setModificationDate(FIXED_DATE);

  const fonts: SheetFonts = {
    regular: await document.embedFont(StandardFonts.Helvetica),
    bold: await document.embedFont(StandardFonts.HelveticaBold),
    mono: await document.embedFont(StandardFonts.Courier),
    monoBold: await document.embedFont(StandardFonts.CourierBold),
  };
  return { document, fonts };
};

const fitFontSize = (font: PDFFont, text: string, maxWidth: number, maxSize: number): number =>
  Math.min(maxSize, (maxWidth / font.widthOfTextAtSize(text, 1)));

const drawCenteredText = (
  page: PDFPage,
  text: string,
  baselineY: number,
  font: PDFFont,
  size: number,
  color = INK,
): void => {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH_POINTS - textWidth) / 2, y: baselineY, font, size, color });
};

const drawMaze = (
  page: PDFPage,
  maze: Maze,
  layout: SheetLayout,
  route: readonly Position[],
): void => {
  if (route.length > 1) {
    page.drawSvgPath(buildRoutePath(route, layout.cell), {
      x: layout.boardLeft,
      y: layout.boardTop,
      borderColor: ROUTE,
      borderWidth: Math.max(1.5, layout.cell * ROUTE_WIDTH_RATIO),
      borderLineCap: LineCapStyle.Round,
    });
  }

  page.drawSvgPath(buildWallsPath(maze, layout.cell), {
    x: layout.boardLeft,
    y: layout.boardTop,
    borderColor: INK,
    borderWidth: layout.wallWidth,
    borderLineCap: LineCapStyle.Projecting,
  });

  const startPoint = cellCenterPoint(layout, getStartPosition());
  page.drawCircle({ ...startPoint, size: Math.max(1.6, layout.cell * START_DOT_RATIO), color: INK });

  const exitPoint = cellCenterPoint(layout, getEndPosition(maze));
  page.drawCircle({
    ...exitPoint,
    size: Math.max(2.2, layout.cell * EXIT_RING_RATIO),
    borderColor: INK,
    borderWidth: Math.max(0.9, layout.cell * 0.07),
  });
  page.drawCircle({ ...exitPoint, size: Math.max(0.9, layout.cell * 0.1), color: INK });
};

export type BlankSheetInput = { spec: MazeSpec; maze: Maze };

// The plain maze, always available for any valid ID
export const buildBlankSheet = async ({ spec, maze }: BlankSheetInput): Promise<Uint8Array> => {
  const { document, fonts } = await createDocument(spec);
  const page = document.addPage([PAGE_WIDTH_POINTS, PAGE_HEIGHT_POINTS]);
  const layout = computeSheetLayout({
    mazeSize: maze.size,
    headerHeight: 0,
    footerHeight: BLANK_FOOTER_HEIGHT,
  });

  drawMaze(page, maze, layout, []);
  drawCenteredText(page, encodeId(spec), PAGE_MARGIN_POINTS, fonts.mono, 8, MUTED);
  return document.save();
};

export type ChallengeSheetInput = {
  spec: MazeSpec;
  maze: Maze;
  content: ChallengeContent;
  playUrl: string;
};

const drawChallengeHeader = (
  page: PDFPage,
  fonts: SheetFonts,
  spec: MazeSpec,
  content: ChallengeContent,
): void => {
  const top = PAGE_HEIGHT_POINTS - PAGE_MARGIN_POINTS;
  page.drawText("MAZE RUNNER", { x: PAGE_MARGIN_POINTS, y: top - 9, font: fonts.bold, size: 9, color: MUTED });

  const headlineSize = fitFontSize(fonts.bold, content.headline, CONTENT_WIDTH_POINTS, HEADLINE_MAX_SIZE);
  page.drawText(content.headline, {
    x: PAGE_MARGIN_POINTS,
    y: top - 42,
    font: fonts.bold,
    size: headlineSize,
    color: INK,
  });

  if (content.timeText !== null) {
    page.drawText("TIME TO BEAT", { x: PAGE_MARGIN_POINTS, y: top - 68, font: fonts.bold, size: 8, color: MUTED });
    page.drawText(content.timeText, { x: PAGE_MARGIN_POINTS, y: top - 92, font: fonts.monoBold, size: 24, color: INK });
  }

  if (content.showMazeId) {
    const mazeId = encodeId(spec);
    const idWidth = fonts.monoBold.widthOfTextAtSize(mazeId, 13);
    const idLeft = PAGE_WIDTH_POINTS - PAGE_MARGIN_POINTS - idWidth;
    page.drawText("MAZE", { x: idLeft, y: top - 68, font: fonts.bold, size: 8, color: MUTED });
    page.drawText(mazeId, { x: idLeft, y: top - 84, font: fonts.monoBold, size: 13, color: INK });
    const description = describeSpec(spec);
    const descriptionWidth = fonts.regular.widthOfTextAtSize(description, 9);
    page.drawText(description, {
      x: PAGE_WIDTH_POINTS - PAGE_MARGIN_POINTS - descriptionWidth,
      y: top - 98,
      font: fonts.regular,
      size: 9,
      color: MUTED,
    });
  }
};

const drawWritingLine = (
  page: PDFPage,
  fonts: SheetFonts,
  label: string,
  left: number,
  width: number,
  baselineY: number,
): void => {
  page.drawText(label, { x: left, y: baselineY + 3, font: fonts.bold, size: 9, color: MUTED });
  const labelWidth = fonts.bold.widthOfTextAtSize(label, 9) + 8;
  page.drawLine({
    start: { x: left + labelWidth, y: baselineY },
    end: { x: left + width, y: baselineY },
    thickness: 0.75,
    color: INK,
  });
};

const drawChallengeFooter = (
  page: PDFPage,
  fonts: SheetFonts,
  content: ChallengeContent,
  playUrl: string,
): void => {
  const bottom = PAGE_MARGIN_POINTS;
  page.drawText("Start at the dot in the top-left corner. Reach the ring in the bottom-right corner.", {
    x: PAGE_MARGIN_POINTS,
    y: bottom + 36,
    font: fonts.regular,
    size: 10,
    color: INK,
  });
  if (content.showMazeId) {
    page.drawText(`Play it online: ${playUrl}`, {
      x: PAGE_MARGIN_POINTS,
      y: bottom + 52,
      font: fonts.mono,
      size: 8.5,
      color: MUTED,
    });
  }
  drawWritingLine(page, fonts, "YOUR NAME", PAGE_MARGIN_POINTS, CONTENT_WIDTH_POINTS * 0.6, bottom + 8);
  drawWritingLine(
    page,
    fonts,
    "YOUR TIME",
    PAGE_MARGIN_POINTS + CONTENT_WIDTH_POINTS * 0.68,
    CONTENT_WIDTH_POINTS * 0.32,
    bottom + 8,
  );
};

// One A4 page built from a verified result: the caller supplies only values read from a signed
// result code, and what is printed is decided by `content`.
export const buildChallengeSheet = async ({
  spec,
  maze,
  content,
  playUrl,
}: ChallengeSheetInput): Promise<Uint8Array> => {
  const { document, fonts } = await createDocument(spec);
  const page = document.addPage([PAGE_WIDTH_POINTS, PAGE_HEIGHT_POINTS]);
  const hasStats = content.timeText !== null || content.showMazeId;
  const layout = computeSheetLayout({
    mazeSize: maze.size,
    headerHeight: HEADER_BASE_HEIGHT + (hasStats ? HEADER_STATS_HEIGHT : 0),
    footerHeight: FOOTER_BASE_HEIGHT + (content.showMazeId ? FOOTER_LINK_HEIGHT : 0),
  });

  const route = content.showRoute ? (findShortestPath(maze) ?? []) : [];
  drawChallengeHeader(page, fonts, spec, content);
  drawMaze(page, maze, layout, route);
  drawChallengeFooter(page, fonts, content, playUrl);
  return document.save();
};