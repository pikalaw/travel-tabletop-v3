import type { Amount, Continuous as Layered, Duration, ObjectRef } from '../abilities';
import type { Handler } from './kit';

/** "Gets +N/+N until end of turn." */
export interface Pump { pump: ObjectRef; power: Amount; toughness: Amount; duration: Duration }
/** "Gains flying until end of turn." */
export interface Grant { grant: ObjectRef; keywords: string[]; duration: Duration }
/** Any continuous effect on these objects for a duration: "loses all abilities and is 1/1 until end of turn". */
export interface Continuous { continuous: Omit<Layered, 'affects'>; on: ObjectRef; duration: Duration }
/** "If it would die this turn, exile it instead." */
export interface ExileIfWouldDie { exileIfWouldDie: ObjectRef; duration: Duration }

const ids = (os: { id: string }[]) => os.map((o) => o.id);

export const pump: Handler<Pump> = (e, r) => r.addEffect({ modify: [r.n(e.power), r.n(e.toughness)] }, ids(r.objs(e.pump)), e.duration);
export const grant: Handler<Grant> = (e, r) => r.addEffect({ addKeywords: e.keywords }, ids(r.objs(e.grant)), e.duration);
export const continuous: Handler<Continuous> = (e, r) => r.addEffect(e.continuous, ids(r.objs(e.on)), e.duration);
export const exileIfWouldDie: Handler<ExileIfWouldDie> = (e, r) => r.addEffect({ exileIfWouldDie: true }, ids(r.objs(e.exileIfWouldDie)), e.duration);
