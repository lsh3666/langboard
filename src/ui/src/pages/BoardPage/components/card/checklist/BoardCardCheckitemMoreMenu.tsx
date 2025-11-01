import BoardCardCheckitemMoreMenuCardify from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemMoreMenuCardify";
import BoardCardCheckitemMoreMenuDelete from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemMoreMenuDelete";
import BoardCardCheckitemMoreMenuEdit from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemMoreMenuEdit";
import MoreMenu from "@/components/MoreMenu";
import { ModelRegistry } from "@/core/models/ModelRegistry";

function BoardCardCheckitemMoreMenu(): JSX.Element {
    const { model: checkitem } = ModelRegistry.ProjectCheckitem.useContext();
    const cardifieidCards = checkitem.useForeignFieldArray("cardified_card");

    return (
        <MoreMenu.Root modal={false} triggerProps={{ className: "h-8 w-5 sm:size-8" }}>
            <BoardCardCheckitemMoreMenuEdit />
            {!cardifieidCards.length && <BoardCardCheckitemMoreMenuCardify />}
            <BoardCardCheckitemMoreMenuDelete />
        </MoreMenu.Root>
    );
}

export default BoardCardCheckitemMoreMenu;
