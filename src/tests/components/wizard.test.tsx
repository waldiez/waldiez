/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Wizard, WizardStep } from "@waldiez/components/wizard";

describe("Wizard", () => {
    it("should render successfully", () => {
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
        };
        const { baseElement } = render(<Wizard {...wizardProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should switch step", () => {
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
        };
        render(<Wizard {...wizardProps} />);
        const nextButton = screen.getByText("Next");
        fireEvent.click(nextButton);
        const step2 = screen.getByTestId("step-id-step2");
        expect(step2).toHaveClass("wizard-step--active");
    });

    it("should disable back button on first step", () => {
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
        };
        render(<Wizard {...wizardProps} />);
        const backButton = screen.getByText("Cancel");
        expect(backButton).toBeDisabled();
    });

    it("should disable next button on last step", () => {
        const wizardProps = {
            activeStep: 1,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
        };
        render(<Wizard {...wizardProps} />);
        const nextButton = screen.getByText("Finish");
        expect(nextButton).toBeDisabled();
    });

    it("should call onBack when clicking back button", () => {
        const onBack = vi.fn();
        const wizardProps = {
            activeStep: 1,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
            onBack,
        };
        render(<Wizard {...wizardProps} />);
        const backButton = screen.getByText("Back");
        fireEvent.click(backButton);
        expect(onBack).toHaveBeenCalled();
    });

    it("should call onForward when clicking next button", () => {
        const onForward = vi.fn();
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
                <WizardStep key="step3" id="step3" title="Step 3">
                    <div>Step 3 Content</div>
                </WizardStep>,
            ],
            onForward,
        };
        render(<Wizard {...wizardProps} />);
        let nextButton = screen.getByText("Next");
        fireEvent.click(nextButton);
        nextButton = screen.getByText("Next");
        fireEvent.click(nextButton);
        nextButton = screen.getByText("Finish");
        fireEvent.click(nextButton);
        expect(onForward).toHaveBeenCalled();
    });

    it("should disable back button when canGoBack is false", () => {
        const wizardProps = {
            activeStep: 1,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
            canGoBack: false,
        };
        render(<Wizard {...wizardProps} />);
        const backButton = screen.getByText("Back");
        expect(backButton).toBeDisabled();
    });

    it("should disable next button when canGoForward is false", () => {
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
            canGoForward: false,
        };
        render(<Wizard {...wizardProps} />);
        const nextButton = screen.getByText("Next");
        expect(nextButton).toBeDisabled();
    });

    it("should accept custom titles", () => {
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
            firstBackTitle: "Custom Back",
            lastNextTitle: "Custom Next",
        };
        render(<Wizard {...wizardProps} />);
        const backButton = screen.getByText("Custom Back");
        expect(backButton).toBeInTheDocument();
        const firstNextButton = screen.getByText("Next");
        fireEvent.click(firstNextButton);
        const nextButton = screen.getByText("Custom Next");
        expect(nextButton).toBeInTheDocument();
    });

    it("should accept function for canGoBack and canGoForward", () => {
        const canGoBack = vi.fn().mockReturnValue(true);
        const canGoForward = vi.fn().mockReturnValue(true);
        const wizardProps = {
            activeStep: 0,
            children: [
                <WizardStep key="step1" id="step1" title="Step 1">
                    <div>Step 1 Content</div>
                </WizardStep>,
                <WizardStep key="step2" id="step2" title="Step 2">
                    <div>Step 2 Content</div>
                </WizardStep>,
            ],
            canGoBack,
            canGoForward,
        };
        render(<Wizard {...wizardProps} />);
        expect(canGoBack).toHaveBeenCalledWith(0);
        expect(canGoForward).toHaveBeenCalledWith(0);
        const nextButton = screen.getByText("Next");
        fireEvent.click(nextButton);
        expect(canGoForward).toHaveBeenCalledWith(1);
        const backButton = screen.getByText("Back");
        fireEvent.click(backButton);
        expect(canGoBack).toHaveBeenCalledWith(1);
    });
});
