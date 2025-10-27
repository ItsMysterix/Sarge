import { type StackBlueprint } from '../detector/schema';
import { type ApplyPlan, type CurrentStackState, type PlannerOptions } from './schema';
export declare function planApply(blueprintInput: StackBlueprint, currentInput?: CurrentStackState, optionsInput?: Partial<PlannerOptions>): ApplyPlan;
