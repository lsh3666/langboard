import { forwardRef } from "react";
import FormErrorMessage from "@/components/FormErrorMessage";
import Floating from "@/components/base/Floating";
import Form from "@/components/base/Form";
import Input from "@/components/base/Input";

interface IBasePasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name?: string;
    label: string;
    autoFocus?: bool;
    className?: string;
    isFormControl?: bool;
    isValidating?: bool;
    autoComplete?: string;
    defaultValue?: string;
    error?: string;
}

interface IFormPasswordInputProps extends IBasePasswordInputProps {
    name: string;
    isFormControl: true;
    isValidating: bool;
}

interface IUnformedPasswordInputProps extends IBasePasswordInputProps {
    isFormControl?: false;
    error?: undefined;
}

export type TPasswordInputProps = IFormPasswordInputProps | IUnformedPasswordInputProps;

const PasswordInput = forwardRef<React.ComponentRef<typeof Input>, TPasswordInputProps>(
    ({ name, label, autoFocus, className, isFormControl, isValidating, autoComplete = "off", defaultValue, error, ...props }, ref) => {
        const comp = (
            <Floating.LabelInput
                type="password"
                name={name}
                label={label}
                autoFocus={autoFocus}
                autoComplete={autoComplete}
                className="pr-10"
                isFormControl={isFormControl}
                disabled={isValidating}
                defaultValue={defaultValue}
                wrapperProps={{ className }}
                ref={ref}
                {...props}
            />
        );

        if (isFormControl) {
            return (
                <Form.Field name={name}>
                    {comp}
                    {error && <FormErrorMessage error={error} />}
                </Form.Field>
            );
        } else {
            return comp;
        }
    }
);
export default PasswordInput;
