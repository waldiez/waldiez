/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WizardStepProps } from "@waldiez/components/wizard/types";

export const WizardStep = (props: WizardStepProps) => {
    const { children, id } = props;
    return (
        <div className="wizard-step-view" data-testid={`wizard-step-${id}`}>
            {children}
        </div>
    );
};
