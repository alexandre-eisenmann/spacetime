import {withTerritories} from './territories';
import {curated} from './curated';
export const catalog=withTerritories(curated);
// Presentation settings are separate from historical claims and source normalization.
export const colors:Record<string,string>={'period-persia':'#8e739a','period-athens':'#508b9b','period-sparta':'#648060','period-republic':'#b1834d','period-empire':'#a76166','period-philip':'#8f7a4e','campaign-alexander':'#ad774d','period-successors':'#9a6a52','period-mexica':'#6f8a5e','period-triple-alliance':'#4f8070','conquest-mexico':'#8f5a4b','period-cuzco':'#a3824a','period-inca':'#b07a3a','conquest-peru':'#8f5a4b','conflict-ww2':'#8f4b4b'};
export const bounds:[number,number]=[-4999,2026];
