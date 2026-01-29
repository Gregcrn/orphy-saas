"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step.id < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.id === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {step.id < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium hidden sm:block",
                step.id === currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 sm:w-24 h-0.5 mx-2",
                step.id < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
