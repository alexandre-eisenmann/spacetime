// The hand-curated story datasets, before territory is added; scripts/import-cliopatria.ts extracts borders for them.
import {alexander} from './alexander';
import {antiquity} from './antiquity';
import {ww2} from './ww2';
import {mergeDatasets} from '../domain/selectors';
export const curated=mergeDatasets([antiquity,alexander,ww2]);
