import { describe, expect, it } from 'vitest';
import { builtInConfigs, defaultConfig } from '../configs';
import { parseFormationConfig, SETTER_POSITIONS, type PlayerDef, type ReceptionZones } from '../configs/schema';
import { COURT_RECT, ZONE_STYLE } from '../court/courtGeometry';
import { computeBenchDisplay } from '../court/benchDisplay';
import {
  areaPoints,
  buildDefaultZones,
  canMergeVertices,
  canRemoveVertex,
  findMergeTarget,
  constrainVertex,
  getCompetenceEdges,
  getReceptionPhase,
  getSharedEdges,
  resolveReceptionZones,
  ROLE_COLOURS,
  summariseNeighbours,
  withEdgeSplit,
  withReceptionZones,
  withVertexMoved,
  zoneFillColour,
  withVertexRemoved,
  withVerticesMerged,
} from './receptionZones';
import { getPositions, resolveActiveLiberoSwap } from './selectors';

const players: PlayerDef[] = [
  { id: 'A', label: 'A', shortLabel: 'A', role: 'hitter' },
  { id: 'L', label: 'L', shortLabel: 'L', role: 'libero' },
  { id: 'B', label: 'B', shortLabel: 'B', role: 'hitter' },
];
const positions = { A: { x: 150, y: 300 }, L: { x: 300, y: 330 }, B: { x: 450, y: 300 } };

function polygonArea(zones: ReceptionZones, i: number) {
  const pts = areaPoints(zones, zones.areas[i]!);
  let sum = 0;
  pts.forEach((p, j) => {
    const q = pts[(j + 1) % pts.length]!;
    sum += p.x * q.y - q.x * p.y;
  });
  return Math.abs(sum / 2);
}

function defaultReceptionDiagram(sp: (typeof SETTER_POSITIONS)[number]) {
  const phase = getReceptionPhase(defaultConfig.phases)!;
  const swap = resolveActiveLiberoSwap(defaultConfig, 'receive', sp, null);
  return computeBenchDisplay(defaultConfig, getPositions(defaultConfig, phase, sp), swap);
}

describe('buildDefaultZones', () => {
  const zones = buildDefaultZones(['A', 'L', 'B'], positions, players);

  it('divide tutto il campo tra i ricevitori', () => {
    const total = zones.areas.reduce((sum, _, i) => sum + polygonArea(zones, i), 0);
    expect(total).toBeCloseTo(COURT_RECT.width * COURT_RECT.height, 0);
  });

  it('i confini tra zone vicine usano gli stessi vertici', () => {
    const shared = getSharedEdges(zones);
    expect(shared.map((e) => e.areas.map((i) => zones.areas[i]!.playerId).sort())).toEqual(
      expect.arrayContaining([
        ['A', 'L'],
        ['B', 'L'],
      ]),
    );
  });

  it('di default le palle di confine sono del libero', () => {
    const summary = summariseNeighbours(zones).map(({ areas, owners }) => ({
      pair: areas.map((i) => zones.areas[i]!.playerId),
      owners: owners.map((i) => zones.areas[i]!.playerId),
    }));
    expect(summary).toEqual([
      { pair: ['A', 'L'], owners: ['L'] },
      { pair: ['L', 'B'], owners: ['L'] },
    ]);
  });

  it('il colore di partenza dipende dal ruolo; chi resta tiene il suo', () => {
    const withO = [...players, { id: 'O', label: 'O', shortLabel: 'O', role: 'opposite' as const }];
    const custom = { ...zones, areas: zones.areas.map((a) => (a.playerId === 'A' ? { ...a, color: '#000000' } : a)) };
    const next = buildDefaultZones(['O', 'A', 'L', 'B'], { ...positions, O: { x: 100, y: 60 } }, withO, custom);
    const colour = (id: string) => next.areas.find((a) => a.playerId === id)!.color;
    expect(colour('A')).toBe('#000000');
    expect(colour('L')).toBe(ROLE_COLOURS.libero[0]);
    expect(colour('O')).toBe(ROLE_COLOURS.opposite[0]);
    // Second hitter of the scheme: the lighter shade.
    expect(colour('B')).toBe(ROLE_COLOURS.hitter[1]);
  });

  it('senza una mappa salvata, ogni rotazione parte da 3 ricevitori (due laterali e il libero)', () => {
    const unmapped = { ...defaultConfig, receptionZones: {} };
    for (const sp of SETTER_POSITIONS) {
      const { players: shown, positions: shownPositions } = defaultReceptionDiagram(sp);
      const { zones: resolved, stored } = resolveReceptionZones(unmapped, sp, shown, shownPositions);
      expect(stored).toBe(false);
      expect(resolved.areas.map((a) => a.playerId).sort()).toEqual(['L1', 'S1', 'S2']);
    }
  });
});

