"use client";
/**
 * ThemeProviders
 * - Thin wrapper around next-themes' ThemeProvider with explicit children typing.
 * - Used in app/layout.tsx to enable class-based dark mode across the app.
 * - Avoids TS issues with ThemeProviderProps and children in some setups.
 */

import * as React from "react";
import {
    ThemeProvider as NextThemesProvider,
    type ThemeProviderProps as NextThemesProps,
} from "next-themes";

// Make sure `children` is allowed on the prop type
type Props = React.PropsWithChildren<NextThemesProps>;

// Re-type the provider so TS accepts children
const Provider = NextThemesProvider as unknown as React.ComponentType<Props>;

export function ThemeProviders({
    children,
    attribute = "class",
    defaultTheme = "light",
    enableSystem = false,
    ...rest
}: Props) {
    return (
        <Provider
            attribute={attribute}
            defaultTheme={defaultTheme}
            enableSystem={enableSystem}
            {...rest}
        >
            {children}
        </Provider>
    );
}

export default ThemeProviders;
