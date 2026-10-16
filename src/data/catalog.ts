import {withTerritories} from './territories';
import {alexander} from './alexander';
import {antiquity} from './antiquity';
import {ww2} from './ww2';
import {mergeDatasets} from '../domain/selectors';
export const catalog=withTerritories(mergeDatasets([antiquity,alexander,ww2]));
// Presentation settings are separate from historical claims and source normalization.
export const colors:Record<string,string>={'period-persia':'#8e739a','period-athens':'#508b9b','period-sparta':'#648060','period-republic':'#b1834d','period-empire':'#a76166','period-philip':'#8f7a4e','campaign-alexander':'#ad774d','period-successors':'#9a6a52','conflict-ww2':'#8f4b4b'};
export const bounds:[number,number]=[-4999,2026];