describe('modifica dei vertici', () => {
  const zones = buildDefaultZones(['A', 'L', 'B'], positions, players);
  const [edge] = getSharedEdges(zones);

  it('gli angoli del campo restano fermi, i vertici sul bordo scorrono lungo il bordo', () => {
    const corner = { x: COURT_RECT.x, y: COURT_RECT.y };
    expect(constrainVertex(corner, { x: 200, y: 200 })).toEqual(corner);
    const onTop = { x: 200, y: COURT_RECT.y };
    expect(constrainVertex(onTop, { x: 260, y: 100 })).toEqual({ x: 260, y: COURT_RECT.y });
  });

  it('spostare un vertice condiviso sposta entrambe le zone', () => {
    const split = withEdgeSplit(zones, edge!.a, edge!.b);
    const newId = Object.keys(split.vertices).find((id) => !zones.vertices[id])!;
    const users = split.areas.filter((a) => a.vertices.includes(newId));
    expect(users).toHaveLength(2);

    const moved = withVertexMoved(split, newId, { x: 280, y: 250 });
    for (const area of moved.areas.filter((a) => a.vertices.includes(newId))) {
      expect(areaPoints(moved, area)).toContainEqual({ x: 280, y: 250 });
    }
  });

  it('un vertice aggiunto si può togliere, gli angoli no', () => {
    const split = withEdgeSplit(zones, edge!.a, edge!.b);
    const newId = Object.keys(split.vertices).find((id) => !zones.vertices[id])!;
    expect(canRemoveVertex(split, newId)).toBe(true);
    expect(withVertexRemoved(split, newId).areas).toEqual(zones.areas);

    const cornerId = Object.entries(zones.vertices).find(([, p]) => p.x === COURT_RECT.x && p.y === COURT_RECT.y)![0];
    expect(canRemoveVertex(zones, cornerId)).toBe(false);
  });

  it('due vertici vicini sullo stesso confine si uniscono in uno solo', () => {
    const split = withEdgeSplit(zones, edge!.a, edge!.b);
    const newId = Object.keys(split.vertices).find((id) => !zones.vertices[id])!;
    const near = { x: split.vertices[edge!.a]!.x + 5, y: split.vertices[edge!.a]!.y + 5 };
    const dropped = withVertexMoved(split, newId, near);
    const target = findMergeTarget(dropped, newId);
    expect(target).toBe(edge!.a);

    const merged = withVerticesMerged(dropped, newId, target!);
    expect(merged.vertices[newId]).toBeUndefined();
    expect(merged.areas).toEqual(zones.areas);
    // Still the whole court.
    const total = merged.areas.reduce((sum, _, i) => sum + polygonArea(merged, i), 0);
    expect(total).toBeCloseTo(COURT_RECT.width * COURT_RECT.height, 0);
  });

  it('troppo lontani non si uniscono', () => {
    const split = withEdgeSplit(zones, edge!.a, edge!.b);
    const newId = Object.keys(split.vertices).find((id) => !zones.vertices[id])!;
    expect(findMergeTarget(split, newId)).toBeNull();
  });

  it('non si uniscono se strozzerebbero una zona o taglierebbero un angolo del campo', () => {
    // Two non-consecutive vertices of the same area: it would be pinched in two.
    const area = zones.areas.find((a) => a.vertices.length >= 4)!;
    expect(canMergeVertices(zones, area.vertices[0]!, area.vertices[2]!)).toBe(false);

    // Border vertices on two different borders, either side of the top-left corner: the corner's area has both.
    const L = COURT_RECT.x;
    const T = COURT_RECT.y;
    const R = COURT_RECT.x + COURT_RECT.width;
    const Bt = COURT_RECT.y + COURT_RECT.height;
    const corner: ReceptionZones = {
      vertices: { c0: { x: L, y: T }, c1: { x: R, y: T }, c2: { x: R, y: Bt }, c3: { x: L, y: Bt }, t: { x: L + 5, y: T }, l: { x: L, y: T + 5 } },
      areas: [
        { playerId: 'A', color: '#000000', competence: [], vertices: ['c0', 't', 'l'] },
        { playerId: 'B', color: '#000000', competence: [], vertices: ['t', 'c1', 'c2', 'c3', 'l'] },
      ],
    };
    expect(canMergeVertices(corner, 't', 'l')).toBe(false);
  });
});

