"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Stepper } from "./stepper";
import { StepProjectCreated } from "./step-project-created";
import { StepCopyCode } from "./step-copy-code";
import { StepInstallGuide } from "./step-install-guide";
import { StepVerify } from "./step-verify";

interface SetupWizardProps {
  projectId: string;
  projectName: string;
  projectUrl: string;
  apiUrl: string;
  hasFirstFeedback: boolean;
  onComplete: () => void;
}

export function SetupWizard({
  projectId,
  projectName,
  projectUrl,
  apiUrl,
  hasFirstFeedback,
  onComplete,
}: SetupWizardProps) {
  const t = useTranslations("setup");
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, label: t("steps.created") },
    { id: 2, label: t("steps.copyCode") },
    { id: 3, label: t("steps.install") },
    { id: 4, label: t("steps.verify") },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-8">{t("title")}</h1>

      <Stepper steps={steps} currentStep={currentStep} />

      <div className="mt-8">
        {currentStep === 1 && (
          <StepProjectCreated
            projectName={projectName}
            projectUrl={projectUrl}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <StepCopyCode
            projectId={projectId}
            apiUrl={apiUrl}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <StepInstallGuide onNext={handleNext} onBack={handleBack} />
        )}
        {currentStep === 4 && (
          <StepVerify
            projectUrl={projectUrl}
            hasFirstFeedback={hasFirstFeedback}
            onComplete={onComplete}
            onBack={handleBack}
            onSkip={onComplete}
          />
        )}
      </div>
    </div>
  );
}
