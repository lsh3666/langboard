import Box from "@/components/base/Box";
import { memo } from "react";
import { useTranslation } from "react-i18next";

interface IBoardSettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

const BoardSettingsSection = memo(({ title, children }: IBoardSettingsSectionProps) => {
    const [t] = useTranslation();

    return (
        <Box w="full" className="max-w-screen-sm">
            <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">{t(title)}</h2>
            {children}
        </Box>
    );
});

export default BoardSettingsSection;
