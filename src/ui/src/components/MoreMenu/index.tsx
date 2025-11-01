import MoreMenuRoot from "@/components/MoreMenu/Root";
import MoreMenuDialogItem from "@/components/MoreMenu/DialogItem";
import MoreMenuDrawerItem from "@/components/MoreMenu/DrawerItem";
import MoreMenuPopoverItem from "@/components/MoreMenu/PopoverItem";
import { useMoreMenu } from "@/components/MoreMenu/Provider";
import { useMoreMenuItem } from "@/components/MoreMenu/ItemProvider";

export default {
    Root: MoreMenuRoot,
    DialogItem: MoreMenuDialogItem,
    DrawerItem: MoreMenuDrawerItem,
    PopoverItem: MoreMenuPopoverItem,
    useMoreMenu,
    useMoreMenuItem,
};
