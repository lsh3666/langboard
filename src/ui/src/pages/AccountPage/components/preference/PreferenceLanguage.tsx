import { useTranslation } from "react-i18next";
import Flex from "@/components/base/Flex";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import UserPreferenceLanguageSwitcher from "@/components/LanguageSwitcher/UserPreference";

function PreferenceLanguage() {
    const { currentUser } = useAccountSetting();
    const [t] = useTranslation();

    return (
        <Flex items="center" pb="3" gap="3">
            <h4 className="text-lg font-semibold tracking-tight">{t("myAccount.Language")}</h4>
            <UserPreferenceLanguageSwitcher currentUser={currentUser} variant="outline" />
        </Flex>
    );
}

export default PreferenceLanguage;
