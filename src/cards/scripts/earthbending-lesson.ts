import { LAND_YOU_CONTROL, earthbend } from '../keywords';
import { card } from '../script';

// Earthbending Lesson: Earthbend 4. (Target land you control becomes a 0/0 creature with haste that's still a land. Put four +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)
export default card({
  oracleId: '5e113f0f-4469-4276-82e1-0a804f3de444',
  name: "Earthbending Lesson",
  spell: { targets: [LAND_YOU_CONTROL], effects: [earthbend(4, 0)] },
});