describe('competenze', () => {
  it('una competenza a destra di A marca il confine con L; se la rivendicano entrambi è un conflitto', () => {
    const base = buildDefaultZones(['A', 'L', 'B'], positions, players);
    const zones: ReceptionZones = {
      ...base,
      areas: base.areas.map((a) => (a.playerId === 'A' ? { ...a, competence: ['right'] } : a)),
    };
    const edgesAL = getCompetenceEdges(zones).filter((e) =>
      e.areas.map((i) => zones.areas[i]!.playerId).sort().join() === 'A,L',
    );
    expect(edgesAL.length).toBeGreaterThan(0);
    for (const e of edgesAL) expect(e.owners.map((i) => zones.areas[i]!.playerId).sort()).toEqual(['A', 'L']);
  });

  it('avanti/dietro distingue chi sta più vicino alla rete', () => {
    const fb: PlayerDef[] = [
      { id: 'F', label: 'F', shortLabel: 'F', role: 'hitter' },
      { id: 'K', label: 'K', shortLabel: 'K', role: 'hitter' },
    ];
    const base = buildDefaultZones(['F', 'K'], { F: { x: 300, y: 150 }, K: { x: 300, y: 400 } }, fb);
    const zones: ReceptionZones = {
      ...base,
      areas: base.areas.map((a) => ({ ...a, competence: ['back'] })),
    };
    const [edge] = getCompetenceEdges(zones);
    expect(edge!.owners.map((i) => zones.areas[i]!.playerId)).toEqual(['F']);
  });
});

describe('schemi inclusi', () => {
  it.each(builtInConfigs.map((config) => [config.name, config] as const))(
    '%s: ogni rotazione ha la sua mappa salvata, valida per la formazione di ricezione',
    (_name, config) => {
      for (const sp of SETTER_POSITIONS) {
        const phase = getReceptionPhase(config.phases)!;
        const swap = resolveActiveLiberoSwap(config, 'receive', sp, null);
        const { players: shown, positions: shownPositions } = computeBenchDisplay(config, getPositions(config, phase, sp), swap);
        expect(resolveReceptionZones(config, sp, shown, shownPositions).stored, `P${sp}`).toBe(true);
      }
    },
  );
});

describe('salvataggio', () => {
  it('le zone fanno parte del file di import/export dello schema', () => {
    const exported = JSON.parse(JSON.stringify(defaultConfig));
    expect(parseFormationConfig(exported).receptionZones).toEqual(defaultConfig.receptionZones);
    expect(Object.keys(exported.receptionZones)).toHaveLength(6);
  });

  it('una mappa salvata vale finché i suoi giocatori sono in campo', () => {
    const { players: shown, positions: shownPositions } = defaultReceptionDiagram(1);
    const defaults = resolveReceptionZones(defaultConfig, 1, shown, shownPositions).zones;
    const custom = { ...defaults, areas: defaults.areas.map((a) => ({ ...a, color: '#000000' })) };
    const config = withReceptionZones(defaultConfig, 1, custom);
    expect(resolveReceptionZones(config, 1, shown, shownPositions)).toEqual({ zones: custom, stored: true });

    const withoutLibero = shown.filter((p) => p.id !== 'L1');
    expect(resolveReceptionZones(config, 1, withoutLibero, shownPositions).stored).toBe(false);
    expect(withReceptionZones(config, 1, undefined).receptionZones['1']).toBeUndefined();
  });
});

describe('zoneFillColour', () => {
  it('is the colour at the fill opacity over the white court, the same for court and legend', () => {
    expect(ZONE_STYLE.courtFill).toBe('#ffffff');
    expect(zoneFillColour('#ffffff')).toBe('#ffffff');
    const k = ZONE_STYLE.fillOpacity;
    const expected = (c: number) => Math.round(255 - (255 - c) * k).toString(16).padStart(2, '0');
    expect(zoneFillColour('#000000')).toBe(`#${expected(0).repeat(3)}`);
    expect(zoneFillColour('#1d4ed8')).toBe(`#${expected(0x1d)}${expected(0x4e)}${expected(0xd8)}`);
  });
});
