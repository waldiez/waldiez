/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { JSX } from "react";

export type ActionDef =
    | {
          kind: "action";
          key: string;
          label: string;
          title?: string;
          icon: JSX.Element;
          onClick: () => void;
          disabled?: boolean;
          testId?: string;
          className?: string;
      }
    | {
          kind: "link";
          key: string;
          label: string;
          title?: string;
          icon: JSX.Element;
          href: string;
          testId?: string;
          className?: string;
      };

export type MenuItem =
    | {
          kind: "action";
          key: string;
          label: string;
          icon: JSX.Element;
          onClick: () => void;
          disabled?: boolean;
      }
    | { kind: "link"; key: string; label: string; icon: JSX.Element; href: string }
    | { kind: "separator"; key: string };

export function toMenuItems(actions: ActionDef[]): MenuItem[] {
    return actions.map(a => {
        if (a.kind === "link") {
            return { kind: "link", key: a.key, label: a.label, icon: a.icon, href: a.href };
        }
        return {
            kind: "action",
            key: a.key,
            label: a.label,
            icon: a.icon,
            onClick: a.onClick,
            disabled: a.disabled,
        };
    });
}

export function pickVisibleGroup(groups: ActionDef[][]): ActionDef[] {
    for (const g of groups) {
        if (g.length > 0) {
            return g;
        }
    }
    return [];
}

export function removeActionsByKey(all: ActionDef[], keys: Set<string>): ActionDef[] {
    return all.filter(a => !keys.has(a.key));
}
