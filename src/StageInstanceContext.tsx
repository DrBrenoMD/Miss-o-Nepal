import { createContext, useContext } from 'react';

export interface StageInstanceConfig {
  isPreview: boolean;
  forcedSubStep: number | null;
  disableSlideTapAdvance: boolean;
}

const StageInstanceContext = createContext<StageInstanceConfig>({
  isPreview: false,
  forcedSubStep: null,
  disableSlideTapAdvance: false,
});

export const StageInstanceProvider = StageInstanceContext.Provider;
export const useStageInstance = () => useContext(StageInstanceContext);
