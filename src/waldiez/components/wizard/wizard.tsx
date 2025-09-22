/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    Children,
    type ReactElement,
    type ReactNode,
    isValidElement,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

type WizardStepProps = {
    id: string;
    title: string;
    children: ReactNode;
};

export type WizardProps = {
    activeStep: number;
    children: ReactNode;
    canGoForward?: boolean | ((step: number) => boolean);
    canGoBack?: boolean | ((step: number) => boolean);
    firstBackTitle?: string;
    lastNextTitle?: string;
    onBack?: (step: number) => void;
    onForward?: (step: number) => void;
};

/**
 * Individual step component for the wizard
 */
export const WizardStep = memo<WizardStepProps>((props: WizardStepProps) => {
    const { children, id } = props;

    return (
        <div className="wizard-step-view" data-testid={`wizard-step-${id}`}>
            {children}
        </div>
    );
});

/**
 * Wizard component that handles multi-step processes with navigation
 */

export const Wizard = memo<WizardProps>((props: WizardProps) => {
    const {
        children,
        activeStep = 0,
        canGoForward = true,
        canGoBack = true,
        firstBackTitle = "Cancel",
        lastNextTitle = "Finish",
        onBack,
        onForward,
    } = props;

    // State for current step
    const [currentStep, setCurrentStep] = useState(activeStep);

    // Sync with external activeStep prop
    useEffect(() => {
        setCurrentStep(activeStep);
    }, [activeStep]);

    // Extract valid WizardStep children
    const steps = useMemo(
        () =>
            Children.toArray(children).filter(
                (child): child is ReactElement<WizardStepProps> =>
                    isValidElement(child) && child.type === WizardStep,
            ),
        [children],
    );

    // Determine if navigation is possible
    const goBackCheck = useMemo(
        () => (typeof canGoBack === "function" ? canGoBack(currentStep) : canGoBack),
        [canGoBack, currentStep],
    );

    const goForwardCheck = useMemo(
        () => (typeof canGoForward === "function" ? canGoForward(currentStep) : canGoForward),
        [canGoForward, currentStep],
    );

    const isBackDisabled = useMemo(
        () => (currentStep === 0 && !onBack) || !goBackCheck,
        [currentStep, onBack, goBackCheck],
    );

    const isForwardDisabled = useMemo(
        () => (currentStep === steps.length - 1 && !onForward) || !goForwardCheck,
        [currentStep, steps.length, onForward, goForwardCheck],
    );

    // Button text based on position
    const backButtonText = useMemo(
        () => (currentStep === 0 ? firstBackTitle : "Back"),
        [currentStep, firstBackTitle],
    );

    const nextButtonText = useMemo(
        () => (currentStep === steps.length - 1 ? lastNextTitle : "Next"),
        [currentStep, steps.length, lastNextTitle],
    );

    // Navigation handlers
    const goBack = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }

        if (onBack) {
            onBack(currentStep);
        }
    }, [currentStep, onBack]);

    const goForward = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }

        if (onForward) {
            onForward(currentStep);
        }
    }, [currentStep, steps.length, onForward]);

    // Render wizard steps
    const renderedSteps = useMemo(
        () =>
            steps.map((step, index) => {
                const isActive = currentStep === index;
                const className = isActive ? "wizard-step--active" : "";

                return (
                    <div
                        role="tab"
                        key={`wizard-step-${index}`}
                        className={`wizard-step ${className}`}
                        data-testid={`step-id-${step.props.id}`}
                        aria-selected={isActive}
                        aria-controls={`wizard-step-${step.props.id}`}
                    >
                        {step}
                    </div>
                );
            }),
        [steps, currentStep],
    );

    return (
        <div className="wizard">
            <div className="wizard-steps" role="tablist">
                {renderedSteps}
            </div>
            <div className="modal-actions">
                <button
                    type="button"
                    title={backButtonText}
                    onClick={goBack}
                    data-testid="wizard-back-btn"
                    disabled={isBackDisabled}
                    className="wizard-action-btn wizard-action-btn-prev"
                    aria-label={backButtonText}
                >
                    {backButtonText}
                </button>
                <button
                    type="button"
                    title={nextButtonText}
                    onClick={goForward}
                    disabled={isForwardDisabled}
                    data-testid="wizard-next-btn"
                    className="wizard-action-btn wizard-action-btn-next primary"
                    aria-label={nextButtonText}
                >
                    {nextButtonText}
                </button>
            </div>
        </div>
    );
});

WizardStep.displayName = "WizardStep";
Wizard.displayName = "Wizard";
