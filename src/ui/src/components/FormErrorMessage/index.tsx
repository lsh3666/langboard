import { useTranslation } from "react-i18next";
import { Box, Flex, Form, IconComponent } from "@/components/base";
import { cn } from "@/core/utils/ComponentUtils";

export interface IFormErrorMessageProps {
    error: string;
    icon?: string;
    wrapperClassName?: string;
    messageClassName?: string;
    notInForm?: bool;
}

function FormErrorMessage({ error, icon, wrapperClassName, messageClassName, notInForm }: IFormErrorMessageProps): React.JSX.Element | null {
    const [t] = useTranslation();

    const comp = (
        <Flex items="center" gap="1" mt="1" className={wrapperClassName}>
            {icon && <IconComponent icon={icon} className="text-red-500" size="4" />}
            <Box textSize="sm" className={cn("text-red-500", messageClassName)}>
                {t(error)}
            </Box>
        </Flex>
    );

    if (notInForm) {
        return comp;
    }

    return <Form.Message>{comp}</Form.Message>;
}

export default FormErrorMessage;
