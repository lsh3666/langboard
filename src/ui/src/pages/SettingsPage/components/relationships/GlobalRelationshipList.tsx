import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Checkbox from "@/components/base/Checkbox";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Loading from "@/components/base/Loading";
import InfiniteScroller from "@/components/InfiniteScroller";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import useScrollToTop from "@/core/hooks/useScrollToTop";
import { GlobalRelationshipType } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
import GlobalRelationshipRow from "@/pages/SettingsPage/components/relationships/GlobalRelationshipRow";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";

export interface IGlobalRelationshipListProps {
    selectedGlobalRelationships: string[];
    setSelectedGlobalRelationships: React.Dispatch<React.SetStateAction<string[]>>;
}

function GlobalRelationshipList({ selectedGlobalRelationships, setSelectedGlobalRelationships }: IGlobalRelationshipListProps) {
    const [t] = useTranslation();
    const { scrollableRef, isAtTop, scrollToTop } = useScrollToTop({});
    const updater = useReducer((x) => x + 1, 0);
    const globalRelationships = GlobalRelationshipType.Model.useModels(() => true);
    const PAGE_SIZE = 30;
    const { items: relationships, nextPage, hasMore } = useInfiniteScrollPager({ allItems: globalRelationships, size: PAGE_SIZE, updater });

    const selectAll = () => {
        setSelectedGlobalRelationships((prev) => {
            if (prev.length === relationships.length) {
                return [];
            } else {
                return relationships.map((relationship) => relationship.uid);
            }
        });
    };

    return (
        <Box position="relative" h="full">
            <Box
                className={cn(
                    "max-h-[calc(100vh_-_theme(spacing.40))]",
                    "md:max-h-[calc(100vh_-_theme(spacing.44))]",
                    "lg:max-h-[calc(100vh_-_theme(spacing.48))]",
                    "overflow-y-auto"
                )}
                ref={scrollableRef}
            >
                <InfiniteScroller.Table.Default
                    columns={[
                        {
                            name: (
                                <Checkbox
                                    checked={!!globalRelationships.length && globalRelationships.length === selectedGlobalRelationships.length}
                                    onClick={selectAll}
                                />
                            ),
                            className: "w-12 text-center",
                        },
                        { name: t("settings.Parent name"), className: "w-1/6 text-center" },
                        { name: t("settings.Child name"), className: "w-1/6 text-center" },
                        { name: t("settings.Description"), className: "w-[calc(calc(100%_/_6_*_4)_-_theme(spacing.12))] text-center" },
                    ]}
                    headerClassName="sticky top-0 z-50 bg-background"
                    scrollable={() => scrollableRef.current}
                    loadMore={nextPage}
                    hasMore={hasMore}
                    totalCount={globalRelationships.length}
                    loader={
                        <Flex justify="center" py="6" key={Utils.String.Token.shortUUID()}>
                            <Loading variant="secondary" />
                        </Flex>
                    }
                >
                    {relationships.map((relationship) => (
                        <GlobalRelationshipRow
                            key={relationship.uid}
                            globalRelationship={relationship}
                            selectedGlobalRelationships={selectedGlobalRelationships}
                            setSelectedGlobalRelationships={setSelectedGlobalRelationships}
                        />
                    ))}
                </InfiniteScroller.Table.Default>
                {!relationships.length && (
                    <Flex justify="center" items="center" h="full" mt="2">
                        {t("settings.No global relationships")}
                    </Flex>
                )}
                {!isAtTop && (
                    <Button
                        onClick={scrollToTop}
                        size="icon"
                        variant="outline"
                        className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 transform rounded-full shadow-md"
                    >
                        <IconComponent icon="arrow-up" size="4" />
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default GlobalRelationshipList;
