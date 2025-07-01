import { ctx } from "neko-helper";
import { BaseModel } from "neko-orm";
import { Request } from "neko-router";
import { NotFound } from "http-errors";
import { createParamDecorator } from "neko-router";
import * as yup from "yup";
export * from "neko-router";

export function Model(
    model: typeof BaseModel,
    paramName: string,
): ParameterDecorator
{
    return createParamDecorator(async () =>
    {
        let rc = await model.find(ctx().get<Request>("request").params[paramName]);
        if (!rc)
        {
            throw new NotFound("Object not found");
        }

        return rc;
    });
}

export function Param(paramName: string): ParameterDecorator
{
    return createParamDecorator(() =>
    {
        return ctx().get<Request>("request").params[paramName];
    });
}

export function ValidatedRequest(
    validationRules: yup.ObjectSchema<any>,
): ParameterDecorator
{
    return createParamDecorator(async () =>
    {
        const rc = await validationRules
            .noUnknown()
            .validate(ctx().get<Request>("request").body, { abortEarly: false });

        return rc;
    });
}
