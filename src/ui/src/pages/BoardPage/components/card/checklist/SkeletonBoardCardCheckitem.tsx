import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Skeleton from "@/components/base/Skeleton";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";

function SkeletonBoardCardCheckitem() {
    return (
        <Box my="2" className="snap-center">
            <Flex
                items="center"
                justify="between"
                gap="2"
                h={{
                    initial: "16",
                    md: "12",
                }}
                w="full"
            >
                <Flex items="center" gap="2" w="full" className="truncate">
                    <Flex items="center" gap="1">
                        <Skeleton h="8" w="6" size={{ sm: "8" }} className="transition-all" />
                    </Flex>
                    <Flex
                        direction={{
                            initial: "col",
                            md: "row",
                        }}
                        items={{
                            md: "center",
                        }}
                        gap="0.5"
                        w="full"
                    >
                        <Flex items="center" justify="between" gap="1" mr="1">
                            <Flex items="center" gap="1">
                                <SkeletonUserAvatarList count={3} size={{ initial: "xs", lg: "sm" }} spacing="none" />
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
}

export default SkeletonBoardCardCheckitem;
