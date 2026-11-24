import { card } from '../script';

// It'll Quench Ya!: Counter target spell unless its controller pays {2}.
export default card({
  oracleId: 'cb184995-700f-4900-994a-4ce7fd12f942',
  name: "It'll Quench Ya!",
  spell: { targets: [{ objects: { zone: 'stack' } }], effects: [{ counterUnlessPays: '{2}', on: { target: 0 } }] },
});
