import { Box, Flex, IconComponent } from "@/components/base";
import WikiCreateButton from "@/pages/BoardPage/components/wiki/WikiCreateButton";
import { useTranslation } from "react-i18next";

const WikiEmptyState = () => {
    const [t] = useTranslation();

    return (
        <Flex
            direction="col"
            items="center"
            justify="center"
            className="min-h-[18rem] gap-4 rounded-lg border border-dashed bg-muted/30 p-8 text-center"
        >
            <Flex
                items="center"
                justify="center"
                className="size-12 rounded-full border border-dashed border-muted-foreground/40 bg-background text-muted-foreground"
            >
                <IconComponent icon="file-plus" size="6" />
            </Flex>
            <Box className="space-y-1">
                <p className="text-base font-semibold text-foreground">{t("wiki.No wikis yet")}</p>
                <p className="text-sm text-muted-foreground">{t("wiki.Create your first wiki to keep notes and docs.")}</p>
            </Box>
            <WikiCreateButton />
        </Flex>
    );
};

export default WikiEmptyState;
