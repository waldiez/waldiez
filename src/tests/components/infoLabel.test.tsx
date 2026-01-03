/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { render } from "@testing-library/react";

import { InfoLabel } from "@waldiez/components/infoLabel";

describe("InfoLabel", () => {
    it("should render successfully", () => {
        const { baseElement } = render(<InfoLabel htmlFor="test" label="test" info="test" />);
        expect(baseElement).toBeTruthy();
    });
    it("should render successfully with function", () => {
        const { baseElement } = render(<InfoLabel htmlFor="test" label={() => "test"} info={() => "test"} />);
        expect(baseElement).toBeTruthy();
    });
    it("should render successfully with JSX.Element", () => {
        const { baseElement } = render(
            <InfoLabel htmlFor="test" label={<div>test</div>} info={<div>test</div>} />,
        );
        expect(baseElement).toBeTruthy();
    });
});
