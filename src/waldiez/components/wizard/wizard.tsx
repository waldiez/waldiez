/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactElement, useEffect, useState } from "react";

type WizardStepProps = {
    id: string;
    title: string;
    children: React.ReactNode;
};

export type WizardProps = {
    activeStep: number;
    children: React.ReactNode;
    canGoForward?: boolean | ((step: number) => boolean);
    canGoBack?: boolean | ((step: number) => boolean);
    firstBackTitle?: string;
    lastNextTitle?: string;
    onBack?: (step: number) => void;
    onForward?: (step: number) => void;
};
export const WizardStep: React.FC<WizardStepProps> = (props: WizardStepProps) => {
    const { children, id } = props;
    return (
        <div className="wizard-step-view" data-testid={`wizard-step-${id}`}>
            {children}
        </div>
    );
};

export const Wizard: React.FC<WizardProps> = (props: WizardProps) => {
    const {
        children,
        activeStep = 0,
        canGoForward = true,
        canGoBack = true,
        firstBackTitle = "Cancel",
        lastNextTitle = "Finish",
        onBack = undefined,
        onForward = undefined,
    } = props;
    const [currentStep, setCurrentStep] = useState(activeStep);
    useEffect(() => {
        setCurrentStep(activeStep);
    }, [activeStep]);
    const steps = React.Children.toArray(children).filter(
        (child): child is ReactElement<WizardStepProps> =>
            React.isValidElement(child) && child.type === WizardStep,
    );
    const goBackCheck = typeof canGoBack === "function" ? canGoBack(currentStep) : canGoBack;
    const isBackDisabled = (currentStep === 0 && !onBack) || !goBackCheck;
    const goForwardCheck = typeof canGoForward === "function" ? canGoForward(currentStep) : canGoForward;
    const isForwardDisabled = (currentStep === steps.length - 1 && !onForward) || !goForwardCheck;
    const goBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
        if (onBack) {
            onBack(currentStep);
        }
    };
    const goForward = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
        if (onForward) {
            onForward(currentStep);
        }
    };
    return (
        <div className="wizard">
            <div className="wizard-steps" role="tablist">
                {steps.map((step, index) => {
                    const className = currentStep === index ? "wizard-step--active" : "";
                    return (
                        <div
                            role="tab"
                            key={`wizard-step-${index}`}
                            className={`wizard-step ${className}`}
                            data-testid={`step-id-${step.props.id}`}
                        >
                            {step}
                        </div>
                    );
                })}
            </div>
            <div className="wizard-actions">
                <button
                    type="button"
                    title={currentStep === 0 ? firstBackTitle : "Back"}
                    onClick={goBack}
                    data-testid="wizard-back-btn"
                    disabled={isBackDisabled}
                    className="wizard-action-btn wizard-action-btn-prev"
                >
                    {currentStep === 0 ? firstBackTitle : "Back"}
                </button>
                <button
                    type="button"
                    title={currentStep === steps.length - 1 ? lastNextTitle : "Next"}
                    onClick={goForward}
                    disabled={isForwardDisabled}
                    data-testid="wizard-next-btn"
                    className="wizard-action-btn wizard-action-btn-next"
                >
                    {currentStep === steps.length - 1 ? lastNextTitle : "Next"}
                </button>
            </div>
        </div>
    );
};
