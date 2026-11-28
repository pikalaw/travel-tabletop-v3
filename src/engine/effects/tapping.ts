import type { ObjectRef } from '../abilities';
import { tap as tapObject } from '../zones';
import type { Handler } from './kit';

export interface Tap { tap: ObjectRef }
export interface Untap { untap: ObjectRef }

export const tap: Handler<Tap> = (e, r) => { for (const o of r.objs(e.tap)) tapObject(r.s, o.id); };
export const untap: Handler<Untap> = (e, r) => { for (const o of r.objs(e.untap)) o.tapped = false; };
