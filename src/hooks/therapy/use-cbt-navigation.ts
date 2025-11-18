import { useMemo } from 'react';
import { useCBTDataManager } from './use-cbt-data-manager';

export function useCBTNavigation() {
  const { navigation } = useCBTDataManager();

  return useMemo(
    () => ({
      goNext: () => navigation.goNext(),
      goPrevious: () => navigation.goPrevious(),
      canGoNext: navigation.canGoNext,
      canGoPrevious: navigation.canGoPrevious,
      currentStep: navigation.currentStep,
      setCurrentStep: (step: number) => navigation.setCurrentStep(step),
    }),
    [navigation]
  );
}
